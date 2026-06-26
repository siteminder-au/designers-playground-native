import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureBodyToClipboard, showReviewToast } from '../lib/reviewCapture';

export function ReviewCaptureFab() {
  const [capturing, setCapturing] = useState(false);

  if (Platform.OS !== 'web') return null;
  if (capturing) return null;

  async function handlePress() {
    setCapturing(true);
    // Two RAFs + a small timeout so React re-renders (FAB returns null) and
    // the browser paints the frame without the FAB before we hand the DOM to
    // html-to-image.
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    await new Promise<void>(r => setTimeout(r, 30));
    try {
      await captureBodyToClipboard();
      showReviewToast('Screenshot copied — type /design-review in Claude');
    } catch (err) {
      console.error('[ReviewCapture] failed:', err);
      showReviewToast(`Capture failed: ${(err as Error).message}`, true);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <View style={styles.fab} pointerEvents="box-none">
      <TouchableOpacity
        onPress={handlePress}
        style={styles.button}
        activeOpacity={0.8}
        accessibilityLabel="Capture screenshot for design review"
      >
        <Ionicons name="camera-outline" size={22} color="#fff" />
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});
