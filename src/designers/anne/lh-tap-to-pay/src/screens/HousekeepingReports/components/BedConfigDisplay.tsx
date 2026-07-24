import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles';

export function BedConfigDisplay({ config }: { config: string }) {
  return (
    <View style={styles.bedConfigBadge}>
      <Text style={styles.bedConfigText}>{config}</Text>
    </View>
  );
}
