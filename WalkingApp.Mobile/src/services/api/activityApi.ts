import { apiClient } from './client';
import { supabase } from '../supabase';

/**
 * Activity item as returned to the mobile app.
 */
export interface ActivityItem {
  id: string;
  type: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  relatedUserId?: string;
  relatedGroupId?: string;
}

/**
 * Activity feed response with pagination info.
 */
export interface ActivityFeedResponse {
  items: ActivityItem[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Backend API response shape for activity item.
 * Uses camelCase from .NET backend.
 */
interface BackendActivityItemResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  relatedUserId?: string;
  relatedGroupId?: string;
}

/**
 * Backend API response shape for activity feed.
 * Uses camelCase from .NET backend.
 */
interface BackendActivityFeedResponse {
  items: BackendActivityItemResponse[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Maps a backend activity item (camelCase) to mobile format.
 */
function mapActivityItem(backend: BackendActivityItemResponse): ActivityItem {
  return {
    id: backend.id,
    type: backend.type,
    userId: backend.userId,
    userName: backend.userName,
    avatarUrl: backend.userAvatarUrl,
    message: backend.message,
    timestamp: backend.createdAt,
    metadata: backend.metadata,
    relatedUserId: backend.relatedUserId,
    relatedGroupId: backend.relatedGroupId,
  };
}

/**
 * Parameters for fetching the activity feed.
 */
export interface GetFeedParams {
  limit?: number;
  offset?: number;
}

export const activityApi = {
  /**
   * Fetches the activity feed for the current user from the backend API.
   * This includes friend achievements, milestones, and group activities.
   *
   * @param params - Optional pagination parameters (limit, offset)
   * @returns The activity feed response with items and pagination info
   */
  getFeed: async (params: GetFeedParams = {}): Promise<ActivityFeedResponse> => {
    const queryParams = new URLSearchParams();
    if (params.limit !== undefined) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }

    const query = queryParams.toString();
    const endpoint = query ? `/activity/feed?${query}` : '/activity/feed';

    const response = await apiClient.get<BackendActivityFeedResponse>(endpoint);

    return {
      items: response.items.map(mapActivityItem),
      totalCount: response.totalCount,
      hasMore: response.hasMore,
    };
  },

  /**
   * Subscribes to real-time activity feed updates using Supabase.
   * This uses Supabase real-time subscriptions to listen for new activity items.
   *
   * @param callback - Called when a new activity item is received
   * @param onError - Optional callback for error handling (errors are also logged to console)
   * @returns A function to unsubscribe from the feed
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
            // Fetch the full item with user details from the database
            // Note: We query the activity_feed table and join with users for user details
            const { data, error } = await supabase
              .from('activity_feed')
              .select(`
                id,
                type,
                user_id,
                message,
                metadata,
                created_at,
                related_user_id,
                related_group_id,
                users:user_id (
                  display_name,
                  avatar_url
                )
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
              // Handle the users join result - it could be null or an object
              const userData = data.users as { display_name?: string; avatar_url?: string } | null;

              callback({
                id: data.id,
                type: data.type,
                userId: data.user_id,
                userName: userData?.display_name ?? 'Unknown User',
                avatarUrl: userData?.avatar_url,
                message: data.message,
                timestamp: data.created_at,
                metadata: data.metadata as Record<string, unknown> | undefined,
                relatedUserId: data.related_user_id,
                relatedGroupId: data.related_group_id,
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
