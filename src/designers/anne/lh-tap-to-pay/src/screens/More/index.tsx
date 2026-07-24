import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function MoreScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Housekeeping')}>
        <Ionicons name="sparkles-outline" size={22} color="#374151" style={styles.icon} />
        <Text style={styles.rowText}>Housekeeping</Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>
      <View style={styles.divider} />
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
});
