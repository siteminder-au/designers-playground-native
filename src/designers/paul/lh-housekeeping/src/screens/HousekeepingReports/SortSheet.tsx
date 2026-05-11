import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SortState, SORT_OPTIONS, DEFAULT_SORT, ORANGE } from './types';
import { styles } from './styles';

export function SortSheet({
  visible,
  sort,
  onSortChange,
  onClose,
}: {
  visible: boolean;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onClose: () => void;
}) {
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(400);
      sheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(sheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  function close() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  }

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderMove:   (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease:(_, g) => {
      if (g.dy > 80) close();
      else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={close}>
      <Animated.View style={[styles.sortSheetOverlay, { opacity: sheetAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={close} />
        <Animated.View style={[styles.sortSheet, { transform: [{ translateY }] }]}>
          <View style={styles.sheetHandleArea} {...panResponder.panHandlers}>
            <View style={styles.sortSheetHandle} />
          </View>
          <View style={styles.sortSheetHeader}>
            <Text style={styles.sortSheetTitle}>Sort by</Text>
            <TouchableOpacity onPress={() => { onSortChange(DEFAULT_SORT); close(); }}>
              <Text style={styles.sortResetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          {SORT_OPTIONS.map((option) => {
            const isSelected = sort.field === option.value;
            return (
              <React.Fragment key={option.value}>
                <TouchableOpacity
                  style={[styles.sortOptionRow, isSelected && styles.sortOptionRowActive]}
                  onPress={() => { onSortChange({ ...sort, field: option.value }); close(); }}
                >
                  <View style={[styles.sortRadio, isSelected && styles.sortRadioActive]}>
                    {isSelected && <View style={styles.sortRadioDot} />}
                  </View>
                  <Text style={[styles.sortOptionLabel, isSelected && styles.sortOptionLabelActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
