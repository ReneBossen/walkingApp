import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking, Platform } from 'react-native';
import {
  Appbar,
  Text,
  Switch,
  Divider,
  useTheme,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useUserStore } from '@store/userStore';
import { getErrorMessage } from '@utils/errorUtils';

/**
 * Notification settings state for detailed notification preferences.
 * These are local state values that would typically be synced with backend.
 */
interface NotificationSettings {
  // Friend Activity
  friendRequests: boolean;
  friendAccepted: boolean;
  friendMilestones: boolean;
  // Groups
  groupInvites: boolean;
  leaderboardUpdates: boolean;
  competitionReminders: boolean;
  // Personal
  goalAchieved: boolean;
  streakReminders: boolean;
  weeklySummary: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  friendRequests: true,
  friendAccepted: true,
  friendMilestones: true,
  groupInvites: true,
  leaderboardUpdates: false,
  competitionReminders: true,
  goalAchieved: true,
  streakReminders: true,
  weeklySummary: true,
};

/**
 * Screen for configuring detailed notification preferences by category.
 */
export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { currentUser, updatePreferences } = useUserStore();

  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Check if master toggle is enabled
  const masterEnabled = currentUser?.preferences.notifications_enabled ?? true;

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const handleToggle = useCallback(
    async (key: keyof NotificationSettings) => {
      if (!masterEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable push notifications in the main Settings to configure notification preferences.',
          [{ text: 'OK' }]
        );
        return;
      }

      const newValue = !settings[key];
      setSettings((prev) => ({ ...prev, [key]: newValue }));

      // In a real implementation, this would save to the backend
      // For now, we just show a success message
      showSnackbar('Preference updated');
    },
    [masterEnabled, settings, showSnackbar]
  );

  const handleDismissSnackbar = useCallback(() => {
    setSnackbarVisible(false);
  }, []);

  const renderToggle = (
    key: keyof NotificationSettings,
    label: string,
    testId: string
  ) => (
    <View style={styles.toggleRow}>
      <Text
        variant="bodyMedium"
        style={[
          styles.toggleLabel,
          { color: masterEnabled ? theme.colors.onSurface : theme.colors.onSurfaceDisabled },
        ]}
      >
        {label}
      </Text>
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggle(key)}
        disabled={!masterEnabled}
        testID={testId}
        accessibilityLabel={`${label} toggle, currently ${settings[key] ? 'enabled' : 'disabled'}`}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={handleBack} accessibilityLabel="Go back" />
        <Appbar.Content title="Notification Settings" />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning if master toggle is disabled */}
        {!masterEnabled && (
          <View style={[styles.warningBanner, { backgroundColor: theme.colors.errorContainer }]}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onErrorContainer }}
            >
              Push notifications are disabled. Enable them in Settings to configure these preferences.
            </Text>
          </View>
        )}

        {/* Friend Activity Section */}
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Friend Activity
          </Text>
          {renderToggle('friendRequests', 'Friend Requests', 'notif-friend-requests')}
          {renderToggle('friendAccepted', 'Friend Accepted', 'notif-friend-accepted')}
          {renderToggle('friendMilestones', 'Friend Milestones', 'notif-friend-milestones')}
        </View>

        <Divider style={styles.divider} />

        {/* Groups Section */}
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Groups
          </Text>
          {renderToggle('groupInvites', 'Group Invites', 'notif-group-invites')}
          {renderToggle('leaderboardUpdates', 'Leaderboard Updates', 'notif-leaderboard-updates')}
          {renderToggle('competitionReminders', 'Competition Reminders', 'notif-competition-reminders')}
        </View>

        <Divider style={styles.divider} />

        {/* Personal Section */}
        <View style={styles.section}>
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Personal
          </Text>
          {renderToggle('goalAchieved', 'Daily Goal Achieved', 'notif-goal-achieved')}
          {renderToggle('streakReminders', 'Streak Reminders', 'notif-streak-reminders')}
          {renderToggle('weeklySummary', 'Weekly Summary', 'notif-weekly-summary')}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}
          >
            Note: These preferences control which notifications you receive when push notifications are enabled.
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={handleDismissSnackbar}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  warningBanner: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    flex: 1,
    marginRight: 16,
  },
  divider: {
    marginHorizontal: 16,
  },
  infoNote: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
