import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';

export function PickerField({
  label,
  placeholder,
  valueLabel,
  onOpen,
}: {
  label?: string;
  placeholder: string;
  valueLabel?: string;
  onOpen: () => void;
}) {
  return (
    <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={onOpen}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Text
          style={[
            label ? styles.valueLabelled : styles.value,
            !valueLabel && styles.placeholder,
          ]}
          numberOfLines={1}
        >
          {valueLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.Black[500]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.Black[400],
  },
  value: {
    fontSize: 15,
    color: COLORS.Black[100],
  },
  valueLabelled: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.Black[100],
  },
  placeholder: {
    color: COLORS.Black[500],
    fontWeight: '400',
  },
});
