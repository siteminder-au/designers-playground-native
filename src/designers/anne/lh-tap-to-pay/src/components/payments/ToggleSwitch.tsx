import React from 'react';
import { Switch, Platform } from 'react-native';
import { COLORS } from '../../config/colors';

// A real native Switch, not a custom-drawn control — this is the HIG-correct
// on/off control (see the source lh-mobile web mockup, which had to fake this
// look with CSS since the web has no native iOS switch).
export function ToggleSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#e5e5ea', true: COLORS.Primary[100] }}
      thumbColor="#ffffff"
      ios_backgroundColor="#e5e5ea"
      style={Platform.OS === 'web' ? { transform: [{ scale: 0.9 }] } : undefined}
    />
  );
}
