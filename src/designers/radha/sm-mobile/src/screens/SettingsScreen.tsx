import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation, route }: Props) {
  const { propertyName, propertyAddress, propertyStatus, channelStatus } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Property card */}
        <View style={styles.propertyCard}>
          <View style={styles.avatar}>
            <Ionicons name="business" size={36} color="white" />
          </View>
          <Text style={styles.propertyName}>{propertyName}</Text>
          <Text style={styles.propertyAddress}>{propertyAddress}</Text>
          <TouchableOpacity
            style={styles.switchBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home', { openModal: true })}
          >
            <Ionicons name="swap-horizontal" size={16} color="#1D4ED8" />
            <Text style={styles.switchBtnText}>Switch Properties</Text>
          </TouchableOpacity>
        </View>

        {/* Status section */}
        <View style={styles.menuCard}>
          <MenuItem
            icon="business-outline"
            label="Property Status"
            statusOk={propertyStatus === 'ok'}
            showExternalLink={false}
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="share-social-outline"
            label="Channel Status"
            statusOk={channelStatus === 'ok'}
            showExternalLink={false}
            onPress={() => {}}
          />
        </View>

        {/* Help & Support */}
        <Text style={styles.sectionLabel}>Help &amp; Support</Text>
        <View style={styles.menuCard}>
          <MenuItem icon="happy-outline"       label="Leave Feedback" showExternalLink onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="newspaper-outline"   label="Help Centre"    showExternalLink onPress={() => {}} />
          <View style={styles.menuDivider} />
          <MenuItem icon="chatbubbles-outline" label="Chat Support"   showExternalLink={false} onPress={() => {}} />
        </View>

        {/* Log out */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text style={styles.logoutLabel}>Log out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 14.2.1 (1234)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon, label, statusOk, showExternalLink, onPress,
}: {
  icon: string; label: string; statusOk?: boolean;
  showExternalLink: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon as any} size={22} color="#374151" />
        {statusOk !== undefined && (
          <View style={[styles.statusBadge, statusOk ? styles.statusBadgeOk : styles.statusBadgeError]}>
            <Ionicons name={statusOk ? 'checkmark' : 'close'} size={8} color="white" />
          </View>
        )}
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name={showExternalLink ? 'open-outline' : 'chevron-forward'} size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { padding: 16, gap: 12 },
  propertyCard: {
    backgroundColor: 'white', borderRadius: 12, padding: 20, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#1D4ED8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  propertyName: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  propertyAddress: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 2 },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  switchBtnText: { fontSize: 14, fontWeight: '600', color: '#1D4ED8' },
  menuCard: {
    backgroundColor: 'white', borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 56 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  menuIconWrap: { width: 26, alignItems: 'center', position: 'relative' },
  statusBadge: {
    position: 'absolute', bottom: -3, right: -5,
    width: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'white',
  },
  statusBadgeOk: { backgroundColor: '#16A34A' },
  statusBadgeError: { backgroundColor: '#EF4444' },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827' },
  logoutLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#EF4444' },
  sectionLabel: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 4 },
  version: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
});
