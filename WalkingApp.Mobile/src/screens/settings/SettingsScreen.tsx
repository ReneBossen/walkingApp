import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, List, Divider, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';
import type { SettingsStackParamList } from '@navigation/types';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const signOut = useAuthStore((state) => state.signOut);
  const currentUser = useUserStore((state) => state.currentUser);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Account Section */}
      <View style={styles.section}>
        <Text
          variant="titleSmall"
          style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Account
        </Text>
        <List.Item
          title="Profile"
          description={currentUser?.display_name || 'View and edit your profile'}
          left={(props) => <List.Icon {...props} icon="account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={handleProfilePress}
          style={styles.listItem}
          accessibilityLabel="Go to profile"
          testID="settings-profile"
        />
      </View>

      <Divider style={styles.divider} />

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text
          variant="titleSmall"
          style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Session
        </Text>
        <Button
          mode="contained"
          onPress={handleLogout}
          loading={isLoading}
          disabled={isLoading}
          style={styles.logoutButton}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          accessibilityLabel="Log out"
          testID="settings-logout"
        >
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  listItem: {
    borderRadius: 8,
  },
  divider: {
    marginHorizontal: 16,
  },
  logoutButton: {
    marginTop: 8,
  },
});
