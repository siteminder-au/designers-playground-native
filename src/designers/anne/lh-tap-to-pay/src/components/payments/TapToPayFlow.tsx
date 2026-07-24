import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import ContactlessWave from '../../../assets/ContactlessWave.svg';

// Layout (dark full-bleed background, "Hold Here to Pay" / "Done" wording, the
// merchant+amount card, and the bottom-left close button) follows Apple's own
// Tap to Pay on iPhone reference screens (Apple Design Resources, Figma) for
// visual/layout parity. No assets from that file are used — icons and colors
// here are original, per that kit's license restricting its actual Template
// Content to Apple-platform-only software (see project notes).
function MerchantCard({ amountLabel }: { amountLabel: string }) {
  return (
    <View style={styles.merchantCard}>
      <View style={styles.merchantIconCircle}>
        <Ionicons name="storefront" size={22} color="#fff" />
      </View>
      <Text style={styles.merchantName}>The Eco Fern Ecotel</Text>
      <Text style={styles.merchantAmount}>{amountLabel}</Text>
    </View>
  );
}

type Step = 'terms' | 'enabled' | 'configuring' | 'ready' | 'processing' | 'pin' | 'success' | 'declined';

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

function PulseRings() {
  const progress1 = useRef(new Animated.Value(0)).current;
  const progress2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (value: Animated.Value, delay: number) => {
      value.setValue(0);
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 1800, useNativeDriver: true }),
        ])
      );
    };
    const a1 = loop(progress1, 0);
    const a2 = loop(progress2, 900);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, []);

  const ringStyle = (value: Animated.Value) => ({
    transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
    opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
  });

  return (
    <View style={styles.pulse}>
      <Animated.View style={[styles.pulseRing, ringStyle(progress1)]} />
      <Animated.View style={[styles.pulseRing, ringStyle(progress2)]} />
      <ContactlessWave width={56} height={56} color={COLORS.Primary[100]} style={styles.pulseIcon} />
    </View>
  );
}

