import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HowToTapTutorial } from '../../components/payments/HowToTapTutorial';

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const [showHowToTap, setShowHowToTap] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Housekeeping')}>
        <Ionicons name="sparkles-outline" size={22} color="#374151" style={styles.icon} />
        <Text style={styles.rowText}>Housekeeping</Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Payments</Text>
      <TouchableOpacity style={styles.row} onPress={() => setShowHowToTap(true)}>
        <Ionicons name="wifi-outline" size={22} color="#374151" style={styles.icon} />
        <Text style={styles.rowText}>How Tap to Pay on iPhone works</Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
      <View style={styles.divider} />

      <HowToTapTutorial visible={showHowToTap} onClose={() => setShowHowToTap(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: { marginRight: 14 },
  rowText: { flex: 1, fontSize: 16, color: '#111' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginTop: 8 },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
});
