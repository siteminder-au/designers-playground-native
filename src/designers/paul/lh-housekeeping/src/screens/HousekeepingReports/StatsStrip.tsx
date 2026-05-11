import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { RoomStatus } from '../../context/HousekeepingStatus';
import { RoomDaySchedule } from './types';
import { styles } from './styles';

export function StatsStrip({
  rooms,
  statusOverrides,
}: {
  rooms: RoomDaySchedule[];
  statusOverrides: Record<string, RoomStatus>;
}) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // 3 left-right pulses, each 350ms apart, starting after 500ms
    const beats = [0, 28, 0, 28, 0];
    const timers = beats.map((x, i) =>
      setTimeout(() => scrollRef.current?.scrollTo({ x, animated: true }), 500 + i * 350)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const dayStats = {
    dirty:        rooms.filter(r => { const s = statusOverrides[r.room.id] ?? r.room.status; return s === 'UNCLEANED' || s === 'DEEP_CLEAN'; }).length,
    earlyCheckIn: rooms.filter(r => r.checkInTime !== null).length,
    lateCheckOut: rooms.filter(r => r.lateCheckout && r.hasCheckoutToday).length,
    outOfOrder:   rooms.filter(r => r.room.isClosed).length,
    issues:       rooms.filter(r => r.room.notes !== null).length,
  };

  return (
    <View style={{ position: 'relative' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 24 }}
      >
        {([
          { value: dayStats.dirty,        label: 'Rooms dirty today'      },
          { value: dayStats.earlyCheckIn, label: 'Early check-in today'   },
          { value: dayStats.lateCheckOut, label: 'Late check-out today'   },
          { value: dayStats.outOfOrder,   label: 'Out of order today'     },
          { value: dayStats.issues,       label: 'Issue reported today'   },
        ] as { value: number; label: string }[]).map((stat, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
      {/* Simulated right-edge fade — indicates horizontal scroll affordance */}
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, flexDirection: 'row' }} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0)'    }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.3)'  }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.6)'  }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,0.85)' }} />
        <View style={{ flex: 1, backgroundColor: 'rgba(242,243,243,1)'    }} />
      </View>
    </View>
  );
}
