import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GroupsStackScreenProps } from '@navigation/types';

type Props = GroupsStackScreenProps<'GroupDetail'>;

export default function GroupDetailScreen({ route }: Props) {
  const { groupId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Group Detail Screen</Text>
      <Text style={styles.subtext}>Group ID: {groupId}</Text>
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
