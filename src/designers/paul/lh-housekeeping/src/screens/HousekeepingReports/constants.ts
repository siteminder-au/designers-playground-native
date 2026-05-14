import React from 'react';
import { Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import type { RoomStatus } from '../../context/HousekeepingStatus';
import CleanSvg from '../../../assets/Clean.svg';
import DirtySvg from '../../../assets/Dirty.svg';
import InspectionSvg from '../../../assets/Inspection.svg';
import SnoozeSvg from '../../../assets/Snooze.svg';

export const ORANGE = '#e8722a';
export const NUM_DAYS = 5;
export const WINDOW_HEIGHT = Dimensions.get('window').height;

export const HOUSEKEEPERS = ['Maria S.', 'James T.', 'Jacqueline W.'];

export const STATUS_CONFIG: Record<RoomStatus, { label: string; bg: string; border: string; text: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  CLEANED:              { label: 'Clean',              bg: '#9AE0BD',               border: '#258548',               text: '#258548',               icon: 'auto-awesome'    },
  UNCLEANED:            { label: 'Needs clean',        bg: '#f1bfbf',               border: '#b81919',               text: '#b81919',               icon: 'auto-awesome'    },
  DEEP_CLEAN:           { label: 'Needs deep clean',   bg: '#f1bfbf',               border: '#b81919',               text: '#b81919',               icon: 'auto-awesome'    },
  SKIP_CLEANING:        { label: 'Skip clean',         bg: '#fef9c3',               border: '#d97706',               text: '#a16207',               icon: 'do-not-disturb'  },
  AWAITING_INSPECTION:  { label: 'Awaiting inspection',bg: COLORS.Blue[600],        border: COLORS.Blue[200],        text: COLORS.Blue[200],        icon: 'auto-fix-high'   },
};

export const STATUS_SVG_ICON: Partial<Record<RoomStatus, React.FC<{ width?: number; height?: number }>>> = {
  CLEANED:             CleanSvg,
  UNCLEANED:           DirtySvg,
  DEEP_CLEAN:          DirtySvg,
  AWAITING_INSPECTION: InspectionSvg,
  SKIP_CLEANING:       SnoozeSvg,
};

// 'symbol' variant — MaterialCommunityIcons with housekeeping-semantic meaning
// shimmer = sparkling clean · water = stain/spill (dirty) · do-not-disturb = skip service
export type SymbolEntry =
  | { set: 'MI';  name: React.ComponentProps<typeof MaterialIcons>['name'];          color: string; tint: string }
  | { set: 'MCI'; name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; color: string; tint: string };

export const STATUS_SYMBOL: Record<RoomStatus, SymbolEntry> = {
  CLEANED:             { set: 'MI',  name: 'auto-awesome',      color: '#258548',        tint: '#9AE0BD'        },
  UNCLEANED:           { set: 'MI',  name: 'cleaning-services', color: '#b81919',        tint: '#f1bfbf'        },
  DEEP_CLEAN:          { set: 'MCI', name: 'broom',             color: '#b81919',        tint: '#f1bfbf'        },
  SKIP_CLEANING:       { set: 'MCI', name: 'sleep',             color: '#d97706',        tint: '#fef9c3'        },
  AWAITING_INSPECTION: { set: 'MI',  name: 'auto-fix-high',     color: COLORS.Blue[200], tint: COLORS.Blue[600] },
};

// 'abbr' variant — text label is primary, border colour is secondary
export const STATUS_ABBR: Record<RoomStatus, { label: string; fullLabel: string; color: string }> = {
  CLEANED:             { label: 'CLN', fullLabel: 'Clean',               color: '#258548'        },
  UNCLEANED:           { label: 'DRT', fullLabel: 'Needs clean',         color: '#b81919'        },
  DEEP_CLEAN:          { label: 'DPC', fullLabel: 'Needs deep clean',    color: '#b81919'        },
  SKIP_CLEANING:       { label: 'SKP', fullLabel: 'Skip Clean',          color: '#d97706'        },
  AWAITING_INSPECTION: { label: 'AWI', fullLabel: 'Awaiting inspection', color: COLORS.Blue[200] },
};
