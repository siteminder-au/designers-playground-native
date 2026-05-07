import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ── Tokens ────────────────────────────────────────────────────────────────────

const ORANGE    = '#ff6842';
const BG        = '#f2f3f3';
const UNREAD_BG = '#fff5ee';
const MUTED     = '#9ba0a0';
const DIVIDER   = '#e5e8e8';

// ── Placeholder data ──────────────────────────────────────────────────────────

interface NotifItem {
  id: string;
  title: string;
  subtitle?: string;
  time: string;
  property: string;
  isRead: boolean;
  isExpandable?: boolean;
}

interface NotifSection {
  title: string;
  items: NotifItem[];
}

const SECTIONS: NotifSection[] = [
  {
    title: 'Today',
    items: [
      {
        id: '1',
        title: 'Demand Plus invoice reconciliation due',
        subtitle: 'Ensure transactions are accurate by dd/mm/yyyy.',
        time: '10:14 am',
        property: 'The Ecofern Hotel',
        isRead: false,
      },
      {
        id: '2',
        title: '4 New reservations created',
        time: '10:14 am',
        property: 'The Mobile Hotel',
        isRead: false,
        isExpandable: true,
      },
      {
        id: '3',
        title: 'Demand Plus invoice reconciliation due',
        subtitle: 'Ensure transactions are accurate by dd/mm/yyyy.',
        time: '10:14 am',
        property: 'The Ecofern Hotel',
        isRead: false,
      },
      {
        id: '4',
        title: 'Demand Plus invoice reconciliation due',
        subtitle: 'Ensure transactions are accurate by dd/mm/yyyy.',
        time: '10:14 am',
        property: 'The Ecofern Hotel',
        isRead: false,
      },
    ],
  },
  {
    title: 'Earlier',
    items: [
      {
        id: '5',
        title: '4 New reservations created',
        time: '27 April',
        property: 'The Mobile Hotel',
        isRead: true,
        isExpandable: true,
      },
    ],
  },
];

const FILTER_CHIPS = ['Billing', 'Reservations', 'Demand +', 'Payments'];

// ── Sub-components ────────────────────────────────────────────────────────────

function NotificationRow({ item, isFirst }: { item: NotifItem; isFirst: boolean }) {
  const bg       = item.isRead ? '#fff' : UNREAD_BG;
  const dotColor = item.isRead ? '#c8cbcb' : ORANGE;

  return (
    <>
      {!isFirst && <View style={styles.rowDivider} />}
      <TouchableOpacity activeOpacity={0.7} style={[styles.notifRow, { backgroundColor: bg }]}>
        {/* Unread dot */}
        <View style={styles.dotCol}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        </View>

        {/* Body */}
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
          ) : null}
          <View style={styles.rowMeta}>
            <Text style={styles.metaText}>{item.time}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{item.property}</Text>
          </View>
        </View>

        {/* Expand chevron */}
        {item.isExpandable ? (
          <View style={styles.chevronCol}>
            <Ionicons name="chevron-down" size={16} color={MUTED} />
          </View>
        ) : null}
      </TouchableOpacity>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Row 1: property selector + actions */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.propertyPill} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="office-building-outline"
              size={16}
              color="#484b4b"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.propertyPillText}>All properties</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={20} color="#484b4b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Row 2: filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
          style={styles.chipsScroll}
        >
          {FILTER_CHIPS.map((chip) => (
            <TouchableOpacity key={chip} style={styles.filterChip} activeOpacity={0.7}>
              <Text style={styles.filterChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            <View style={styles.cardGroup}>
              {section.items.map((item, i) => (
                <NotificationRow key={item.id} item={item} isFirst={i === 0} />
              ))}
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>
            That's all the notifications you have for the last 90 days.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },

  // Header
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  propertyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  propertyPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  selectText: {
    fontSize: 16,
    color: ORANGE,
    letterSpacing: -0.31,
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter chips
  chipsScroll: { flexGrow: 0 },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    height: 33,
    paddingHorizontal: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccd1d1',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 14,
    color: '#484b4b',
    letterSpacing: -0.15,
  },

  // Scroll
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingTop: 8 },

  // Section
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    letterSpacing: -0.31,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  // Card group
  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 12,
    minHeight: 67,
  },
  rowDivider: {
    height: 1,
    backgroundColor: DIVIDER,
  },

  // Dot column
  dotCol: {
    width: 26,
    alignItems: 'center',
    paddingTop: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Row body
  rowBody: { flex: 1 },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    letterSpacing: -0.23,
    lineHeight: 20,
  },
  rowSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6d7272',
    letterSpacing: -0.15,
    lineHeight: 18,
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: MUTED,
    letterSpacing: 0.06,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MUTED,
    marginHorizontal: 4,
  },

  // Chevron column
  chevronCol: {
    marginLeft: 8,
    justifyContent: 'center',
    alignSelf: 'center',
  },

  // Footer
  footer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  footerDivider: {
    width: '90%',
    height: 1,
    backgroundColor: DIVIDER,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    letterSpacing: -0.15,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
