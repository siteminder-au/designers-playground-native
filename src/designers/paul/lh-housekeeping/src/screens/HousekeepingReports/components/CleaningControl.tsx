import React, { useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { RoomStatus } from '../../../context/HousekeepingStatus';
import { STATUS_VARIANT, SYMBOL_CONTAINER } from '../../../config/statusVariant';
import { STATUS_CONFIG, STATUS_SVG_ICON, STATUS_SYMBOL, STATUS_ABBR } from '../constants';
import { SymbolIcon } from './SymbolIcon';
import styles from '../styles';

export type BadgeRect = { x: number; y: number; width: number; height: number };

export function CleaningControl({
  status,
  onPress,
}: {
  status: RoomStatus;
  onPress: (rect: BadgeRect) => void;
}) {
  const ref = useRef<View>(null);
  const { label, bg, border, text, icon } = STATUS_CONFIG[status];

  function handlePress() {
    ref.current?.measure((_x, _y, width, height, pageX, pageY) => {
      onPress({ x: pageX, y: pageY, width, height });
    });
  }

  if (STATUS_VARIANT === 'symbol') {
    const sym = STATUS_SYMBOL[status];
    const isChip = SYMBOL_CONTAINER === 'chip';
    const containerStyle = SYMBOL_CONTAINER === 'circle'
      ? styles.symbolCircle
      : SYMBOL_CONTAINER === 'rounded-square'
      ? styles.symbolSquare
      : styles.symbolChip;

    return (
      <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={handlePress}>
        <View ref={ref} style={[styles.badgeInteractive, styles.badgeNeutral, { backgroundColor: sym.tint }]}>
          {isChip ? (
            <View style={[styles.symbolChip, { backgroundColor: sym.tint, paddingHorizontal: 10, width: 'auto' }]}>
              <SymbolIcon entry={sym} size={14} />
              <Text style={[styles.badgeText, { color: sym.color }]}>{label}</Text>
            </View>
          ) : (
            <View style={[containerStyle, { backgroundColor: sym.tint }]}>
              <SymbolIcon entry={sym} size={15} />
            </View>
          )}
          {!isChip && (
            <Text style={[styles.badgeText, { color: sym.color, marginRight: 4 }]}>{label}</Text>
          )}
          <Ionicons name="chevron-down" size={10} color="#9ca3af" style={isChip ? { marginLeft: 8 } : undefined} />
        </View>
      </TouchableOpacity>
    );
  }

  if (STATUS_VARIANT === 'abbr') {
    // Short text label is the primary signal; coloured left border is secondary.
    const abbr = STATUS_ABBR[status];
    return (
      <TouchableOpacity activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} onPress={handlePress}>
        <View ref={ref} style={[styles.badgeInteractive, styles.badgeNeutral, { borderLeftWidth: 3, borderLeftColor: abbr.color }]}>
          <Text style={[styles.badgeText, { color: '#374151', marginRight: 4 }]}>{abbr.fullLabel}</Text>
          <Ionicons name="chevron-down" size={10} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  }

  // 'icon' — Figma pill design
  const SvgIcon = STATUS_SVG_ICON[status];
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      onPress={handlePress}
    >
      <View ref={ref} style={[styles.cleaningBtn, { backgroundColor: bg, borderColor: border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {SvgIcon
            ? <SvgIcon width={18} height={18} />
            : <MaterialIcons name={icon} size={18} color={text} />}
          <Text style={[styles.cleaningBtnText, { color: text }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-down" size={12} color={text} />
      </View>
    </TouchableOpacity>
  );
}
