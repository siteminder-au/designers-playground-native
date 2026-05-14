import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../config/colors';
import type { RoomStatus } from '../../../../context/HousekeepingStatus';
import type { RoomDaySchedule, DaySchedule } from '../../types';
import { STATUS_CONFIG } from '../../constants';
import styles from '../../styles';

export function PrintPreviewModal({
  visible,
  onClose,
  headerText,
  dateRange,
  schedule,
  singleRooms,
  statusOverrides,
  notes,
  printSettingsVisible,
  closePrintSettings,
  printSettingsSheetAnim,
  printSettingsTranslateY,
  printSettingsPanResponder,
  printPageCount,
  moreSettingsExpanded,
  setMoreSettingsExpanded,
  headersAndFooters,
  setHeadersAndFooters,
  insetsTop,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  headerText: string;
  dateRange: { start: string; end: string } | null;
  schedule: DaySchedule[];
  singleRooms: RoomDaySchedule[];
  statusOverrides: Record<string, RoomStatus>;
  notes: Record<string, string>;
  printSettingsVisible: boolean;
  closePrintSettings: () => void;
  printSettingsSheetAnim: Animated.Value;
  printSettingsTranslateY: Animated.Value;
  printSettingsPanResponder: ReturnType<typeof PanResponder.create>;
  printPageCount: number;
  moreSettingsExpanded: boolean;
  setMoreSettingsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  headersAndFooters: boolean;
  setHeadersAndFooters: React.Dispatch<React.SetStateAction<boolean>>;
  insetsTop: number;
  insetsBottom: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.printPreviewSafe, { paddingTop: insetsTop }]}>
        {/* Header */}
        <View style={styles.printPreviewHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.printPreviewHeaderTitle}>Print preview</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Document */}
        <ScrollView contentContainerStyle={styles.printPreviewScroll}>
          <View style={styles.printDoc}>
            <Text style={styles.printDocTitle}>Housekeeping Report</Text>
            <Text style={styles.printDocDate}>{headerText}</Text>
            <View style={styles.printDocDivider} />

            <View style={styles.printTableHeader}>
              <Text style={[styles.printTableHeaderCell, { flex: 1.4 }]}>Room</Text>
              <Text style={[styles.printTableHeaderCell, { flex: 1 }]}>Check-in</Text>
              <Text style={[styles.printTableHeaderCell, { flex: 1 }]}>Check-out</Text>
              <Text style={[styles.printTableHeaderCell, { flex: 1.5 }]}>Room status</Text>
              <Text style={[styles.printTableHeaderCell, { flex: 1.3 }]}>Status</Text>
            </View>

            {(dateRange ? schedule.flatMap(d => d.rooms) : singleRooms).map((item, i) => {
              const status = statusOverrides[item.room.id] ?? item.room.status;
              const cfg = STATUS_CONFIG[status];
              const note = notes[item.room.id];
              return (
                <View key={`${item.room.id}-${i}`} style={[styles.printTableRow, i % 2 === 1 && styles.printTableRowAlt]}>
                  <View style={styles.printTableRowCols}>
                    <Text style={[styles.printTableCell, styles.printTableCellBold, { flex: 1.4 }]}>{item.room.number}</Text>
                    <Text style={[styles.printTableCell, { flex: 1 }]}>{item.checkIn ? new Date(item.checkIn + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</Text>
                    <Text style={[styles.printTableCell, { flex: 1 }]}>{item.checkOut ? new Date(item.checkOut + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</Text>
                    <Text style={[styles.printTableCell, { flex: 1.5 }]}>
                      {item.isOccupied ? `${item.guestCount} guest${item.guestCount !== 1 ? 's' : ''}` : 'Vacant'}
                    </Text>
                    <View style={[styles.printStatusBadge, { backgroundColor: cfg.bg, flex: 1.3 }]}>
                      <Text style={[styles.printStatusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  {(!!item.guestComments || !!note) && (
                    <View style={styles.printNotesContainer}>
                      {!!item.guestComments && (
                        <Text style={styles.printNoteText}><Text style={styles.printNoteLabel}>Guest comments: </Text>{item.guestComments}</Text>
                      )}
                      {!!note && (
                        <Text style={styles.printNoteText}><Text style={styles.printNoteLabel}>Staff note: </Text>{note}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Print settings sheet — standard bottom sheet overlay ── */}
        {printSettingsVisible && (
          <Animated.View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.35)',
            opacity: printSettingsSheetAnim,
          }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closePrintSettings} />
            <Animated.View style={[styles.printSheet, { paddingBottom: 0, transform: [{ translateY: printSettingsTranslateY }] }]}>
              <View style={styles.sheetHandleArea} {...printSettingsPanResponder.panHandlers}>
                <View style={styles.sortSheetHandle} />
              </View>
              <View style={styles.printSheetTitleRow}>
                <Text style={styles.printSheetTitleText}>Print Settings</Text>
                <Text style={styles.printSheetPageCount}>{printPageCount} page{printPageCount !== 1 ? 's' : ''}</Text>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
                <View style={styles.printSheetDivider} />

                <View style={styles.printSettingsRow}>
                  <Text style={styles.printSettingsLabel}>Destination</Text>
                  <View style={styles.printSettingsSelect}>
                    <Ionicons name="document-outline" size={15} color={COLORS.Black[400]} />
                    <Text style={styles.printSettingsSelectText}>Save as PDF</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                  </View>
                </View>

                <View style={styles.printSettingsRow}>
                  <Text style={styles.printSettingsLabel}>Pages</Text>
                  <View style={styles.printSettingsSelect}>
                    <Text style={styles.printSettingsSelectText}>All</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                  </View>
                </View>

                <View style={styles.printSettingsRow}>
                  <Text style={styles.printSettingsLabel}>Layout</Text>
                  <View style={styles.printSettingsSelect}>
                    <Text style={styles.printSettingsSelectText}>Portrait</Text>
                    <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                  </View>
                </View>

                <View style={styles.printSettingsDivider} />

                <TouchableOpacity style={styles.printSettingsRow} onPress={() => setMoreSettingsExpanded(v => !v)}>
                  <Text style={styles.printSettingsLabel}>More settings</Text>
                  <Ionicons name={moreSettingsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.Black[100]} />
                </TouchableOpacity>

                {moreSettingsExpanded && (
                  <>
                    <View style={styles.printSettingsRow}>
                      <Text style={styles.printSettingsLabel}>Paper size</Text>
                      <View style={styles.printSettingsSelect}>
                        <Text style={styles.printSettingsSelectText}>A4</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                      </View>
                    </View>
                    <View style={styles.printSettingsRow}>
                      <Text style={styles.printSettingsLabel}>Pages per sheet</Text>
                      <View style={styles.printSettingsSelect}>
                        <Text style={styles.printSettingsSelectText}>1</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                      </View>
                    </View>
                    <View style={styles.printSettingsRow}>
                      <Text style={styles.printSettingsLabel}>Margins</Text>
                      <View style={styles.printSettingsSelect}>
                        <Text style={styles.printSettingsSelectText}>Default</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                      </View>
                    </View>
                    <View style={styles.printSettingsRow}>
                      <Text style={styles.printSettingsLabel}>Scale</Text>
                      <View style={styles.printSettingsSelect}>
                        <Text style={styles.printSettingsSelectText}>Default</Text>
                        <Ionicons name="chevron-down" size={13} color={COLORS.Black[400]} />
                      </View>
                    </View>
                    <View style={[styles.printSettingsRow, { alignItems: 'flex-start' }]}>
                      <Text style={styles.printSettingsLabel}>Options</Text>
                      <View>
                        <TouchableOpacity style={styles.printCheckRow} onPress={() => setHeadersAndFooters(v => !v)}>
                          <View style={[styles.printCheckbox, headersAndFooters && styles.printCheckboxChecked]}>
                            {headersAndFooters && <Ionicons name="checkmark" size={11} color="#fff" />}
                          </View>
                          <Text style={styles.printCheckLabel}>Headers and footers</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.printCheckRow}>
                          <View style={styles.printCheckbox} />
                          <Text style={styles.printCheckLabel}>Background graphics</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.printSettingsDivider} />
                    <TouchableOpacity style={styles.printExternalRow}>
                      <Text style={styles.printExternalText}>Print using system dialogue...</Text>
                      <Ionicons name="open-outline" size={14} color={COLORS.Black[300]} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.printExternalRow}>
                      <Text style={styles.printExternalText}>Open PDF in Preview</Text>
                      <Ionicons name="open-outline" size={14} color={COLORS.Black[300]} />
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>

              <View style={[styles.printPreviewFooter, { paddingBottom: insetsBottom + 12 }]}>
                <TouchableOpacity style={styles.printConfirmBtn}>
                  <Ionicons name="print-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.printConfirmBtnText}>Print</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}
