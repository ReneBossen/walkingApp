-- Migration: Create friendships table and update RLS policies
-- Description: Creates the friendships table for managing friend relationships and updates RLS policies for users and step_entries tables
-- Date: 2026-01-16
--
-- Execution Instructions:
-- 1. Log in to Supabase Dashboard (https://app.supabase.com)
-- 2. Navigate to your project
-- 3. Go to the SQL Editor section
-- 4. Create a new query
-- 5. Copy and paste this entire migration script
-- 6. Click "Run" to execute the migration
-- 7. Verify the table, policies, and function were created successfully
-- 8. Test with a simple SELECT query: SELECT * FROM friendships LIMIT 1;

-- Create friendships table
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,

    CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
    CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view friendships they're part of
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS Policy: Users can send friend requests (insert as requester)
CREATE POLICY "Users can send friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- RLS Policy: Addressee can update status (accept/reject)
CREATE POLICY "Addressee can respond to requests"
    ON friendships FOR UPDATE
    USING (auth.uid() = addressee_id AND status = 'pending')
    WITH CHECK (auth.uid() = addressee_id);

-- RLS Policy: Either party can delete friendship
CREATE POLICY "Users can remove friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Create helper function for getting friend IDs
CREATE OR REPLACE FUNCTION get_friend_ids(p_user_id UUID)
RETURNS TABLE (friend_id UUID)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT CASE
        WHEN requester_id = p_user_id THEN addressee_id
        ELSE requester_id
    END as friend_id
    FROM friendships
    WHERE (requester_id = p_user_id OR addressee_id = p_user_id)
      AND status = 'accepted';
$$;

-- Add RLS policy to users table to allow friends to view each other's profiles
CREATE POLICY "Users can view friends profiles"
    ON users FOR SELECT
    USING (
        id = auth.uid() OR
        id IN (
            SELECT CASE
                WHEN requester_id = auth.uid() THEN addressee_id
                ELSE requester_id
            END
            FROM friendships
            WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
              AND status = 'accepted'
        )
    );

-- Add RLS policy to step_entries table to allow friends to view each other's steps
-- Note: This assumes step_entries table exists from Plan 3
-- If step_entries doesn't exist yet, comment out this section
CREATE POLICY "Users can view friends steps"
    ON step_entries FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT CASE
                WHEN requester_id = auth.uid() THEN addressee_id
                ELSE requester_id
            END
            FROM friendships
            WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
              AND status = 'accepted'
        )
    );

-- Add comments to table and columns
COMMENT ON TABLE friendships IS 'Friendship relationships between users';
COMMENT ON COLUMN friendships.id IS 'Unique identifier for the friendship';
COMMENT ON COLUMN friendships.requester_id IS 'ID of the user who sent the friend request';
COMMENT ON COLUMN friendships.addressee_id IS 'ID of the user who received the friend request';
COMMENT ON COLUMN friendships.status IS 'Status of the friendship: pending, accepted, rejected, or blocked';
COMMENT ON COLUMN friendships.created_at IS 'Timestamp when the friend request was created';
COMMENT ON COLUMN friendships.accepted_at IS 'Timestamp when the friend request was accepted';
