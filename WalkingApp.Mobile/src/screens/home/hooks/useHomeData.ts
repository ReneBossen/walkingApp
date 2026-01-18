import { useEffect, useCallback, useState } from 'react';
import { useStepsStore } from '@store/stepsStore';
import { useUserStore } from '@store/userStore';
import { useActivityStore } from '@store/activityStore';
import { useNotificationsStore } from '@store/notificationsStore';
import { activityApi } from '@services/api/activityApi';
import { supabase } from '@services/supabase';

interface UseHomeDataReturn {
  // Step data
  todaySteps: number;
  todayDistance: number;
  dailyGoal: number;
  streak: number;
  weeklyAverage: number;
  weeklyTotal: number;

  // User data
  displayName: string;
  units: 'metric' | 'imperial';

  // Activity feed
  activityFeed: ReturnType<typeof useActivityStore>['feed'];

  // Notifications
  unreadCount: number;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
}

/**
 * Custom hook that fetches and manages all data needed for the home screen.
 * Handles loading states, error handling, and real-time updates.
 */
export const useHomeData = (): UseHomeDataReturn => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Steps store
  const {
    todaySteps,
    stats,
    isLoading: stepsLoading,
    error: stepsError,
    fetchTodaySteps,
    fetchStats,
  } = useStepsStore();

  // User store
  const { currentUser, fetchCurrentUser } = useUserStore();

  // Activity store
  const {
    feed: activityFeed,
    isLoading: activityLoading,
    error: activityError,
    fetchFeed,
    addActivityItem,
  } = useActivityStore();

  // Notifications store
  const { unreadCount, fetchUnreadCount } = useNotificationsStore();

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchTodaySteps(),
      fetchStats(),
      fetchFeed(10),
      fetchUnreadCount(),
      !currentUser && fetchCurrentUser(),
    ]);
  }, [fetchTodaySteps, fetchStats, fetchFeed, fetchUnreadCount, currentUser, fetchCurrentUser]);

  // Refresh handler for pull-to-refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Subscribe to real-time step updates
  useEffect(() => {
    const channel = supabase
      .channel('step_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'step_entries',
        },
        () => {
          // Refetch today's steps when changes occur
          fetchTodaySteps();
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetchTodaySteps, fetchStats]);

  // Subscribe to real-time activity feed updates
  useEffect(() => {
    const unsubscribe = activityApi.subscribeToFeed((item) => {
      addActivityItem(item);
    });

    return () => {
      unsubscribe();
    };
  }, [addActivityItem]);

  // Derived values
  const isLoading = stepsLoading || activityLoading;
  const error = stepsError || activityError;

  // User preferences with defaults
  const dailyGoal = currentUser?.preferences?.daily_step_goal ?? 10000;
  const units = currentUser?.preferences?.units ?? 'metric';
  const displayName = currentUser?.display_name ?? 'User';

  // Calculate today's distance from stats or use a default
  const todayDistance = stats?.today ? Math.round((stats.today / 1300) * 1000) : 0;

  // Weekly stats
  const weeklyTotal = stats?.week ?? 0;
  const weeklyAverage = weeklyTotal > 0 ? Math.round(weeklyTotal / 7) : 0;

  // Streak
  const streak = stats?.streak ?? 0;

  return {
    todaySteps,
    todayDistance,
    dailyGoal,
    streak,
    weeklyAverage,
    weeklyTotal,
    displayName,
    units,
    activityFeed,
    unreadCount,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
};
