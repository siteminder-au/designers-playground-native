import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ClosedRoomsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Closed Rooms</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  text: { fontSize: 20, fontWeight: '600', color: '#374151' },
  sub: { fontSize: 14, color: '#9ca3af', marginTop: 6 },
});
