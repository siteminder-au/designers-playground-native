import React from 'react';
import { View, TextInput, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import { COLORS } from '../../config/colors';

export function TextField({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  maxLength,
  prefix,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
  prefix?: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      {prefix}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.Black[500]}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: COLORS.Black[100],
    padding: 0,
  },
});
