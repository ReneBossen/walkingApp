-- Migration: Create activity_feed table
-- Description: Stores activity feed items (achievements, milestones, group joins, streaks)
-- for display on the home dashboard

-- Create enum type for activity types
CREATE TYPE activity_type AS ENUM ('milestone', 'friend_achievement', 'group_join', 'streak');

-- Create the activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type activity_type NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optional references for specific activity types
    related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    related_group_id UUID REFERENCES groups(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(type);

-- Enable Row Level Security
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own activity
CREATE POLICY "Users can view own activity"
    ON activity_feed
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can view activity from their friends
CREATE POLICY "Users can view friends activity"
    ON activity_feed
    FOR SELECT
    USING (
        user_id IN (
            SELECT
                CASE
                    WHEN requester_id = auth.uid() THEN addressee_id
                    ELSE requester_id
                END
            FROM friendships
            WHERE status = 'accepted'
            AND (requester_id = auth.uid() OR addressee_id = auth.uid())
        )
    );

-- Policy: System can insert activity (via service role or triggers)
CREATE POLICY "System can insert activity"
    ON activity_feed
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to create activity feed item when user hits a step milestone
CREATE OR REPLACE FUNCTION create_step_milestone_activity()
RETURNS TRIGGER AS $$
DECLARE
    daily_total INTEGER;
    user_display_name TEXT;
BEGIN
    -- Calculate daily total for the user
    SELECT COALESCE(SUM(step_count), 0) INTO daily_total
    FROM step_entries
    WHERE user_id = NEW.user_id
    AND DATE(recorded_at) = DATE(NEW.recorded_at);

    -- Get user's display name
    SELECT display_name INTO user_display_name
    FROM users WHERE id = NEW.user_id;

    -- Check for milestone achievements (10K, 15K, 20K, etc.)
    IF daily_total >= 10000 AND daily_total - NEW.step_count < 10000 THEN
        INSERT INTO activity_feed (user_id, type, message, metadata)
        VALUES (
            NEW.user_id,
            'milestone',
            user_display_name || ' hit 10,000 steps today! 🎉',
            jsonb_build_object('steps', daily_total, 'milestone', 10000)
        );
    ELSIF daily_total >= 15000 AND daily_total - NEW.step_count < 15000 THEN
        INSERT INTO activity_feed (user_id, type, message, metadata)
        VALUES (
            NEW.user_id,
            'milestone',
            user_display_name || ' hit 15,000 steps today! 🔥',
            jsonb_build_object('steps', daily_total, 'milestone', 15000)
        );
    ELSIF daily_total >= 20000 AND daily_total - NEW.step_count < 20000 THEN
        INSERT INTO activity_feed (user_id, type, message, metadata)
        VALUES (
            NEW.user_id,
            'milestone',
            user_display_name || ' hit 20,000 steps today! 💪',
            jsonb_build_object('steps', daily_total, 'milestone', 20000)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create milestone activity on step entry
CREATE TRIGGER on_step_entry_milestone
    AFTER INSERT ON step_entries
    FOR EACH ROW
    EXECUTE FUNCTION create_step_milestone_activity();

-- Function to create activity when user joins a group
CREATE OR REPLACE FUNCTION create_group_join_activity()
RETURNS TRIGGER AS $$
DECLARE
    user_display_name TEXT;
    group_name_val TEXT;
BEGIN
    SELECT display_name INTO user_display_name
    FROM users WHERE id = NEW.user_id;

    SELECT name INTO group_name_val
    FROM groups WHERE id = NEW.group_id;

    INSERT INTO activity_feed (user_id, type, message, metadata, related_group_id)
    VALUES (
        NEW.user_id,
        'group_join',
        user_display_name || ' joined "' || group_name_val || '"',
        jsonb_build_object('group_name', group_name_val),
        NEW.group_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create activity when user joins a group
CREATE TRIGGER on_group_member_join
    AFTER INSERT ON group_memberships
    FOR EACH ROW
    EXECUTE FUNCTION create_group_join_activity();

-- Function to create activity for new friendships
CREATE OR REPLACE FUNCTION create_friendship_activity()
RETURNS TRIGGER AS $$
DECLARE
    requester_name TEXT;
    addressee_name TEXT;
BEGIN
    IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
        SELECT display_name INTO requester_name
        FROM users WHERE id = NEW.requester_id;

        SELECT display_name INTO addressee_name
        FROM users WHERE id = NEW.addressee_id;

        -- Create activity for requester
        INSERT INTO activity_feed (user_id, type, message, metadata, related_user_id)
        VALUES (
            NEW.requester_id,
            'friend_achievement',
            requester_name || ' became friends with ' || addressee_name,
            jsonb_build_object('friend_name', addressee_name),
            NEW.addressee_id
        );

        -- Create activity for addressee
        INSERT INTO activity_feed (user_id, type, message, metadata, related_user_id)
        VALUES (
            NEW.addressee_id,
            'friend_achievement',
            addressee_name || ' became friends with ' || requester_name,
            jsonb_build_object('friend_name', requester_name),
            NEW.requester_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for friendship activity
CREATE TRIGGER on_friendship_accepted
    AFTER INSERT OR UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION create_friendship_activity();

-- Grant permissions
GRANT SELECT ON activity_feed TO authenticated;
GRANT INSERT ON activity_feed TO authenticated;
