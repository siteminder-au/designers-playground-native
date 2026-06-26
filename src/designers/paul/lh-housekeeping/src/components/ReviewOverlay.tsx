import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

export interface ReviewMarker {
  num: number;
  rect: { x: number; y: number; w: number; h: number };
  title: string;
  body: string;
}

export interface ReviewAnnotations {
  screen: string;
  generated: string;
  markers: ReviewMarker[];
  working_well: string[];
  worth_considering: string[];
}

interface Props {
  data: ReviewAnnotations;
  scrollOffset: number;
}

export function ReviewOverlay({ data, scrollOffset }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [activeNum, setActiveNum] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);

  const activeMarker = data.markers.find(m => m.num === activeNum) ?? null;
  const activeIdx    = data.markers.findIndex(m => m.num === activeNum);

  const goNext = () => {
    const next = data.markers[(activeIdx + 1) % data.markers.length];
    setActiveNum(next.num);
  };
  const goPrev = () => {
    const prev = data.markers[(activeIdx - 1 + data.markers.length) % data.markers.length];
    setActiveNum(prev.num);
  };

  return (
    <>
      {/* Screen-blocking layer — absorbs all touches; only badges + chip are interactive */}
      <View style={[StyleSheet.absoluteFill, styles.screenBlock]}>

        {/* Markers — each badge + rect scrolls with content */}
        {data.markers.map(marker => {
          const screenY = marker.rect.y - scrollOffset;
          if (screenY + marker.rect.h < -30 || screenY > windowHeight + 30) return null;

          return (
            <React.Fragment key={marker.num}>
              <View
                pointerEvents="none"
                style={[styles.markerRect, {
                  left:   marker.rect.x,
                  top:    screenY,
                  width:  marker.rect.w,
                  height: marker.rect.h,
                }]}
              />
              <TouchableOpacity
                style={[styles.badge, {
                  left: marker.rect.x - 11,
                  top:  screenY - 11,
                }]}
                onPress={() => setActiveNum(marker.num)}
                hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
              >
                <Text style={styles.badgeText}>{marker.num}</Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}

        {/* Summary chip — fixed, above tab bar */}
        <TouchableOpacity style={styles.summaryChip} onPress={() => setShowReport(true)}>
          <Text style={styles.summaryChipText}>⚑  {data.markers.length} issues</Text>
        </TouchableOpacity>

      </View>

      {/* Issue detail sheet */}
      <Modal
        visible={activeMarker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveNum(null)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setActiveNum(null)} activeOpacity={1} />
          {activeMarker && (
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetRow}>
                <View style={styles.sheetBadge}>
                  <Text style={styles.sheetBadgeText}>{activeMarker.num}</Text>
                </View>
                <Text style={styles.sheetTitle} numberOfLines={2}>{activeMarker.title}</Text>
                <TouchableOpacity onPress={() => setActiveNum(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetBody}>{activeMarker.body}</Text>
              <View style={styles.navRow}>
                <TouchableOpacity onPress={goPrev} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.navCount}>{activeIdx + 1} of {data.markers.length}</Text>
                <TouchableOpacity onPress={goNext} style={styles.navBtn}>
                  <Text style={styles.navBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Full report sheet */}
      <Modal
        visible={showReport}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReport(false)}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowReport(false)} activeOpacity={1} />
          <View style={[styles.sheet, styles.reportSheet]}>
            <View style={styles.sheetHandle} />
            <View style={[styles.sheetRow, { marginBottom: 2 }]}>
              <Text style={[styles.sheetTitle, { marginLeft: 0, flex: 1 }]}>
                Design review · {data.screen}
              </Text>
              <TouchableOpacity onPress={() => setShowReport(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reportDate}>{data.generated}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              <Text style={styles.reportSection}>Issues</Text>
              {data.markers.map(m => (
                <TouchableOpacity
                  key={m.num}
                  style={styles.reportIssueRow}
                  onPress={() => { setShowReport(false); setActiveNum(m.num); }}
                >
                  <View style={styles.sheetBadge}>
                    <Text style={styles.sheetBadgeText}>{m.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportIssueTitle}>{m.title}</Text>
                    <Text style={styles.reportIssueBody} numberOfLines={2}>{m.body}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {data.working_well.length > 0 && (
                <>
                  <Text style={[styles.reportSection, styles.reportSectionGreen]}>Working well</Text>
                  {data.working_well.map((item, i) => (
                    <Text key={i} style={styles.reportBullet}>· {item}</Text>
                  ))}
                </>
              )}

              {data.worth_considering.length > 0 && (
                <>
                  <Text style={[styles.reportSection, styles.reportSectionAmber]}>Worth considering</Text>
                  {data.worth_considering.map((item, i) => (
                    <Text key={i} style={styles.reportBullet}>· {item}</Text>
                  ))}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screenBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  markerRect: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ff3b30',
    backgroundColor: 'rgba(255, 59, 48, 0.07)',
    borderRadius: 3,
  },
  badge: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  summaryChip: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  summaryChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Sheets
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  reportSheet: {
    maxHeight: '78%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  sheetBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  sheetBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    lineHeight: 22,
    marginLeft: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#999',
  },
  sheetBody: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 20,
  },

  // Detail nav
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 14,
  },
  navBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  navBtnText: {
    fontSize: 14,
    color: '#ff3b30',
    fontWeight: '600',
  },
  navCount: {
    fontSize: 13,
    color: '#999',
  },

  // Report
  reportDate: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 2,
  },
  reportSection: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff3b30',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  reportSectionGreen: {
    color: '#2e6e30',
  },
  reportSectionAmber: {
    color: '#7a6000',
  },
  reportIssueRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  reportIssueTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  reportIssueBody: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  reportBullet: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 4,
  },
});
