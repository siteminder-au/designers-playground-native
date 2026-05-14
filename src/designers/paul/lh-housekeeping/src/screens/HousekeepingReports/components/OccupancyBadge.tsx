import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import styles from '../styles';

export function OccupancyBadge({ isOccupied, adults, children, infants }: {
  isOccupied: boolean;
  adults: number;
  children: number;
  infants: number;
}) {
  if (!isOccupied) {
    return <Text style={styles.unoccupiedText}>Unoccupied</Text>;
  }
  const categories: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; count: number }[] = [
    { icon: 'account',       count: adults   },
    { icon: 'human-child',   count: children },
    { icon: 'baby-carriage', count: infants  },
  ];
  return (
    <View style={styles.occupancyRow}>
      <Text style={styles.occupancyLabel}>Occupied</Text>
      {categories.filter(c => c.count > 0).map(c => (
        <View key={c.icon} style={styles.occupancyItem}>
          <MaterialCommunityIcons name={c.icon} size={14} color="#6b7280" />
          <Text style={styles.occupancyCount}>{c.count}</Text>
        </View>
      ))}
    </View>
  );
}
