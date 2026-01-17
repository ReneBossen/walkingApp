import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FriendsStackScreenProps } from '@navigation/types';

type Props = FriendsStackScreenProps<'UserProfile'>;

export default function UserProfileScreen({ route }: Props) {
  const { userId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>User Profile Screen</Text>
      <Text style={styles.subtext}>User ID: {userId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#666',
  },
});
