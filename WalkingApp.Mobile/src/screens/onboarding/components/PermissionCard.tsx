import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, useTheme } from 'react-native-paper';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface PermissionCardProps {
  emoji: string;
  title: string;
  description: string;
  status: PermissionStatus;
  onRequestPermission: () => void;
}

export default function PermissionCard({
  emoji,
  title,
  description,
  status,
  onRequestPermission,
}: PermissionCardProps) {
  const theme = useTheme();

  const getButtonText = () => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      default:
        return 'Allow';
    }
  };

  const getButtonMode = () => {
    return status === 'granted' ? 'outlined' : 'contained';
  };

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
        </View>
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
        <Button
          mode={getButtonMode()}
          onPress={onRequestPermission}
          disabled={status === 'granted' || status === 'denied'}
          style={styles.button}
        >
          {getButtonText()}
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  title: {
    fontWeight: '600',
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
});
