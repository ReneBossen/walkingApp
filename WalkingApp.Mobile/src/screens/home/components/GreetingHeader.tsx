import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface GreetingHeaderProps {
  displayName: string;
}

/**
 * Displays a time-based greeting with the user's display name.
 * Changes greeting based on time of day:
 * - Morning: 5 AM - 12 PM
 * - Afternoon: 12 PM - 5 PM
 * - Evening: 5 PM - 5 AM
 */
export const GreetingHeader: React.FC<GreetingHeaderProps> = ({ displayName }) => {
  const theme = useTheme();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }, []);

  const firstName = displayName.split(' ')[0];

  return (
    <View style={styles.container}>
      <Text
        variant="headlineMedium"
        style={[styles.greeting, { color: theme.colors.onBackground }]}
        accessibilityRole="header"
        accessibilityLabel={`${greeting}, ${firstName}`}
      >
        {greeting}, {firstName}!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
