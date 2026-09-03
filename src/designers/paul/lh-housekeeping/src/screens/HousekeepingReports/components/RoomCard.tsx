import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RoomStatus } from '../../../context/HousekeepingStatus';
import type { RoomDaySchedule } from '../types';
import { ORANGE } from '../constants';
import { CleaningControl, type BadgeRect } from './CleaningControl';
import styles from '../styles';

// Room status badge colours match the Figma "Room status badges" component
// (LH Mobile Housekeeping Enhancements Initiative, node 737:28827) — one
// pastel colour per check-in/check-out combination, driven by the same live
// hasCheckInToday/hasCheckoutToday fields as the rest of the schedule.
const ROOM_STATUS_BADGE = {
  checkIn:     { label: 'Check in',     bg: '#d9ebc7' },
  checkOut:    { label: 'Check out',    bg: '#eaeaea' },
  checkInOut:  { label: 'Check out/in', bg: '#ffecff' },
  stayThrough: { label: 'Stay through', bg: '#e6f0ff' },
} as const;

function roomStatusBadge(item: RoomDaySchedule) {
  if (!item.guestName || item.room.isClosed) return null;
  if (item.hasCheckInToday && item.hasCheckoutToday) return ROOM_STATUS_BADGE.checkInOut;
  if (item.hasCheckInToday) return ROOM_STATUS_BADGE.checkIn;
  if (item.hasCheckoutToday) return ROOM_STATUS_BADGE.checkOut;
  return ROOM_STATUS_BADGE.stayThrough;
}

export function RoomCard({
  item,
  status,
  note,
  onNotePress,
  onStatusPress,
}: {
  item: RoomDaySchedule;
  status: RoomStatus;
  note: string;
  onNotePress: () => void;
  onStatusPress: (rect: BadgeRect) => void;
}) {
  const badge = roomStatusBadge(item);
  const showGuestRow = !item.room.isClosed && !!item.guestName;
  const showPaxRow = showGuestRow && (item.adults > 0 || item.children > 0 || item.infants > 0);

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomCardTopRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.roomNumber} numberOfLines={1}>
            {/^\d+$/.test(item.room.number) ? `Room ${item.room.number}` : item.room.number}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.roomType}>{item.room.type.toUpperCase()}</Text>
            {item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#6b7280' }]}>Closed</Text>
              </>
            )}
          </View>
        </View>
        <CleaningControl status={status} onPress={onStatusPress} showIcon={false} />
      </View>

      {showGuestRow && (
        <View style={styles.roomCardMiddleRow}>
          <View style={styles.roomCardGuestRow}>
            <View style={styles.roomCardGuestName}>
              <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#333333" />
              <Text style={styles.roomCardGuestNameText} numberOfLines={1}>{item.guestName}</Text>
            </View>
            {badge && (
              <View style={[styles.roomStatusBadge, { backgroundColor: badge.bg }]}>
                <Text style={styles.roomStatusBadgeText}>{badge.label}</Text>
              </View>
            )}
          </View>
          {showPaxRow && (
            <View style={styles.roomCardPaxRow}>
              {item.adults > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-outline" size={14} color="#6b7280" />
                  <Text style={styles.occupancyCount}>{item.adults}</Text>
                </View>
              )}
              {item.children > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-child-outline" size={14} color="#6b7280" />
                  <Text style={styles.occupancyCount}>{item.children}</Text>
                </View>
              )}
              {item.infants > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="baby-face-outline" size={14} color="#6b7280" />
                  <Text style={styles.occupancyCount}>{item.infants}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.roomCardDivider} />

      {/* Room notes are keyed by roomId (independent of the current
          reservation), so the footer always renders — even for vacant or
          closed rooms — matching the Figma spec. */}
      <TouchableOpacity style={styles.roomCardNoteFooter} onPress={onNotePress} activeOpacity={0.7}>
        {note ? (
          <>
            <Text style={styles.roomCardNoteLabel}>Room note:</Text>
            <Text style={styles.roomCardNoteText} numberOfLines={1}>{note}</Text>
            <Text style={styles.roomCardViewNoteText}>View note</Text>
          </>
        ) : (
          <>
            <Ionicons name="add" size={12} color={ORANGE} />
            <Text style={styles.roomCardNoteEmptyText}>Room note</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
