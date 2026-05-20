import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../config/colors';
import FLAGS from '../../../../config/featureFlags';
import { ORANGE } from '../../constants';
import type { RoomDaySchedule, StaffNote } from '../../types';
import { toBookingRef } from '../../utils/dateFormat';
import { shouldShowBedConfig } from '../../utils/bedConfig';
import styles from '../../styles';

// Wraps children in KeyboardAvoidingView on native (so the iOS keyboard
// pushes the sheet up) but passes through unchanged on web, where the
// wrapper would shrink to its content width and visually detach the sheet
// from the overlay's bottom edge.
function ConditionalKeyboardAvoidingView({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {children}
    </KeyboardAvoidingView>
  );
}

export function NotesSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  item,
  flags,
  sheetNotes,
  notesSheetEditing,
  setNotesSheetEditing,
  notesSheetDraft,
  setNotesSheetDraft,
  editingNoteId,
  setEditingNoteId,
  saveSheetNote,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  item: RoomDaySchedule | null;
  flags: typeof FLAGS;
  sheetNotes: StaffNote[];
  notesSheetEditing: boolean;
  setNotesSheetEditing: React.Dispatch<React.SetStateAction<boolean>>;
  notesSheetDraft: string;
  setNotesSheetDraft: React.Dispatch<React.SetStateAction<string>>;
  editingNoteId: string | null;
  setEditingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  saveSheetNote: () => void;
  insetsBottom: number;
}) {
  // Per Si's 2026-05-18 contract: housekeeping notes require an active
  // reservation. Vacant rooms still open the sheet (parity with web) but
  // show "—" and no Add affordance.
  const canAddNote = !!item?.reservationId;
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        {/* KeyboardAvoidingView is needed on native to push the sheet above
            the iOS keyboard, but on web it sizes to content (not the overlay
            width) and visually detaches the sheet from the bottom edge. */}
        <ConditionalKeyboardAvoidingView>
          <Animated.View style={[styles.sortSheet, { paddingBottom: 0, transform: [{ translateY }] }]}>
            <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
              <View style={styles.sortSheetHandle} />
            </View>
            <View style={styles.sortSheetHeader}>
              <Text style={styles.sortSheetTitle}>{flags.compactCard ? 'Room details' : 'Notes'}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.sortResetText}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insetsBottom + 24 }} keyboardShouldPersistTaps="handled">
              {/* Guest details — surfaced here only in compact card variant
                  (these fields are hidden from the room card to save space) */}
              {flags.compactCard && item && (
                (flags.showGuestName && item.guestName) ||
                (flags.showReservationId && item.reservationId) ||
                (flags.showGuestPax && (item.adults > 0 || item.children > 0 || item.infants > 0)) ||
                (flags.showBedConfig && shouldShowBedConfig(item.bedConfiguration))
              ) && (
                <>
                  <Text style={styles.notesSheetSectionLabel}>Guest details</Text>
                  <View style={{ gap: 8, marginBottom: 12 }}>
                    {flags.showGuestName && item.guestName && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={14} color={COLORS.Black[200]} />
                        <Text style={styles.notesSheetBody}>{item.guestName}</Text>
                      </View>
                    )}
                    {flags.showReservationId && item.reservationId && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="tag-outline" size={14} color={COLORS.Black[200]} />
                        <Text style={styles.notesSheetBody}>#{toBookingRef(item.reservationId)}</Text>
                      </View>
                    )}
                    {flags.showGuestPax && (item.adults > 0 || item.children > 0 || item.infants > 0) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {item.adults > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="account-outline" size={14} color={COLORS.Black[200]} />
                            <Text style={styles.notesSheetBody}>{item.adults}</Text>
                          </View>
                        )}
                        {item.children > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="account-child-outline" size={14} color={COLORS.Black[200]} />
                            <Text style={styles.notesSheetBody}>{item.children}</Text>
                          </View>
                        )}
                        {item.infants > 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="baby-face-outline" size={14} color={COLORS.Black[200]} />
                            <Text style={styles.notesSheetBody}>{item.infants}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    {flags.showBedConfig && shouldShowBedConfig(item.bedConfiguration) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="bed-outline" size={14} color={COLORS.Black[200]} />
                        <Text style={styles.notesSheetBody}>{item.bedConfiguration}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.notesSheetDivider} />
                </>
              )}
              {item?.guestComments ? (
                <>
                  <Text style={styles.notesSheetSectionLabel}>Guest comments</Text>
                  <Text style={styles.notesSheetBody}>{item.guestComments}</Text>
                  <View style={styles.notesSheetDivider} />
                </>
              ) : null}
              {/* Staff notes — read-only single string at si_reservations.data.staffNote.
                  Written only by front desk per Si's 2026-05-18 contract. Shown here
                  for context; mobile cannot edit. */}
              {item?.reservationId && (
                <>
                  <Text style={styles.notesSheetSectionLabel}>Staff notes</Text>
                  <Text style={[
                    styles.notesSheetBody,
                    !item.staffNote && { color: COLORS.Black[600], fontStyle: 'italic' },
                  ]}>
                    {item.staffNote ?? '—'}
                  </Text>
                  <View style={styles.notesSheetDivider} />
                </>
              )}
              <Text style={styles.notesSheetSectionLabel}>Housekeeping notes</Text>
              {sheetNotes.length === 0 && !notesSheetEditing && (
                <Text style={[styles.notesSheetBody, { color: COLORS.Black[600], fontStyle: 'italic', marginBottom: 8 }]}>
                  {canAddNote ? 'No housekeeping notes yet.' : '—'}
                </Text>
              )}
              {sheetNotes.map(note => {
                const isEditing = editingNoteId === note.id;
                return (
                  <View key={note.id} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Text style={[styles.notesSheetBody, { fontSize: 11, color: COLORS.Black[500] }]}>
                        {note.author} · {new Date(note.createdAt).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      {!isEditing && (
                        <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setNotesSheetDraft(note.text); setNotesSheetEditing(true); }}>
                          <Ionicons name="pencil-outline" size={14} color={ORANGE} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {isEditing ? (
                      <>
                        <TextInput
                          style={styles.notesSheetInput}
                          value={notesSheetDraft}
                          onChangeText={setNotesSheetDraft}
                          multiline
                          autoFocus
                          placeholder="Edit note..."
                          placeholderTextColor={COLORS.Black[600]}
                          textAlignVertical="top"
                          maxLength={300}
                        />
                        <View style={styles.notesSheetSaveRow}>
                          <TouchableOpacity onPress={() => { setEditingNoteId(null); setNotesSheetEditing(false); setNotesSheetDraft(''); }}>
                            <Text style={styles.notesSheetCancel}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.notesSheetSaveBtn} onPress={saveSheetNote}>
                            <Text style={styles.notesSheetSaveBtnText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.notesSheetBody}>{note.text}</Text>
                    )}
                  </View>
                );
              })}
              {notesSheetEditing && !editingNoteId && canAddNote ? (
                <>
                  <TextInput
                    style={styles.notesSheetInput}
                    value={notesSheetDraft}
                    onChangeText={setNotesSheetDraft}
                    multiline
                    autoFocus
                    placeholder="Add a note..."
                    placeholderTextColor={COLORS.Black[600]}
                    textAlignVertical="top"
                    maxLength={300}
                  />
                  <View style={styles.notesSheetSaveRow}>
                    <TouchableOpacity onPress={() => { setNotesSheetEditing(false); setNotesSheetDraft(''); }}>
                      <Text style={styles.notesSheetCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.notesSheetSaveBtn} onPress={saveSheetNote}>
                      <Text style={styles.notesSheetSaveBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : !editingNoteId && canAddNote ? (
                <TouchableOpacity onPress={() => { setNotesSheetDraft(''); setNotesSheetEditing(true); }}>
                  <Text style={styles.addNoteText}>+ Add housekeeping note</Text>
                </TouchableOpacity>
              ) : null}
              {(item?.extraItems?.length ?? 0) > 0 && (
                <>
                  <View style={styles.notesSheetDivider} />
                  <Text style={styles.notesSheetSectionLabel}>Extras</Text>
                  {item!.extraItems.map((it, i) => (
                    <Text key={i} style={styles.notesSheetBody}>{'•'} {it}</Text>
                  ))}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </ConditionalKeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}
