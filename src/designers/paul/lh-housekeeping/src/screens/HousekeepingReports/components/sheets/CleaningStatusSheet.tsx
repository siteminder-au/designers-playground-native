import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RoomStatus } from '../../../../context/HousekeepingStatus';
import { STATUS_CONFIG } from '../../constants';
import styles from '../../styles';

// Matches the Figma bottom sheet (node 742:55649) exactly — every status
// row's text color mirrors STATUS_CONFIG's pill color except Skip clean,
// which the design uses a distinct, darker yellow for in this sheet only.
const SHEET_TEXT_COLOR: Record<RoomStatus, string> = {
  CLEANED:             STATUS_CONFIG.CLEANED.text,
  UNCLEANED:           STATUS_CONFIG.UNCLEANED.text,
  DEEP_CLEAN:          STATUS_CONFIG.DEEP_CLEAN.text,
  SKIP_CLEANING:       '#dc9400',
  AWAITING_INSPECTION: STATUS_CONFIG.AWAITING_INSPECTION.text,
};

export function CleaningStatusSheet({
  visible,
  onClose,
  sheetAnim,
  translateY,
  panResponder,
  statuses,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  sheetAnim: Animated.Value;
  translateY: Animated.Value;
  panResponder: ReturnType<typeof PanResponder.create>;
  statuses: RoomStatus[];
  onSelect: (status: RoomStatus) => void;
}) {
  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sortSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Cleaning Status</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.cleaningStatusList}>
            {statuses.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.cleaningStatusRow}
                activeOpacity={0.7}
                onPress={() => onSelect(s)}
              >
                <Text style={[styles.cleaningStatusRowText, { color: SHEET_TEXT_COLOR[s] }]}>
                  {STATUS_CONFIG[s].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
