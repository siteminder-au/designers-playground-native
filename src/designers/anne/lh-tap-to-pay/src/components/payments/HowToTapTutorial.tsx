import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import ContactlessWave from '../../../assets/ContactlessWave.svg';

// The persistent "How to Tap" education entry point Apple's Tap to Pay on
// iPhone HIG page requires (a Learn More reachable "in a persistent settings/
// help area", not just inline during checkout — see [[reference_apple-hig]]).
// Apple's own real tutorial is a system-provided two-step overlay
// (ProximityReaderDiscovery's howToTap content) that can only be shown from a
// compiled native iOS app; this is an original two-step approximation of that
// same content for the web-deployed prototype.
const STEPS = [
  {
    icon: 'card-outline' as const,
    title: 'Start a charge',
    text: 'From the Take payment screen, enter an amount and choose Tap to Pay on iPhone as the payment method.',
  },
  {
    icon: null,
    title: 'Hold their card or device near the top of iPhone',
    text: "Ask the customer to hold their contactless card, Apple Pay, or Google Pay device near the top of your iPhone. They'll feel a vibration when the payment starts, and may be asked to enter their PIN. You'll see a checkmark once the payment is approved.",
  },
];

export function HowToTapTutorial({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible]);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={COLORS.Black[300]} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.badge}>
            {step.icon ? (
              <Ionicons name={step.icon} size={32} color={COLORS.Primary[100]} />
            ) : (
              <ContactlessWave width={40} height={40} color={COLORS.Primary[100]} />
            )}
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.text}>{step.text}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {STEPS.map((_, index) => (
              <View key={index} style={[styles.dot, index === stepIndex && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity
            style={styles.primary}
            onPress={() => (isLastStep ? onClose() : setStepIndex(i => i + 1))}
          >
            <Text style={styles.primaryText}>{isLastStep ? 'Got it' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary[600],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.Black[100],
    textAlign: 'center',
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.Black[300],
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#d8d8d8',
  },
  dotActive: {
    backgroundColor: COLORS.Primary[100],
  },
  primary: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.Primary[100],
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
