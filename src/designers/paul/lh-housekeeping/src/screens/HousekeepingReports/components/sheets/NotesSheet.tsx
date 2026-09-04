import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, Keyboard, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../../config/colors';
import { ORANGE } from '../../constants';
import type { RoomDaySchedule } from '../../types';
import styles from '../../styles';

// Max length for a room note (mirrored in the TextInput maxLength).
const NOTE_MAX = 150;

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

export function NotesSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  item,
  notesSheetDraft,
  setNotesSheetDraft,
  saveSheetNote,
  insetsBottom,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  item: RoomDaySchedule | null;
  notesSheetDraft: string;
  setNotesSheetDraft: React.Dispatch<React.SetStateAction<string>>;
  saveSheetNote: () => void;
  insetsBottom: number;
}) {
  const keyboardHeight = useKeyboardHeight();
  const roomLabel = item
    ? (/^\d+$/.test(item.room.number) ? `Room ${item.room.number}` : item.room.number)
    : '';

  // View state (Figma node 806:37656) shows the existing note read-only with
  // a pencil to edit it; Edit state (742:56218) is the composer. A room with
  // no note yet skips straight to the composer. Snapshot the note text each
  // time the sheet opens so Cancel-while-editing can revert to it.
  const [isEditing, setIsEditing] = React.useState(false);
  const [originalText, setOriginalText] = React.useState('');
  React.useEffect(() => {
    if (!visible) return;
    setIsEditing(!notesSheetDraft.trim());
    setOriginalText(notesSheetDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleCancel() {
    if (originalText) {
      setNotesSheetDraft(originalText);
      setIsEditing(false);
    } else {
      onClose();
    }
  }

  function handleSave() {
    saveSheetNote();
    onClose();
  }

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
          <View style={styles.notesSheetHeader}>
            <View>
              <Text style={styles.notesSheetHeaderTitle}>Room Notes</Text>
              <Text style={styles.notesSheetHeaderSubtitle}>{roomLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#333333" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insetsBottom + 24 }} keyboardShouldPersistTaps="handled">
            {isEditing ? (
              <>
                <Text style={styles.notesSheetLabel}>Add note</Text>
                <TextInput
                  style={styles.notesSheetInput}
                  value={notesSheetDraft}
                  onChangeText={setNotesSheetDraft}
                  multiline
                  autoFocus
                  placeholder="Type here"
                  placeholderTextColor={COLORS.Black[600]}
                  textAlignVertical="top"
                  maxLength={NOTE_MAX}
                />
                <Text style={[styles.notesCharCount, notesSheetDraft.length >= NOTE_MAX && styles.notesCharCountMax]}>
                  {notesSheetDraft.length}/{NOTE_MAX}
                </Text>
                <View style={styles.notesSheetSaveRow}>
                  <TouchableOpacity onPress={handleCancel}>
                    <Text style={styles.notesSheetCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.filterSaveBtn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.filterSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.notesSheetViewRow}>
                <Text style={styles.notesSheetViewText}>{notesSheetDraft}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="pencil-outline" size={16} color={ORANGE} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
