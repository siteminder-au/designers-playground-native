import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Decorative native-iOS-style status bar rendered above the app content,
// matching the "StatusBar" frame in the Figma design (LH Mobile Housekeeping
// Enhancements Initiative). This is a static 9:41/wifi/battery mock, not a
// real OS status bar — the app runs as React Native Web with no device
// chrome of its own, so every screen needs this drawn in.
export function FakeStatusBar() {
  return (
    <View style={styles.bar}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.right}>
        <Ionicons name="wifi" size={15} color="#000" />
        <View style={styles.battery}>
          <View style={styles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingLeft: 28,
    paddingRight: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  time: { fontSize: 15, fontWeight: '600', color: '#000' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  battery: {
    width: 26,
    height: 13,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 3,
    padding: 1,
    justifyContent: 'center',
  },
  batteryFill: { width: 20, height: 8, backgroundColor: '#000', borderRadius: 1.5 },
});
