import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RoomStatus } from '../../../context/HousekeepingStatus';
import { COLORS } from '../../../config/colors';
import type FLAGS from '../../../config/featureFlags';
import { ORANGE } from '../constants';
import type { RoomDaySchedule } from '../types';
import { formatTime, toBookingRef } from '../utils/dateFormat';
import { shouldShowBedConfig } from '../utils/bedConfig';
import { CleaningControl, type BadgeRect } from './CleaningControl';
import { BedConfigDisplay } from './BedConfigDisplay';
import styles from '../styles';

export function RoomRow({
  item,
  status,
  note,
  bedConfig,
  assignedTo,
  flags,
  onNotePress,
  onEditNotePress,
  onStatusPress,
  onAssignPress,
}: {
  item: RoomDaySchedule;
  status: RoomStatus;
  note: string;
  bedConfig: string;
  assignedTo: string | null;
  flags: typeof FLAGS;
  onNotePress: () => void;
  onEditNotePress?: () => void;
  onStatusPress: (rect: BadgeRect) => void;
  onAssignPress: () => void;
}) {
  return (
    <View style={[styles.row, !item.reservationId && { paddingBottom: 16 }]}>
      {/* Row 1: Room number · Occupied/Unoccupied  |  CleaningControl */}
      <View style={styles.rowTop}>
        <View style={styles.rowLeft}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.roomNumber}>
              {/^\d+$/.test(item.room.number) ? `Room ${item.room.number}` : item.room.number}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Text style={styles.roomType}>{item.room.type.toUpperCase()}</Text>
            {item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#6b7280' }]}>Closed</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.rowRight}>
          <CleaningControl status={status} onPress={onStatusPress} showIcon={flags.showStatusIcon} />
        </View>
      </View>


      {/* COMPACT VARIANT: hide bed config + full guest info section. Show the
          check-in/out badge anchored to the LEFT (where guest name normally sits). */}
      {flags.compactCard ? (
        (item.guestName !== null && !item.room.isClosed) && (
          <View style={styles.compactBadgeRow}>
            {item.hasCheckInToday && item.hasCheckoutToday ? (
              <View style={styles.checkInOutBadge}>
                <Text style={styles.checkInOutText}>Check-out/in</Text>
              </View>
            ) : item.hasCheckInToday ? (
              <View style={item.checkInTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                <Text style={item.checkInTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                  {item.checkInTime ? `${formatTime(item.checkInTime).toUpperCase()} check-in` : 'Checking in'}
                </Text>
              </View>
            ) : item.hasCheckoutToday ? (
              <View style={item.checkOutTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                <Text style={item.checkOutTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                  {item.checkOutTime ? `${formatTime(item.checkOutTime).toUpperCase()} check-out` : 'Checking out'}
                </Text>
              </View>
            ) : (
              <View style={styles.standardBadge}>
                <Text style={styles.standardBadgeText}>Stay-through</Text>
              </View>
            )}
          </View>
        )
      ) : null}

      {/* Row 2: Bed config (only for special configs) — hidden in compact mode */}
      {!flags.compactCard && flags.showBedConfig && shouldShowBedConfig(bedConfig) && (
        <View style={styles.bedConfigRow}>
          <View style={styles.bedConfigLeft}>
            <BedConfigDisplay config={bedConfig} />
          </View>
        </View>
      )}

      {/* Row 3 (occupied or arriving today): guest name · reservation ID · badges · pax — hidden in compact mode */}
      {!flags.compactCard && (item.isOccupied || item.guestName !== null) && (flags.showGuestName || flags.showGuestPax || flags.showGuestDates || flags.showReservationId || flags.showLateCheckout) && (
        <View style={styles.guestInfoSection}>
          {/* Main row: left (name + resID) | right (badges) */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Left column — name + reservation ID */}
            <View style={{ flex: 1, gap: 12 }}>
              {flags.showGuestName && item.guestName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="card-account-details-outline" size={12} color="#333333" />
                  <Text style={styles.guestNameText}>{item.guestName}</Text>
                </View>
              )}
              {flags.showReservationId && item.reservationId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="tag-outline" size={12} color="#333333" />
                  <Text style={styles.reservationIdText}>#{toBookingRef(item.reservationId)}</Text>
                </View>
              )}
            </View>
            {/* Right column — stay-through / check-in / check-out / check-out-in badges */}
            {flags.showLateCheckout && item.guestName !== null && !item.room.isClosed && (
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                {item.hasCheckInToday && item.hasCheckoutToday ? (
                  <View style={styles.checkInOutBadge}>
                    <Text style={styles.checkInOutText}>Check-out/in</Text>
                  </View>
                ) : item.hasCheckInToday ? (
                  <View style={item.checkInTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkInTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkInTime ? `${formatTime(item.checkInTime).toUpperCase()} check-in` : 'Checking in'}
                    </Text>
                  </View>
                ) : item.hasCheckoutToday ? (
                  <View style={item.checkOutTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkOutTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkOutTime ? `${formatTime(item.checkOutTime).toUpperCase()} check-out` : 'Checking out'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.standardBadge}>
                    <Text style={styles.standardBadgeText}>Stay-through</Text>
                  </View>
                )}
              </View>
            )}
          </View>
          {/* Pax counts row */}
          {flags.showGuestPax && (
            <View style={[styles.guestDatesRow, { marginTop: 12 }]}>
              {item.adults > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.adults}</Text>
                </View>
              )}
              {item.children > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="account-child-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.children}</Text>
                </View>
              )}
              {item.infants > 0 && (
                <View style={styles.occupancyItem}>
                  <MaterialCommunityIcons name="baby-face-outline" size={13} color={COLORS.Black[200]} />
                  <Text style={styles.occupancyCount}>{item.infants}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Notes/extras row — only renders when the room has an active
          reservation. Vacant rooms collapse to just the header card. */}
      {item.reservationId && (
      <TouchableOpacity style={styles.noteArea} onPress={onNotePress} activeOpacity={0.7}>
        <View style={styles.noteActionRow}>
          {/* Notes section — 70% when extras present, full width otherwise.
              Render up to three stacked lines: guest comments → staff note
              (read-only) → housekeeping note (editable, with pencil) or the
              "+ Housekeeping notes" CTA when no thread yet. Each truncates
              to 2 lines. */}
          <View style={{ flex: item.extraItems.length > 0 ? 0.8 : 1, gap: 6 }}>
            {item.guestComments && (
              <Text numberOfLines={2} style={[styles.guestCommentsText, { flex: 1 }]}>
                <Text style={styles.guestCommentsLabel}>Guest comments: </Text>{item.guestComments}
              </Text>
            )}
            {item.staffNote && (
              <Text numberOfLines={2} style={[styles.noteText, { flexShrink: 1 }]}>
                <Text style={styles.staffNoteLabel}>Reservation note: </Text>{item.staffNote}
              </Text>
            )}
            {note ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text numberOfLines={2} style={[styles.noteText, { flexShrink: 1 }]}>
                  <Text style={styles.staffNoteLabel}>Room note: </Text>{note}
                </Text>
                {onEditNotePress && (
                  <TouchableOpacity onPress={onEditNotePress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="pencil-outline" size={14} color={ORANGE} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <Text style={styles.addNoteText}>+ Room notes</Text>
            )}
          </View>
          {item.extraItems.length > 0 && (
            <>
              {/* Vertical divider */}
              <View style={styles.noteDivider} />
              {/* Extras section — 20% width */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasCount}>{item.extraItems.length}</Text>
                <Text style={styles.extrasLabel}>Extras</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
      )}
    </View>
  );
}
