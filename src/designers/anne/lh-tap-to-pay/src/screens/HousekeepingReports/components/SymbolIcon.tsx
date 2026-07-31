import React from 'react';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { SymbolEntry } from '../constants';

export function SymbolIcon({ entry, size }: { entry: SymbolEntry; size: number }) {
  if (entry.set === 'MCI') {
    return <MaterialCommunityIcons name={entry.name} size={size} color={entry.color} />;
  }
  return <MaterialIcons name={entry.name} size={size} color={entry.color} />;
}
