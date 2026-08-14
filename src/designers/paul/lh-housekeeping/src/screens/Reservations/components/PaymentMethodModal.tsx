import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CardBrandIcon, CardBrand } from './CardBrandIcon';
import { useBottomSheet } from '../../HousekeepingReports/hooks/useBottomSheet';
import { PaymentMethodDemoFlagsSheet } from './PaymentMethodDemoFlagsSheet';
import PM_FLAGS from '../../../config/paymentMethodFeatureFlags';

const ORANGE = '#ff6842';

export interface PaymentCard {
  id: string;
  brand: CardBrand;
  name: string;
  last4: string;
}

type SubTab = 'existing' | 'new';

export function PaymentMethodModal({
  visible,
  cards,
  selectedCardId,
  onClose,
  onSelectCard,
  onSetUpTapToPay,
}: {
  visible: boolean;
  cards: PaymentCard[];
  selectedCardId: string;
  onClose: () => void;
  onSelectCard: (card: PaymentCard) => void;
  onSetUpTapToPay: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [subTab, setSubTab] = useState<SubTab>('existing');
  const [flags, setFlags] = useState(PM_FLAGS);
  const {
    visible: demoSheetVisible, setVisible: setDemoSheetVisible, close: closeDemoSheet,
    sheetAnim: demoSheetAnim, translateY: demoTranslateY, panResponder: demoPanResponder,
  } = useBottomSheet(400);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabberArea}><View style={styles.grabber} /></View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
            <View style={styles.headerTitleWrap} pointerEvents="none">
              <Text style={styles.headerTitle}>Payment details</Text>
            </View>
            <TouchableOpacity onPress={() => setDemoSheetVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="flask-outline" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Existing / New segmented control */}
          <View style={styles.segmentedWrapper}>
            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segmentOption, subTab === 'existing' && styles.segmentOptionActive]}
                onPress={() => setSubTab('existing')}
              >
                <Text style={[styles.segmentText, subTab === 'existing' && styles.segmentTextActive]}>Existing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentOption, subTab === 'new' && styles.segmentOptionActive]}
                onPress={() => setSubTab('new')}
              >
                <Text style={[styles.segmentText, subTab === 'new' && styles.segmentTextActive]}>New</Text>
              </TouchableOpacity>
            </View>
          </View>

          {subTab === 'new' ? (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Adding a new card isn't part of this exploration yet.</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
              {/* Set up Tap to Pay */}
              {flags.tapToPaySetupVariant === 'row' && (
                <View style={styles.ttpContainer}>
                  <TouchableOpacity style={styles.ttpRow} activeOpacity={0.7} onPress={onSetUpTapToPay}>
                    <MaterialCommunityIcons name="contactless-payment-circle-outline" size={20} color={ORANGE} style={{ marginRight: 8 }} />
                    <Text style={styles.ttpText}>Set up Tap to Pay</Text>
                    <Ionicons name="arrow-forward" size={16} color={ORANGE} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  <Text style={styles.ttpBody}>Accept contactless cards & Apple Pay with just your iPhone - no reader needed.</Text>
                </View>
              )}

              {flags.tapToPaySetupVariant === 'button' && (
                <View style={styles.ttpContainer}>
                  <TouchableOpacity style={styles.ttpButton} activeOpacity={0.8} onPress={onSetUpTapToPay}>
                    <MaterialCommunityIcons name="contactless-payment-circle-outline" size={18} color={ORANGE} style={{ marginRight: 8 }} />
                    <Text style={styles.ttpButtonText}>Set up Tap to Pay</Text>
                  </TouchableOpacity>
                </View>
              )}

              {flags.tapToPaySetupVariant === 'banner' && (
                <View style={styles.ttpContainer}>
                  <View style={styles.ttpBanner}>
                    <MaterialCommunityIcons name="contactless-payment-circle-outline" size={20} color={ORANGE} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ttpBannerTitle}>Accept this with Tap to Pay</Text>
                      <Text style={styles.ttpBannerBody}>Use your iPhone to take contactless payments — no reader needed.</Text>
                      <TouchableOpacity onPress={onSetUpTapToPay} activeOpacity={0.7}>
                        <Text style={styles.ttpBannerCta}>Set up now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {flags.tapToPaySetupVariant === 'badge' && (
                <View style={styles.ttpContainer}>
                  <TouchableOpacity style={styles.ttpBadge} activeOpacity={0.7} onPress={onSetUpTapToPay}>
                    <MaterialCommunityIcons name="contactless-payment-circle-outline" size={12} color={ORANGE} style={{ marginRight: 4 }} />
                    <Text style={styles.ttpBadgeText}>Tap to Pay available</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.divider} />

              {/* Cards */}
              <View style={styles.cardsSection}>
                <Text style={styles.cardsTitle}>Cards</Text>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#767680" style={{ marginRight: 8 }} />
                  <Text style={styles.infoText}>Your existing cards are connected to the reservation and cannot be edited</Text>
                </View>

                <View style={styles.cardList}>
                  {cards.map(card => {
                    const isSelected = card.id === selectedCardId;
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[styles.cardRow, isSelected ? styles.cardRowSelected : styles.cardRowUnselected]}
                        activeOpacity={0.7}
                        onPress={() => { onSelectCard(card); onClose(); }}
                      >
                        <CardBrandIcon brand={card.brand} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.cardName}>{card.name}</Text>
                          <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      <PaymentMethodDemoFlagsSheet
        visible={demoSheetVisible}
        onClose={closeDemoSheet}
        sheetAnim={demoSheetAnim}
        translateY={demoTranslateY}
        panResponder={demoPanResponder}
        flags={flags}
        setFlags={setFlags}
        insetsBottom={insets.bottom}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: '94%',
  },
  grabberArea: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  grabber: { width: 36, height: 5, borderRadius: 2.5, backgroundColor: '#d1d1d6' },

  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#000' },
  closeText: { fontSize: 16, fontWeight: '400', color: ORANGE },

  segmentedWrapper: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 8,
    padding: 2,
    height: 32,
  },
  segmentOption: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 7 },
  segmentOptionActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  segmentText: { fontSize: 15, fontWeight: '500', color: '#000' },
  segmentTextActive: { fontWeight: '700' },

  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  comingSoonText: { fontSize: 14, color: '#6d7272', textAlign: 'center', lineHeight: 20 },

  ttpContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 8 },
  ttpRow: { flexDirection: 'row', alignItems: 'center' },
  ttpText: { fontSize: 15, fontWeight: '700', color: ORANGE },
  ttpBody: { fontSize: 14, color: '#333', lineHeight: 18 },

  ttpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 12,
  },
  ttpButtonText: { fontSize: 14, fontWeight: '700', color: ORANGE },

  ttpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff4ef',
    borderRadius: 10,
    padding: 12,
  },
  ttpBannerTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
  ttpBannerBody: { fontSize: 12, color: '#6d7272', lineHeight: 17, marginBottom: 6 },
  ttpBannerCta: { fontSize: 12, fontWeight: '700', color: ORANGE },

  ttpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff4ef',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ttpBadgeText: { fontSize: 11, fontWeight: '700', color: ORANGE },

  divider: { height: 1, backgroundColor: '#e5e8e8', marginHorizontal: 16 },

  cardsSection: { paddingHorizontal: 16, paddingTop: 24, gap: 16 },
  cardsTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f4f4f4',
    borderRadius: 6,
    padding: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: '#333', lineHeight: 16 },

  cardList: { gap: 16 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    padding: 16,
    backgroundColor: '#fff',
  },
  cardRowSelected: { borderColor: '#212323' },
  cardRowUnselected: { borderColor: '#e5e8e8' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardNumber: { fontSize: 12, color: '#333', marginTop: 4 },
});
