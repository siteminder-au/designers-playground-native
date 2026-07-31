import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ActionSheetOption {
  key: string;
  label: string;
}

export function ActionSheet({
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  options: ActionSheetOption[];
  selected: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.group}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.option, index > 0 && styles.optionBorder]}
                onPress={() => onSelect(option.key)}
              >
                <Text style={[styles.optionText, option.key === selected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.group}>
            <TouchableOpacity style={styles.option} onPress={onClose}>
              <Text style={[styles.optionText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 8,
  },
  group: {
    backgroundColor: 'rgba(249,249,249,0.96)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  optionBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  optionText: {
    fontSize: 17,
    color: '#007aff',
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  cancelText: {
    fontWeight: '600',
  },
});
