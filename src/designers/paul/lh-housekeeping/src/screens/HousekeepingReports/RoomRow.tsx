import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { RoomStatus } from '../../context/HousekeepingStatus';
import FLAGS from '../../config/featureFlags';
import { COLORS } from '../../config/colors';
import { RoomDaySchedule, BadgeRect } from './types';
import { toBookingRef, formatTime } from './utils';
import { styles } from './styles';
import { CleaningControl } from './CleaningControl';

function OccupancyBadge({ isOccupied, adults, children, infants }: {
  isOccupied: boolean;
  adults: number;
  children: number;
  infants: number;
}) {
  if (!isOccupied) {
    return <Text style={styles.unoccupiedText}>Unoccupied</Text>;
  }
  const categories: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; count: number }[] = [
    { icon: 'account',       count: adults   },
    { icon: 'human-child',   count: children },
    { icon: 'baby-carriage', count: infants  },
  ];
  return (
    <View style={styles.occupancyRow}>
      <Text style={styles.occupancyLabel}>Occupied</Text>
      {categories.filter(c => c.count > 0).map(c => (
        <View key={c.icon} style={styles.occupancyItem}>
          <MaterialCommunityIcons name={c.icon} size={14} color="#6b7280" />
          <Text style={styles.occupancyCount}>{c.count}</Text>
        </View>
      ))}
    </View>
  );
}

const BED_CONFIG_KEYWORDS = ['extra bed', 'rollaway', 'king bed'];

function shouldShowBedConfig(config: string): boolean {
  const lower = config.toLowerCase();
  return BED_CONFIG_KEYWORDS.some(k => lower.includes(k));
}

function BedConfigDisplay({ config }: { config: string }) {
  return (
    <View style={styles.bedConfigBadge}>
      <Text style={styles.bedConfigText}>{config}</Text>
    </View>
  );
}

export function RoomRow({
  item,
  status,
  note,
  bedConfig,
  assignedTo,
  flags,
  onNotePress,
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
  onStatusPress: (rect: BadgeRect) => void;
  onAssignPress: () => void;
}) {
  return (
    <View style={styles.row}>
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
            {item.isOccupied && !item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#b81919' }]}>Occupied</Text>
              </>
            )}
            {item.room.isClosed && (
              <>
                <View style={styles.roomTitleSep} />
                <Text style={[styles.occupancyStatusText, { color: '#6b7280' }]}>Closed</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.rowRight}>
          <CleaningControl status={status} onPress={onStatusPress} />
        </View>
      </View>

      {/* Row 2: Bed config (only for special configs) */}
      {flags.showBedConfig && shouldShowBedConfig(bedConfig) && (
        <View style={styles.bedConfigRow}>
          <View style={styles.bedConfigLeft}>
            <BedConfigDisplay config={bedConfig} />
          </View>
        </View>
      )}

      {/* Row 3 (occupied or arriving today): guest name · reservation ID · badges · pax — individually flagged */}
      {(item.isOccupied || item.guestName !== null) && (flags.showGuestName || flags.showGuestPax || flags.showGuestDates || flags.showReservationId || flags.showLateCheckout) && (
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
            {/* Right column — check-in / check-out badges */}
            {flags.showLateCheckout && ((item.hasCheckoutToday && item.isOccupied) || (!item.isOccupied && item.guestName !== null)) && (
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                {item.hasCheckoutToday && item.isOccupied && (
                  <View style={item.checkOutTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkOutTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkOutTime ? `${formatTime(item.checkOutTime).toUpperCase()} check-out` : 'Checking out'}
                    </Text>
                  </View>
                )}
                {!item.isOccupied && item.guestName !== null && (
                  <View style={item.checkInTime ? styles.lateCheckoutBadge : styles.standardBadge}>
                    <Text style={item.checkInTime ? styles.lateCheckoutText : styles.standardBadgeText}>
                      {item.checkInTime ? `${formatTime(item.checkInTime).toUpperCase()} check-in` : 'Checking in'}
                    </Text>
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

      <TouchableOpacity style={styles.noteArea} onPress={onNotePress} activeOpacity={0.7}>
        <View style={styles.noteActionRow}>
          {/* Notes section — 70% when extras present, full width otherwise */}
          <View style={{ flex: item.extraItems.length > 0 ? 0.8 : 1 }}>
            {item.guestComments ? (
              <View style={{ gap: 6 }}>
                <Text numberOfLines={2} style={[styles.guestCommentsText, { flex: 1 }]}>
                  <Text style={styles.guestCommentsLabel}>Guest comments: </Text>{item.guestComments}
                </Text>
                {note ? (
                  <Text numberOfLines={2} style={[styles.noteText, { flex: 1 }]}>
                    <Text style={styles.staffNoteLabel}>Staff note: </Text>{note}
                  </Text>
                ) : (
                  <Text style={styles.addNoteText}>+ Staff notes</Text>
                )}
              </View>
            ) : note ? (
              <View style={styles.noteRow}>
                <Text numberOfLines={2} style={[styles.noteText, { flex: 1 }]}>
                  <Text style={styles.staffNoteLabel}>Staff note: </Text>{note}
                </Text>
              </View>
            ) : (
              <View style={styles.noteRow}>
                <Text style={styles.addNoteText}>+ Staff notes</Text>
              </View>
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
    </View>
  );
}
