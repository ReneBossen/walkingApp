import { supabase } from '../supabase';

export interface ActivityItem {
  id: string;
  type: 'milestone' | 'friend_achievement' | 'group_join' | 'streak';
  userId?: string;
  userName?: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
}

export const activityApi = {
  /**
   * Fetches the activity feed for the current user
   * This includes friend achievements, milestones, and group activities
   *
   * Note: activity_feed.user_id references auth.users(id), not public.users,
   * so we cannot use a Supabase join. User details would need to be fetched
   * separately or stored denormalized in the activity_feed table.
   */
  getFeed: async (limit: number = 10): Promise<ActivityItem[]> => {
    // Fetch activity feed entries without user join
    // The user_id references auth.users which cannot be joined from public schema
    const { data: activities, error: activityError } = await supabase
      .from('activity_feed')
      .select(`
        id,
        type,
        user_id,
        message,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (activityError && activityError.code !== 'PGRST116') {
      throw activityError;
    }

    // Map the data to ActivityItem format
    // Note: userName and avatarUrl are not available without a public users table
    // These could be populated if the activity_feed table stores denormalized user data
    const items: ActivityItem[] = (activities || []).map((item: any) => ({
      id: item.id,
      type: item.type as ActivityItem['type'],
      userId: item.user_id,
      userName: undefined,
      avatarUrl: undefined,
      message: item.message,
      timestamp: item.created_at,
    }));

    return items;
  },

  /**
   * Subscribes to real-time activity feed updates
   * @param callback - Called when a new activity item is received
   * @param onError - Optional callback for error handling (errors are also logged to console)
   */
  subscribeToFeed: (callback: (item: ActivityItem) => void, onError?: (error: Error) => void) => {
    const subscription = supabase
      .channel('activity_feed_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_feed',
        },
        async (payload) => {
          try {
            // Fetch the full item without user join
            // The user_id references auth.users which cannot be joined from public schema
            const { data, error } = await supabase
              .from('activity_feed')
              .select(`
                id,
                type,
                user_id,
                message,
                created_at
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              const fetchError = new Error(`Failed to fetch activity item: ${error.message}`);
              console.error('[activityApi] Real-time subscription error:', fetchError.message);
              onError?.(fetchError);
              return;
            }

            if (data) {
              callback({
                id: data.id,
                type: data.type as ActivityItem['type'],
                userId: data.user_id,
                userName: undefined,
                avatarUrl: undefined,
                message: data.message,
                timestamp: data.created_at,
              });
            }
          } catch (error) {
            const wrappedError = error instanceof Error
              ? error
              : new Error('Unknown error in activity feed subscription');
            console.error('[activityApi] Real-time subscription error:', wrappedError.message);
            onError?.(wrappedError);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};
