import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Modal, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// ─── Types ────────────────────────────────────────────────────────────────────

type PropertyStatus = 'ok' | 'error';

interface DayData {
  day: string; date: number; count: number;
  isWeekend: boolean; isSelected: boolean;
}
interface DynRevDay {
  day: string; date: number;
  isHighlighted: boolean;
  isSoftHighlight?: boolean;
  dayColor?: string;
  alertCount?: number;
}
interface BarPoint    { label: string; value: number }
interface ChannelData { name: string; initial: string; value: number }

interface PerfData {
  avg: number; unit: string;
  bars: BarPoint[];
  channels: ChannelData[];
}

interface Property {
  id: string; name: string; address: string;
  propertyStatus: PropertyStatus; propertyStatusLabel: string;
  channelStatus: PropertyStatus;  channelStatusLabel: string;
  stats: { arrivals: number; departures: number; stays: number; cancellations: number; newBookings: number };
  availability: DayData[];
  dynRevDates: DynRevDay[];
  roomsPerf: PerfData;
  revenuePerf: PerfData;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS_14  = ['FRI','SAT','SUN','MON','TUE','WED','THU','FRI','SAT','SUN','MON','TUE','WED','THU'];
const WEEKENDS = [true,true,true,false,false,false,false,true,true,true,false,false,false,false];

function makeDays(counts: number[]): DayData[] {
  return DAYS_14.map((day, i) => ({
    day, date: i + 1, count: counts[i],
    isWeekend: WEEKENDS[i], isSelected: i === 3,
  }));
}

const PROPERTIES: Property[] = [
  {
    id: 'eco-fern', name: 'The Eco Fern Ecotel',
    address: '16 Cambridge Street, Delaware, OH 43015',
    propertyStatus: 'ok',   propertyStatusLabel: 'Property status',
    channelStatus:  'ok',   channelStatusLabel:  'Channels status',
    stats: { arrivals: 21, departures: 14, stays: 9, cancellations: 0, newBookings: 4 },
    dynRevDates: [
      { day:'FRI', date:15, isHighlighted:false, isSoftHighlight:true,  alertCount:2 },
      { day:'SAT', date:16, isHighlighted:false, dayColor:'#F97316' },
      { day:'SUN', date:17, isHighlighted:false, dayColor:'#EF4444' },
      { day:'MON', date:18, isHighlighted:false },
      { day:'TUE', date:19, isHighlighted:false, isSoftHighlight:true,  alertCount:2 },
      { day:'WED', date:20, isHighlighted:true,  alertCount:2 },
      { day:'THU', date:21, isHighlighted:true },
    ],
    availability: makeDays([4,2,4,0,4,3,5,2,1,4,3,2,4,1]),
    roomsPerf: {
      avg: 141, unit: 'rooms',
      bars: [
        { label:'27', value:120 }, { label:'28', value:185 },
        { label:'29', value:88  }, { label:'30', value:155 },
        { label:'01 Apr', value:200 }, { label:'02', value:172 }, { label:'03', value:110 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:57 },
        { name:'Expedia.com', initial:'✈',  value:48 },
        { name:'Agoda.com',   initial:'A',  value:36 },
      ],
    },
    revenuePerf: {
      avg: 1513, unit: 'AUD',
      bars: [
        { label:'27', value:900  }, { label:'28', value:1200 },
        { label:'29', value:2600 }, { label:'30', value:1800 },
        { label:'01 Apr', value:3000 }, { label:'02', value:1400 }, { label:'03', value:800 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:587 },
        { name:'Expedia.com', initial:'✈',  value:484 },
        { name:'Agoda.com',   initial:'A',  value:442 },
      ],
    },
  },
  {
    id: 'mobile-hotel', name: 'The Mobile Hotel',
    address: '16 Cambridge Street, Delaware, OH 43015',
    propertyStatus: 'ok',    propertyStatusLabel: 'Property status',
    channelStatus:  'error', channelStatusLabel:  '1 channel error',
    stats: { arrivals: 15, departures: 8, stays: 12, cancellations: 2, newBookings: 7 },
    dynRevDates: [
      { day:'FRI', date:15, isHighlighted:false },
      { day:'SAT', date:16, isHighlighted:false, dayColor:'#F97316', alertCount:1 },
      { day:'SUN', date:17, isHighlighted:false, dayColor:'#EF4444' },
      { day:'MON', date:18, isHighlighted:true,  alertCount:3 },
      { day:'TUE', date:19, isHighlighted:true },
      { day:'WED', date:20, isHighlighted:false, isSoftHighlight:true },
      { day:'THU', date:21, isHighlighted:false, alertCount:1 },
    ],
    availability: makeDays([2,0,3,1,5,4,2,3,0,2,4,3,1,2]),
    roomsPerf: {
      avg: 98, unit: 'rooms',
      bars: [
        { label:'27', value:85  }, { label:'28', value:110 },
        { label:'29', value:60  }, { label:'30', value:95  },
        { label:'01 Apr', value:130 }, { label:'02', value:105 }, { label:'03', value:75 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:42 },
        { name:'Expedia.com', initial:'✈',  value:31 },
        { name:'Agoda.com',   initial:'A',  value:28 },
      ],
    },
    revenuePerf: {
      avg: 980, unit: 'AUD',
      bars: [
        { label:'27', value:600  }, { label:'28', value:800  },
        { label:'29', value:1500 }, { label:'30', value:1000 },
        { label:'01 Apr', value:1800 }, { label:'02', value:900 }, { label:'03', value:500 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:380 },
        { name:'Expedia.com', initial:'✈',  value:290 },
        { name:'Agoda.com',   initial:'A',  value:210 },
      ],
    },
  },
  {
    id: 'siteminder', name: 'Siteminder Hotel',
    address: '16 Cambridge Street, Delaware, OH 43015',
    propertyStatus: 'error', propertyStatusLabel: '1 Property issue',
    channelStatus:  'ok',    channelStatusLabel:  'Channels status',
    stats: { arrivals: 32, departures: 19, stays: 6, cancellations: 1, newBookings: 11 },
    dynRevDates: [
      { day:'FRI', date:15, isHighlighted:false, alertCount:2 },
      { day:'SAT', date:16, isHighlighted:false, dayColor:'#F97316' },
      { day:'SUN', date:17, isHighlighted:true,  dayColor:undefined, alertCount:4 },
      { day:'MON', date:18, isHighlighted:true },
      { day:'TUE', date:19, isHighlighted:false, isSoftHighlight:true },
      { day:'WED', date:20, isHighlighted:false, alertCount:2 },
      { day:'THU', date:21, isHighlighted:false },
    ],
    availability: makeDays([6,4,5,2,7,6,4,5,3,6,4,5,3,4]),
    roomsPerf: {
      avg: 187, unit: 'rooms',
      bars: [
        { label:'27', value:160 }, { label:'28', value:220 },
        { label:'29', value:140 }, { label:'30', value:195 },
        { label:'01 Apr', value:250 }, { label:'02', value:210 }, { label:'03', value:170 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:78 },
        { name:'Expedia.com', initial:'✈',  value:62 },
        { name:'Agoda.com',   initial:'A',  value:45 },
      ],
    },
    revenuePerf: {
      avg: 2100, unit: 'AUD',
      bars: [
        { label:'27', value:1400 }, { label:'28', value:1800 },
        { label:'29', value:3200 }, { label:'30', value:2400 },
        { label:'01 Apr', value:3800 }, { label:'02', value:2200 }, { label:'03', value:1600 },
      ],
      channels: [
        { name:'Booking.com', initial:'B.', value:820 },
        { name:'Expedia.com', initial:'✈',  value:680 },
        { name:'Agoda.com',   initial:'A',  value:520 },
      ],
    },
  },
];

const CHART_HEIGHT = 130;

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation, route }: Props) {
  const [perfTab, setPerfTab]           = useState<'rooms' | 'revenue'>('rooms');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property>(PROPERTIES[0]);
  const [search, setSearch]             = useState('');
  const [selectedBar, setSelectedBar]   = useState<number | null>(null);
  const insets = useSafeAreaInsets();

  // Open modal when navigated from Settings with openModal param
  useEffect(() => {
    if (route.params?.openModal) {
      setModalVisible(true);
      navigation.setParams({ openModal: undefined });
    }
  }, [route.params?.openModal]);

  // Reset selected bar when tab or property changes
  useEffect(() => { setSelectedBar(null); }, [perfTab, selectedProperty.id]);

  const { stats, availability, dynRevDates } = selectedProperty;
  const perf   = perfTab === 'rooms' ? selectedProperty.roomsPerf : selectedProperty.revenuePerf;
  const maxBar = Math.max(...perf.bars.map((b) => b.value));
  const avgBottom = (perf.avg / maxBar) * CHART_HEIGHT;

  // When a bar is selected, scale channel values proportionally to that bar
  const displayChannels = selectedBar !== null
    ? perf.channels.map((ch) => ({
        ...ch,
        value: Math.round(ch.value * (perf.bars[selectedBar].value / perf.avg)),
      }))
    : perf.channels;
  const maxCh = Math.max(...displayChannels.map((c) => c.value));

  const filtered = PROPERTIES.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 72 + insets.bottom }}
      >
        {/* ── Blue Header ── */}
        <LinearGradient
          colors={['#1D4ED8', '#1E3A8A']}
          start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }}
          style={styles.header}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate('Settings', {
                  propertyId:      selectedProperty.id,
                  propertyName:    selectedProperty.name,
                  propertyAddress: selectedProperty.address,
                  propertyStatus:  selectedProperty.propertyStatus,
                  channelStatus:   selectedProperty.channelStatus,
                })}
              >
                <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.hotelPill} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
                <Ionicons name="business-outline" size={15} color="#1D4ED8" />
                <Text style={styles.hotelPillText}>{selectedProperty.name}</Text>
              </TouchableOpacity>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.todayRow}>
              <Text style={styles.todayLabel}>Today</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Reservations')}>
                <Text style={styles.todayViewCta}>View reservations</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statsCard}>
              <View style={styles.statsTopRow}>
                {[
                  { label:'Arrivals',   value: String(stats.arrivals).padStart(2,'0')   },
                  { label:'Departures', value: String(stats.departures).padStart(2,'0') },
                  { label:'Stays',      value: String(stats.stays).padStart(2,'0')      },
                ].map((s, i) => (
                  <React.Fragment key={s.label}>
                    {i > 0 && <View style={styles.statVDivider} />}
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>{s.label}</Text>
                      <Text style={styles.statValue}>{s.value}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.statsHDivider} />
              <View style={styles.statsBottomRow}>
                <View style={styles.statBottomItem}>
                  <Text style={styles.statBottomNum}>{stats.cancellations}</Text>
                  <Text style={styles.statBottomLabel}> Cancellations</Text>
                </View>
                <View style={styles.statsVDivider2} />
                <View style={styles.statBottomItem}>
                  <Text style={styles.statBottomNum}>{stats.newBookings}</Text>
                  <Text style={styles.statBottomLabel}> New Bookings</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Dynamic Revenue + */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Dynamic revenue +</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.cardCta}>View calendar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>Nov 15th 2024 - Nov 29th 2024</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
              {dynRevDates.map((d) => {
                const labelColor = d.isHighlighted ? 'white' : (d.dayColor ?? '#6B7280');
                const dateColor  = d.isHighlighted ? 'white' : (d.dayColor ?? '#111827');
                return (
                  <View key={d.date} style={[
                    styles.dynRevDay,
                    d.isHighlighted    && styles.dynRevDayActive,
                    d.isSoftHighlight  && styles.dynRevDaySoft,
                  ]}>
                    <Text style={[styles.dynRevDayName, { color: labelColor }]}>{d.day}</Text>
                    <Text style={[styles.dynRevDayDate, { color: dateColor }]}>{d.date}</Text>
                    {d.alertCount != null ? (
                      <View style={[styles.alertBadge, d.isHighlighted && styles.alertBadgeActive]}>
                        <Ionicons name="megaphone-outline" size={10} color={d.isHighlighted ? 'white' : '#6B7280'} />
                        <Text style={[styles.alertBadgeText, d.isHighlighted && styles.alertBadgeTextActive]}>{d.alertCount}</Text>
                      </View>
                    ) : (
                      <View style={styles.alertBadgePlaceholder} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Availability */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Availability</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.cardCta}>View inventory</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSubtitle}>Nov 15th 2024 - Nov 29th 2024</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
              {availability.map((d) => (
                <View key={d.date} style={styles.dayCard}>
                  <Text style={[styles.dayName, d.isWeekend && styles.weekendText]}>{d.day}</Text>
                  <Text style={[styles.dayDate, d.isWeekend && styles.weekendText]}>{d.date}</Text>
                  <View style={[styles.dayBubble, d.isSelected && styles.dayBubbleSelected]}>
                    <Text style={[styles.dayCount, d.isSelected && styles.dayCountSelected]}>{d.count}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Performance + Channel breakdown */}
          <View style={styles.card}>
            <View style={styles.perfHeaderRow}>
              <Text style={styles.cardTitle}>Performance</Text>
              <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
            </View>

            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, perfTab === 'rooms' && styles.toggleBtnActive]}
                onPress={() => setPerfTab('rooms')}
              >
                <Text style={[styles.toggleText, perfTab === 'rooms' && styles.toggleTextActive]}>Rooms sold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, perfTab === 'revenue' && styles.toggleBtnActive]}
                onPress={() => setPerfTab('revenue')}
              >
                <Text style={[styles.toggleText, perfTab === 'revenue' && styles.toggleTextActive]}>Revenue</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.avgLabel}>AVERAGE</Text>
            <View style={styles.avgRow}>
              <Text style={styles.avgNumber}>
                {selectedBar !== null ? perf.bars[selectedBar].value : perf.avg}
              </Text>
              <Text style={styles.avgUnit}> {perf.unit}</Text>
            </View>
            <Text style={styles.avgDate}>
              {selectedBar !== null
                ? `${perf.bars[selectedBar].label} Mar/Apr 2022`
                : '27 Mar 2022 – 03 Apr 2022'}
            </Text>

            {/* ── Interactive bar chart ── */}
            <View style={styles.chartOuter}>
              <View style={{ flex: 1 }}>
                <View style={{ height: CHART_HEIGHT, position: 'relative' }}>
                  {/* Average line */}
                  <View style={[styles.avgLine, { bottom: avgBottom }]} />
                  {/* Bars */}
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end' }}>
                    {perf.bars.map((bar, idx) => {
                      const barH    = Math.round((bar.value / maxBar) * CHART_HEIGHT);
                      const active  = selectedBar === null || selectedBar === idx;
                      return (
                        <TouchableOpacity
                          key={bar.label}
                          style={{ flex: 1, alignItems: 'center' }}
                          activeOpacity={0.7}
                          onPress={() => setSelectedBar(selectedBar === idx ? null : idx)}
                        >
                          <View
                            style={[
                              styles.bar,
                              { height: barH, backgroundColor: active ? '#1D4ED8' : '#D1D5DB' },
                              selectedBar === idx && styles.barSelected,
                            ]}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {/* X labels */}
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                  {perf.bars.map((bar, idx) => (
                    <View key={bar.label} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={[styles.xLabel, selectedBar === idx && styles.xLabelSelected]}>
                        {bar.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              {/* Y-axis */}
              <View style={{ width: 32, height: CHART_HEIGHT, position: 'relative', marginLeft: 4 }}>
                <Text style={[styles.yLabel, { position:'absolute', top:0, right:0 }]}>{maxBar}</Text>
                <Text style={[styles.yLabel, styles.avgYLabel, { position:'absolute', bottom: avgBottom - 6, right:0 }]}>avg</Text>
                <Text style={[styles.yLabel, { position:'absolute', bottom:0, right:0 }]}>0</Text>
              </View>
            </View>
            {/* X labels row */}
            <View style={{ height: 4 }} />

            {/* Channel breakdown */}
            <View style={styles.channelSection}>
              <Text style={styles.channelSectionTitle}>Channel breakdown</Text>
              {displayChannels.map((ch, i) => (
                <View key={ch.name + i}>
                  {i > 0 && <View style={styles.channelDivider} />}
                  <View style={styles.channelRow}>
                    <View style={styles.channelLogo}>
                      <Text style={styles.channelLogoText}>{ch.initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.channelNameRow}>
                        <Text style={styles.channelName}>{ch.name}</Text>
                        <Text style={styles.channelValue}>{ch.value}</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.round((ch.value / maxCh) * 100)}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Bottom Tab Bar ── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 12 }]}>
        {[
          { key:'home',  label:'Home',          icon:'home',                  active:true  },
          { key:'dist',  label:'Distribution',  icon:'grid-outline',          active:false },
          { key:'res',   label:'Reservations',  icon:'bookmark-outline',      active:false },
          { key:'notif', label:'Notifications', icon:'notifications-outline', active:false },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key} style={styles.tabItem} activeOpacity={0.7}
            onPress={() => {
              if (tab.key === 'dist') navigation.navigate('Distribution');
              if (tab.key === 'res')  navigation.navigate('Reservations');
            }}
          >
            <Ionicons name={tab.icon as any} size={24} color={tab.active ? '#1D4ED8' : '#9CA3AF'} />
            <Text style={[styles.tabLabel, tab.active && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Switch Property Modal (iOS pageSheet) ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        onRequestClose={() => { setModalVisible(false); setSearch(''); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalTitle}>Switch Property</Text>
            <TouchableOpacity
              onPress={() => { setModalVisible(false); setSearch(''); }}
              activeOpacity={0.7}
              hitSlop={{ top:8, bottom:8, left:8, right:8 }}
            >
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.filter((p) => p.id === selectedProperty.id).map((p) => (
              <PropertyRow key={p.id} property={p} selected onPress={() => { setSelectedProperty(p); setModalVisible(false); setSearch(''); }} />
            ))}
            {filtered.filter((p) => p.id !== selectedProperty.id).length > 0 && (
              <>
                <Text style={styles.otherPropertiesLabel}>Other Properties</Text>
                <View style={styles.otherDivider} />
                {filtered.filter((p) => p.id !== selectedProperty.id).map((p) => (
                  <PropertyRow key={p.id} property={p} selected={false} onPress={() => { setSelectedProperty(p); setModalVisible(false); setSearch(''); }} />
                ))}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: PropertyStatus; label: string }) {
  const isOk = status === 'ok';
  return (
    <View style={[styles.badge, isOk ? styles.badgeOk : styles.badgeError]}>
      {isOk
        ? <Ionicons name="checkmark" size={12} color="#16A34A" />
        : <Ionicons name="warning-outline" size={12} color="#DC2626" />}
      <Text style={[styles.badgeText, isOk ? styles.badgeTextOk : styles.badgeTextError]}>{label}</Text>
    </View>
  );
}

function PropertyRow({ property, selected, onPress }: { property: Property; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.propertyRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyAddress}>{property.address}</Text>
        <View style={styles.badgesRow}>
          <StatusBadge status={property.propertyStatus} label={property.propertyStatusLabel} />
          <StatusBadge status={property.channelStatus}  label={property.channelStatusLabel}  />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  header: { paddingHorizontal: 16, paddingBottom: 24 },
  headerTop: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:8, marginBottom:16 },
  settingsBtn: { width:36, height:36, justifyContent:'center', alignItems:'center' },
  hotelPill: { flexDirection:'row', alignItems:'center', backgroundColor:'white', borderRadius:20, paddingHorizontal:14, paddingVertical:7, gap:6 },
  hotelPillText: { fontSize:14, fontWeight:'600', color:'#111827' },
  todayRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  todayLabel: { fontSize:28, fontWeight:'700', color:'white' },
  todayViewCta: { fontSize:13, fontWeight:'600', color:'rgba(255,255,255,0.9)' },

  statsCard: { backgroundColor:'rgba(255,255,255,0.15)', borderRadius:12, borderWidth:1, borderColor:'rgba(255,255,255,0.2)', overflow:'hidden' },
  statsTopRow: { flexDirection:'row', paddingVertical:16 },
  statItem: { flex:1, alignItems:'center' },
  statLabel: { fontSize:12, color:'rgba(255,255,255,0.75)', marginBottom:4 },
  statValue: { fontSize:30, fontWeight:'700', color:'white' },
  statVDivider: { width:1, backgroundColor:'rgba(255,255,255,0.3)', marginVertical:8 },
  statsHDivider: { height:1, backgroundColor:'rgba(255,255,255,0.25)' },
  statsBottomRow: { flexDirection:'row', paddingVertical:12 },
  statBottomItem: { flex:1, flexDirection:'row', justifyContent:'center', alignItems:'center' },
  statBottomNum: { fontSize:16, fontWeight:'700', color:'white' },
  statBottomLabel: { fontSize:13, color:'rgba(255,255,255,0.8)' },
  statsVDivider2: { width:1, backgroundColor:'rgba(255,255,255,0.3)', marginVertical:4 },

  body: { padding:16, gap:16 },
  card: { backgroundColor:'white', borderRadius:12, padding:16, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2 },
  cardHeaderRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:2 },
  cardTitle: { fontSize:16, fontWeight:'700', color:'#111827' },
  cardCta: { fontSize:13, fontWeight:'600', color:'#1D4ED8' },
  cardSubtitle: { fontSize:13, color:'#9CA3AF', marginBottom:14, marginTop:2 },

  dynRevDay: { alignItems:'center', borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, paddingVertical:8, paddingHorizontal:10, gap:4, minWidth:58 },
  dynRevDayActive: { backgroundColor:'#1D4ED8', borderColor:'#1D4ED8' },
  dynRevDaySoft:   { backgroundColor:'#EFF6FF', borderColor:'#BFDBFE' },
  dynRevDayName: { fontSize:11, fontWeight:'500', color:'#6B7280' },
  dynRevDayDate: { fontSize:14, fontWeight:'600', color:'#111827' },
  dynRevTextActive: { color:'white' },
  alertBadge: { flexDirection:'row', alignItems:'center', gap:2, backgroundColor:'#F3F4F6', borderRadius:10, paddingHorizontal:5, paddingVertical:2 },
  alertBadgeActive: { backgroundColor:'rgba(255,255,255,0.25)' },
  alertBadgeText: { fontSize:10, fontWeight:'600', color:'#6B7280' },
  alertBadgeTextActive: { color:'white' },
  alertBadgePlaceholder: { height:18 },

  calendarScroll: { gap:6, paddingRight:4 },
  dayCard: { width:58, alignItems:'center', borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, paddingVertical:8, gap:4 },
  dayName: { fontSize:11, fontWeight:'500', color:'#6B7280' },
  dayDate: { fontSize:14, fontWeight:'600', color:'#111827' },
  weekendText: { color:'#EF4444' },
  dayBubble: { width:28, height:28, borderRadius:14, backgroundColor:'#F3F4F6', justifyContent:'center', alignItems:'center', marginTop:2 },
  dayBubbleSelected: { backgroundColor:'#F59E0B' },
  dayCount: { fontSize:13, fontWeight:'600', color:'#374151' },
  dayCountSelected: { color:'white' },

  perfHeaderRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  toggle: { flexDirection:'row', backgroundColor:'#F3F4F6', borderRadius:8, padding:3, marginBottom:16 },
  toggleBtn: { flex:1, paddingVertical:8, borderRadius:6, alignItems:'center' },
  toggleBtnActive: { backgroundColor:'white', shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:2, elevation:1 },
  toggleText: { fontSize:13, fontWeight:'500', color:'#6B7280' },
  toggleTextActive: { fontWeight:'600', color:'#111827' },
  avgLabel: { fontSize:11, fontWeight:'600', color:'#9CA3AF', letterSpacing:0.5 },
  avgRow: { flexDirection:'row', alignItems:'baseline', marginTop:2, marginBottom:2 },
  avgNumber: { fontSize:36, fontWeight:'700', color:'#111827' },
  avgUnit: { fontSize:16, color:'#6B7280', marginLeft:4 },
  avgDate: { fontSize:12, color:'#9CA3AF', marginBottom:12 },

  chartOuter: { flexDirection:'row', alignItems:'flex-start' },
  avgLine: { position:'absolute', left:0, right:0, height:1, backgroundColor:'#93C5FD' },
  bar: { width:18, borderRadius:3 },
  barSelected: { width:20 },
  xLabel: { fontSize:9, color:'#9CA3AF', textAlign:'center' },
  xLabelSelected: { color:'#1D4ED8', fontWeight:'600' },
  yLabel: { fontSize:10, color:'#9CA3AF' },
  avgYLabel: { color:'#93C5FD' },

  channelSection: { marginTop:16, borderTopWidth:1, borderTopColor:'#F3F4F6', paddingTop:16 },
  channelSectionTitle: { fontSize:15, fontWeight:'700', color:'#111827', marginBottom:4 },
  channelDivider: { height:1, backgroundColor:'#F3F4F6', marginVertical:4 },
  channelRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:8 },
  channelLogo: { width:40, height:40, borderRadius:8, backgroundColor:'#EFF6FF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#DBEAFE' },
  channelLogoText: { fontSize:13, fontWeight:'700', color:'#1D4ED8' },
  channelNameRow: { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  channelName: { fontSize:14, fontWeight:'500', color:'#374151' },
  channelValue: { fontSize:14, fontWeight:'700', color:'#111827' },
  progressTrack: { height:5, backgroundColor:'#E5E7EB', borderRadius:3, overflow:'hidden' },
  progressFill: { height:5, backgroundColor:'#1D4ED8', borderRadius:3 },

  tabBar: { position:'absolute', bottom:0, left:0, right:0, flexDirection:'row', backgroundColor:'white', borderTopWidth:1, borderTopColor:'#E5E7EB', paddingTop:8 },
  tabItem: { flex:1, alignItems:'center', gap:2 },
  tabLabel: { fontSize:10, color:'#9CA3AF', fontWeight:'500' },
  tabLabelActive: { color:'#1D4ED8' },

  modalContainer: { flex:1, backgroundColor:'white', paddingHorizontal:16, paddingTop:12 },
  modalHandle: { width:36, height:4, backgroundColor:'#D1D5DB', borderRadius:2, alignSelf:'center', marginBottom:16 },
  modalTitleRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  modalTitle: { fontSize:17, fontWeight:'700', color:'#111827' },
  searchBar: { flexDirection:'row', alignItems:'center', backgroundColor:'#F3F4F6', borderRadius:10, paddingHorizontal:10, paddingVertical:9, gap:8, marginBottom:16 },
  searchInput: { flex:1, fontSize:14, color:'#111827', padding:0 },
  otherPropertiesLabel: { fontSize:13, fontWeight:'700', color:'#374151', marginTop:8, marginBottom:10 },
  otherDivider: { height:1, backgroundColor:'#F3F4F6', marginBottom:4 },

  propertyRow: { flexDirection:'row', alignItems:'flex-start', gap:12, paddingVertical:12 },
  radio: { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:'#D1D5DB', justifyContent:'center', alignItems:'center', marginTop:2 },
  radioSelected: { borderColor:'#1D4ED8' },
  radioDot: { width:10, height:10, borderRadius:5, backgroundColor:'#1D4ED8' },
  propertyName: { fontSize:15, fontWeight:'600', color:'#111827', marginBottom:2 },
  propertyAddress: { fontSize:12, color:'#6B7280', marginBottom:8 },
  badgesRow: { flexDirection:'row', gap:8, flexWrap:'wrap' },

  badge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  badgeOk: { backgroundColor:'#DCFCE7' },
  badgeError: { backgroundColor:'#FEE2E2' },
  badgeText: { fontSize:12, fontWeight:'500' },
  badgeTextOk: { color:'#16A34A' },
  badgeTextError: { color:'#DC2626' },
});
