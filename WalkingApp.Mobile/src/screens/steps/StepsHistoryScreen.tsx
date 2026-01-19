import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import {
  Appbar,
  SegmentedButtons,
  Text,
  Divider,
  useTheme,
} from 'react-native-paper';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ErrorMessage } from '@components/common/ErrorMessage';
import { StepHistoryItem, StatsSummary, StepsChart } from './components';
import { useStepsStore } from '@store/stepsStore';
import { useUserStore } from '@store/userStore';
import type { DailyStepEntry } from '@store/stepsStore';

type ViewMode = 'daily' | 'weekly' | 'monthly';

/**
 * Calculates the date range based on the selected view mode.
 * - Daily: Last 7 days
 * - Weekly: Last 4 weeks
 * - Monthly: Last 30 days
 */
function getDateRange(viewMode: ViewMode): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  switch (viewMode) {
    case 'daily':
      start.setDate(start.getDate() - 6); // Last 7 days including today
      break;
    case 'weekly':
      start.setDate(start.getDate() - 27); // Last 4 weeks
      break;
    case 'monthly':
      start.setDate(start.getDate() - 29); // Last 30 days
      break;
  }

  return { start, end };
}

/**
 * Formats a Date to YYYY-MM-DD string format.
 */
function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Steps History screen displaying detailed walking activity over time.
 * Shows charts, statistics, and a list of daily entries.
 */
export default function StepsHistoryScreen() {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    dailyHistory,
    isHistoryLoading,
    historyError,
    fetchDailyHistory,
  } = useStepsStore();

  const { currentUser } = useUserStore();

  const dailyGoal = currentUser?.preferences.daily_step_goal ?? 10000;
  const units = currentUser?.preferences.units ?? 'metric';

  // Calculate date range based on view mode
  const dateRange = useMemo(() => getDateRange(viewMode), [viewMode]);

  // Fetch data when view mode changes
  useEffect(() => {
    const startStr = formatDateForApi(dateRange.start);
    const endStr = formatDateForApi(dateRange.end);
    fetchDailyHistory(startStr, endStr);
  }, [dateRange, fetchDailyHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const startStr = formatDateForApi(dateRange.start);
    const endStr = formatDateForApi(dateRange.end);
    await fetchDailyHistory(startStr, endStr);
    setIsRefreshing(false);
  }, [dateRange, fetchDailyHistory]);

  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value as ViewMode);
  }, []);

  const renderHistoryItem = useCallback(
    ({ item }: { item: DailyStepEntry }) => (
      <StepHistoryItem
        entry={item}
        dailyGoal={dailyGoal}
        units={units}
        testID={`history-item-${item.id}`}
      />
    ),
    [dailyGoal, units]
  );

  const keyExtractor = useCallback((item: DailyStepEntry) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <>
        <StepsChart
          entries={dailyHistory}
          viewMode={viewMode}
          dailyGoal={dailyGoal}
          testID="steps-chart"
        />

        <View style={styles.summaryContainer}>
          <StatsSummary
            entries={dailyHistory}
            dateRange={dateRange}
            units={units}
            testID="stats-summary"
          />
        </View>

        <View style={styles.historyHeader}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            History
          </Text>
          <Divider />
        </View>
      </>
    ),
    [dailyHistory, viewMode, dailyGoal, dateRange, units, theme.colors]
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          No step data recorded for this period.
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}
        >
          Start walking to see your history here!
        </Text>
      </View>
    ),
    [theme.colors]
  );

  // Show loading spinner only on initial load
  if (isHistoryLoading && dailyHistory.length === 0 && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.Content title="Steps History" />
        </Appbar.Header>
        <LoadingSpinner />
      </View>
    );
  }

  // Show error state
  if (historyError && !isRefreshing && dailyHistory.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.Content title="Steps History" />
        </Appbar.Header>
        <ErrorMessage message={historyError} onRetry={handleRefresh} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Steps History" />
      </Appbar.Header>

      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={handleViewModeChange}
          buttons={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={dailyHistory}
        renderItem={renderHistoryItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  segmentedButtons: {
    // SegmentedButtons handles its own styling
  },
  listContent: {
    paddingBottom: 24,
  },
  summaryContainer: {
    marginTop: 16,
  },
  historyHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptySubtext: {
    marginTop: 4,
  },
});
