import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHousekeepingStatus } from '../context/HousekeepingStatus';

export function ReviewToggleFab() {
  const { reviewOverlayEnabled, setReviewOverlayEnabled } = useHousekeepingStatus();

  return (
    <View style={styles.fab} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.button, reviewOverlayEnabled && styles.buttonActive]}
        onPress={() => setReviewOverlayEnabled(!reviewOverlayEnabled)}
        activeOpacity={0.8}
        accessibilityLabel={reviewOverlayEnabled ? 'Exit design review' : 'Open design review'}
      >
        <Ionicons
          name={reviewOverlayEnabled ? 'close' : 'eye-outline'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    zIndex: 9999,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonActive: {
    backgroundColor: '#ff3b30',
  },
});
