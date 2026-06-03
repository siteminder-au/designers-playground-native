import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Invite-link target a no-app user would open. Faux, for the demo.
const INVITE_URL = 'hk.siteminder.app/r/x9f3k2';

/**
 * Wraps the (limited) Housekeeping screen in faux mobile-browser chrome — a
 * grey top bar with a locked address bar showing the invite URL, plus a
 * Chrome-style bottom toolbar (back/forward · new tab · tab count · menu).
 * The browser view is identical to the Limited view; it just "sits inside a
 * browser".
 */
export function BrowserChrome({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* Top: address bar */}
      <View style={[styles.chrome, { paddingTop: insets.top + 6 }]}>
        <View style={styles.addressBar}>
          <Ionicons name="lock-closed" size={11} color="#6b7280" />
          <Text style={styles.addressUrl} numberOfLines={1}>{INVITE_URL}</Text>
          <Ionicons name="reload" size={13} color="#6b7280" />
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {/* Bottom: Chrome-style navigation toolbar */}
      <LinearGradient colors={['#f7f7f8', '#d6d7da']} style={[styles.bottomBar, { paddingBottom: insets.bottom || 8 }]}>
        <Ionicons name="arrow-back" size={26} color="#b8babf" />
        <Ionicons name="arrow-forward" size={26} color="#b8babf" />
        <View style={styles.plusCircle}>
          <Ionicons name="add" size={26} color="#5f6368" />
        </View>
        <View style={styles.tabCount}>
          <Text style={styles.tabCountText}>7</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={24} color="#5f6368" />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e3e5e8' },
  chrome: { backgroundColor: '#e3e5e8', paddingHorizontal: 12, paddingBottom: 8 },
  addressBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8,
  },
  addressUrl: { flex: 1, fontSize: 13, color: '#374151' },
  content: { flex: 1 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 10,
  },
  plusCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  tabCount: {
    minWidth: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: '#5f6368',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  tabCountText: { fontSize: 12, fontWeight: '700', color: '#5f6368' },
});
