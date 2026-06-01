import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, Keyboard, Platform, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../config/colors';
import FLAGS from '../../../../config/featureFlags';
import { ORANGE } from '../../constants';
import type { RoomDaySchedule, LocalNote, NoteCategory } from '../../types';
import { NOTE_CATEGORIES } from '../../types';
import { toBookingRef } from '../../utils/dateFormat';
import { shouldShowBedConfig } from '../../utils/bedConfig';
import styles from '../../styles';

// Tracks the on-screen keyboard height so the bottom sheet can lift its
// content above the keyboard. We apply this as white paddingBottom on the
// sheet itself (rather than wrapping in KeyboardAvoidingView, which reserves
// *transparent* space and lets the dimmed backdrop show through — the sheet
// appears detached/cut off). On web no keyboard events fire, so it stays 0.
function useKeyboardHeight(): number {
  const [height, setHeight] = React.useState(0);
  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, e => setHeight(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);
  return height;
}

// Per-category visual palette, shared by the entry pills and the saved-note tag.
const CATEGORY_PALETTE: Record<NoteCategory, { bg: string; border: string; text: string }> = {
  Housekeeping: { bg: '#fff5ee', border: '#fed7aa', text: '#c2410c' },
  Maintenance:  { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca' },
};

// Room notes are tied to the room (vs Staff notes, which are tied to the
// reservation). These pills let the author tag a room note as a Housekeeping-
// or Maintenance-related subcategory while composing it.
function CategoryPills({ value, onChange }: { value: NoteCategory; onChange: (c: NoteCategory) => void }) {
  return (
    <View style={styles.notesCategoryRow}>
      {NOTE_CATEGORIES.map(cat => {
        const active = value === cat;
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onChange(cat)}
            style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
          >
            <Text style={[styles.filterChipText, active && { color: ORANGE, fontWeight: '600' }]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Small read-only tag shown on a saved note, colour-coded by subcategory.
function CategoryTag({ category }: { category: NoteCategory }) {
  const p = CATEGORY_PALETTE[category];
  return (
    <View style={[styles.notesCategoryTag, { backgroundColor: p.bg, borderColor: p.border }]}>
      <Text style={[styles.notesCategoryTagText, { color: p.text }]}>{category}</Text>
    </View>
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
  noteCategory,
  setNoteCategory,
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
  sheetNotes: LocalNote[];
  notesSheetEditing: boolean;
  setNotesSheetEditing: React.Dispatch<React.SetStateAction<boolean>>;
  notesSheetDraft: string;
  setNotesSheetDraft: React.Dispatch<React.SetStateAction<string>>;
  noteCategory: NoteCategory;
  setNoteCategory: React.Dispatch<React.SetStateAction<NoteCategory>>;
  editingNoteId: string | null;
  setEditingNoteId: React.Dispatch<React.SetStateAction<string | null>>;
  saveSheetNote: () => void;
  insetsBottom: number;
}) {
  // Room notes are tied to the room, so any room with the sheet open can take a
  // note (independent of whether a reservation is active).
  const canAddNote = !!item;
  const keyboardHeight = useKeyboardHeight();
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        {/* paddingBottom = keyboardHeight keeps the sheet anchored to the
            bottom edge and fills the keyboard's reserved space with the
            sheet's own white background, so it never detaches/cuts off. */}
          <Animated.View style={[styles.sortSheet, { paddingBottom: keyboardHeight, transform: [{ translateY }] }]}>
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
              <Text style={styles.notesSheetSectionLabel}>Room notes</Text>
              {sheetNotes.length === 0 && !notesSheetEditing && (
                <Text style={[styles.notesSheetBody, { color: COLORS.Black[600], fontStyle: 'italic', marginBottom: 8 }]}>
                  {canAddNote ? 'No room notes yet.' : '—'}
                </Text>
              )}
              {sheetNotes.map(note => {
                const isEditing = editingNoteId === note.id;
                return (
                  <View key={note.id} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <CategoryTag category={note.category} />
                      <Text style={[styles.notesSheetBody, { fontSize: 11, color: COLORS.Black[500] }]}>
                        {note.author} · {new Date(note.createdAt).toLocaleString([], { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                      {!isEditing && (
                        <TouchableOpacity onPress={() => { setEditingNoteId(note.id); setNotesSheetDraft(note.text); setNoteCategory(note.category); setNotesSheetEditing(true); }}>
                          <Ionicons name="pencil-outline" size={14} color={ORANGE} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {isEditing ? (
                      <>
                        <CategoryPills value={noteCategory} onChange={setNoteCategory} />
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
                  <CategoryPills value={noteCategory} onChange={setNoteCategory} />
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
                  <Text style={styles.addNoteText}>+ Add room note</Text>
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
      </Animated.View>
    </Modal>
  );
}