export function TapToPayFlow({
  visible,
  amountLabel,
  termsAccepted,
  emailReceiptRequested,
  onAcceptTerms,
  onClose,
  onDone,
}: {
  visible: boolean;
  amountLabel: string;
  termsAccepted: boolean;
  emailReceiptRequested: boolean;
  onAcceptTerms: () => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>('terms');
  const [pin, setPin] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearScheduled() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  // Reset the state machine fresh every time the flow is (re)opened — mirrors the
  // source's behaviour of remounting a new instance each time it's shown.
  useEffect(() => {
    if (visible) {
      setStep(termsAccepted ? 'configuring' : 'terms');
      setPin('');
    } else {
      clearScheduled();
    }
  }, [visible]);

  // The device-configuration step is a genuine wait every time the app becomes
  // frontmost, per the HIG's "Checking out" guidance — not just on first setup.
  // This only schedules when a transition actually lands on 'configuring', so it
  // never clobbers a timer owned by a different step (e.g. 'processing').
  useEffect(() => {
    if (step !== 'configuring') return;
    clearScheduled();
    timerRef.current = setTimeout(() => setStep('ready'), 1400);
    return clearScheduled;
  }, [step]);

  useEffect(() => clearScheduled, []);

  function acceptTerms() {
    onAcceptTerms();
    setStep('enabled');
  }

  function goToProcessingThen(nextStep: Step, delay = 1000) {
    setStep('processing');
    clearScheduled();
    timerRef.current = setTimeout(() => setStep(nextStep), delay);
  }

  function simulate(outcome: 'approved' | 'pin' | 'declined') {
    if (outcome === 'pin') {
      setPin('');
      setStep('pin');
      return;
    }
    goToProcessingThen(outcome === 'declined' ? 'declined' : 'success');
  }

  function pressKey(key: string) {
    if (!key) return;
    if (key === 'back') {
      setPin(p => p.slice(0, -1));
      return;
    }
    setPin(p => {
      if (p.length >= 4) return p;
      const next = p + key;
      if (next.length === 4) {
        clearScheduled();
        timerRef.current = setTimeout(() => goToProcessingThen('success', 900), 300);
      }
      return next;
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.ttp} edges={['top', 'bottom']}>
        {step === 'terms' && (
          <View style={styles.screen}>
            <View style={styles.badge}>
              <ContactlessWave width={48} height={48} color={COLORS.Primary[100]} />
            </View>
            <Text style={styles.title}>Set up Tap to Pay on iPhone</Text>
            <Text style={styles.text}>
              Accept contactless cards and digital wallets directly on this iPhone — no extra
              hardware needed. This is a one-time setup for this device.
            </Text>
            <Text style={styles.legal}>
              By continuing, you agree to Apple's Tap to Pay on iPhone Terms and Conditions.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primary} onPress={acceptTerms}>
                <Text style={styles.primaryText}>Agree and continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondary} onPress={onClose}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'enabled' && (
          <View style={styles.screen}>
            <View style={[styles.badge, styles.badgeSuccess]}>
              <Ionicons name="checkmark" size={32} color="#1fa855" />
            </View>
            <Text style={styles.title}>Tap to Pay on iPhone is ready</Text>
            <Text style={styles.text}>You can now accept contactless payments directly on this iPhone.</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primary} onPress={() => setStep('configuring')}>
                <Text style={styles.primaryText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'configuring' && (
          <View style={styles.darkCenteredScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />
            <ActivityIndicator size="large" color={COLORS.Primary[100]} />
            <Text style={styles.textDark}>Getting ready for Tap to Pay…</Text>
          </View>
        )}

        {step === 'ready' && (
          <View style={styles.darkScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.readyTop}>
              <Text style={styles.holdTitle}>Hold Here to Pay</Text>
              <PulseRings />
            </View>

            <MerchantCard amountLabel={amountLabel} />

            <View style={{ flex: 1 }} />

            {/* No real NFC hardware in a browser mockup — these stand in for a
                customer's tap so the rest of the flow (PIN, approval, decline/
                fallback) can be previewed on demand. */}
            <View style={styles.debugDark}>
              <Text style={styles.debugLabelDark}>Prototype controls — simulate a tap</Text>
              <View style={styles.debugRow}>
                <TouchableOpacity style={styles.debugButtonDark} onPress={() => simulate('approved')}>
                  <Text style={styles.debugButtonTextDark}>Approved</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.debugButtonDark} onPress={() => simulate('pin')}>
                  <Text style={styles.debugButtonTextDark}>Approved (PIN)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.debugButtonDark} onPress={() => simulate('declined')}>
                  <Text style={styles.debugButtonTextDark}>Declined</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.closeCircle} onPress={onClose} accessibilityLabel="Cancel">
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'processing' && (
          <View style={styles.darkCenteredScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />
            <ActivityIndicator size="large" color={COLORS.Primary[100]} />
            <Text style={styles.textDark}>Processing payment…</Text>
          </View>
        )}

        {step === 'pin' && (
          <View style={styles.darkScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />

            <View style={{ flex: 1 }} />

            <Text style={styles.doneTitle}>Enter PIN</Text>
            <View style={styles.pinDots}>
              {[1, 2, 3, 4].map(n => (
                <View key={n} style={[styles.pinDotDark, n <= pin.length && styles.pinDotFilledDark]} />
              ))}
            </View>
            <View style={styles.keypad}>
              {KEYPAD_KEYS.map((key, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.keyDark, !key && styles.keyEmptyDark]}
                  disabled={!key}
                  onPress={() => pressKey(key)}
                >
                  {key === 'back' ? (
                    <Ionicons name="backspace-outline" size={22} color="#fff" />
                  ) : (
                    <Text style={styles.keyTextDark}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.closeCircle} onPress={onClose} accessibilityLabel="Cancel">
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.darkScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />

            <View style={styles.readyTop}>
              <View style={styles.checkBadgeDark}>
                <Ionicons name="checkmark" size={32} color="#0a84ff" />
              </View>
              <Text style={styles.doneTitle}>Done</Text>
            </View>

            <MerchantCard amountLabel={amountLabel} />
            {emailReceiptRequested && (
              <Text style={styles.receiptTextDark}>A receipt has been emailed to the guest.</Text>
            )}

            <View style={{ flex: 1 }} />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primary} onPress={onDone}>
                <Text style={styles.primaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'declined' && (
          <View style={styles.darkScreen}>
            <LinearGradient colors={['#050505', '#3a3a3c']} style={StyleSheet.absoluteFillObject} />

            <View style={{ flex: 1 }} />

            <View style={styles.badgeDeclinedDark}>
              <Ionicons name="close" size={32} color="#ff453a" />
            </View>
            <Text style={styles.doneTitle}>Payment declined</Text>
            <Text style={styles.receiptTextDark}>
              The card couldn't be read or was declined. Try another card, or use a different payment
              method.
            </Text>

            <View style={{ flex: 1 }} />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primary} onPress={() => setStep('ready')}>
                <Text style={styles.primaryText}>Try again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryDark} onPress={onClose}>
                <Text style={styles.secondaryTextDark}>Use a different method</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ttp: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary[600],
  },
  badgeSuccess: {
    backgroundColor: '#e3f6ea',
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
    maxWidth: 280,
  },
  legal: {
    fontSize: 12,
    color: COLORS.Black[500],
    textAlign: 'center',
    maxWidth: 280,
  },
  actions: {
    gap: 10,
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  primary: {
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
  secondary: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.Black[100],
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
  pulse: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseIcon: {
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 104, 66, 0.35)',
  },
  darkScreen: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  darkCenteredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  textDark: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    maxWidth: 280,
  },
  readyTop: {
    alignItems: 'center',
    gap: 16,
  },
  holdTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  checkBadgeDark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#0a84ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantCard: {
    marginTop: 32,
    minWidth: 240,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    gap: 8,
  },
  merchantIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.Primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  merchantAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  receiptTextDark: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  closeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  badgeDeclinedDark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#ff453a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryDark: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
  },
  secondaryTextDark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  debugDark: {
    width: '100%',
    gap: 8,
    paddingTop: 12,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  debugLabelDark: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  debugButtonDark: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  debugButtonTextDark: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  debug: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d8d8d8',
    borderStyle: 'dashed',
  },
  debugLabel: {
    fontSize: 11,
    color: COLORS.Black[500],
  },
  debugRow: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.Black[400],
  },
  pinDots: {
    flexDirection: 'row',
    gap: 14,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.Black[100],
  },
  pinDotFilled: {
    backgroundColor: COLORS.Black[100],
  },
  pinDotDark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  pinDotFilledDark: {
    backgroundColor: '#fff',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 64 * 3 + 16 * 2,
    gap: 16,
    marginVertical: 8,
  },
  key: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.Black[100],
  },
  keyDark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmptyDark: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  keyTextDark: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
});
