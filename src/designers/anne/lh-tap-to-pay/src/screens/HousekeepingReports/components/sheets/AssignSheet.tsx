import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder } from 'react-native';
import { HOUSEKEEPERS } from '../../constants';
import styles from '../../styles';

export function AssignSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  assigningRoomId,
  assignments,
  setAssignments,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  assigningRoomId: string | null;
  assignments: Record<string, string>;
  setAssignments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}><View style={styles.sortSheetHandle} /></View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Assign housekeeper</Text>
            <TouchableOpacity onPress={onConfirm}>
              <Text style={styles.sortResetText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          {HOUSEKEEPERS.map((name) => {
            const isSelected = assigningRoomId ? assignments[assigningRoomId] === name : false;
            return (
              <TouchableOpacity
                key={name}
                style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                onPress={() => {
                  if (assigningRoomId) setAssignments(prev => ({ ...prev, [assigningRoomId]: name }));
                }}
              >
                <View style={[styles.sortRadio, isSelected && styles.sortRadioActive]}>
                  {isSelected && <View style={styles.sortRadioDot} />}
                </View>
                <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
