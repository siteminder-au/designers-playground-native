import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// ── Tokens ────────────────────────────────────────────────────────────────────

const ORANGE = '#ff6842';
const DARK = '#111214';
const GREEN = '#1b7b3e';

// ── Flow steps ────────────────────────────────────────────────────────────────
// 0: intro  1: terms  2: face id (Apple system step, mocked)
// 3-6: education carousel  7: setting up  8: ready

const TOTAL_EDU_STEPS = 4;

const EDU_STEPS = [
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Accept contactless cards',
    body: 'Guests simply tap their debit or credit card on the back of your iPhone to pay — no card reader or extra hardware required.',
  },
  {
    icon: 'card-outline' as const,
    title: 'Accept Apple Pay & digital wallets',
    body: 'Tap to Pay on iPhone also accepts Apple Pay and other contactless digital wallets, right alongside physical cards.',
  },
  {
    icon: 'lock-closed-outline' as const,
    title: 'PIN entry, when needed',
    body: 'Occasionally a card requires a PIN. Hand the iPhone to your guest so they can enter it privately.',
    note: "VoiceOver reads each digit aloud as it's entered, for guests using accessibility features.",
  },
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Works on this iPhone',
    body: 'Tap to Pay on iPhone is available on iPhone XS and later, running the latest iOS. This device is compatible and ready to be configured.',
  },
];

export default function TapToPayScreen({ navigation }: { navigation: any }) {
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [progress, setProgress] = useState(0);

  const exit = () => navigation.navigate('Reservations');

  // Step 2 — Face ID mock: auto-advance after a beat.
  useEffect(() => {
    if (step !== 2) return;
    const t = setTimeout(() => setStep(3), 1400);
    return () => clearTimeout(t);
  }, [step]);

  // Step 7 — Setting up: animate progress, then auto-advance.
  useEffect(() => {
    if (step !== 7) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(8), 300);
          return 100;
        }
        return p + 5;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [step]);

  return (
    <SafeAreaView style={[styles.safeArea, step === 0 && styles.safeAreaDark]}>
      {step === 0 && <IntroStep onEnable={() => setStep(1)} onClose={exit} />}
      {step === 1 && (
        <TermsStep
          agreed={agreed}
          onToggleAgree={() => setAgreed(v => !v)}
          onClose={exit}
          onContinue={() => setStep(2)}
        />
      )}
      {step === 2 && <FaceIdStep />}
      {step >= 3 && step <= 6 && (
        <EducationStep
          index={step - 3}
          onClose={exit}
          onBack={() => setStep(s => Math.max(3, s - 1))}
          onSkip={() => setStep(7)}
          onNext={() => setStep(s => (s === 6 ? 7 : s + 1))}
        />
      )}
      {step === 7 && <SettingUpStep progress={progress} />}
      {step === 8 && <ReadyStep onDone={exit} />}
    </SafeAreaView>
  );
}

// ── Step 0: Intro ─────────────────────────────────────────────────────────────

function IntroStep({ onEnable, onClose }: { onEnable: () => void; onClose: () => void }) {
  const features = [
    { icon: 'wifi-outline' as const, label: 'No reader needed' },
    { icon: 'card-outline' as const, label: 'Debit & credit' },
    { icon: 'logo-apple' as const, label: 'Apple Pay' },
  ];
  return (
    <View style={styles.introContainer}>
      <TouchableOpacity onPress={onClose} style={styles.introClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.introIconCircle}>
        <MaterialCommunityIcons name="contactless-payment" size={28} color={ORANGE} />
      </View>
      <Text style={styles.introTitle}>Tap to Pay on iPhone.{'\n'}Now available.</Text>
      <Text style={styles.introBody}>
        With Tap to Pay on iPhone, you can accept in-person contactless payments right on your
        iPhone — from physical debit and credit cards to Apple Pay — no extra hardware needed.
      </Text>

      <View style={styles.introFeatureRow}>
        {features.map(f => (
          <View key={f.label} style={styles.introFeature}>
            <Ionicons name={f.icon} size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.introFeatureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.introCta} onPress={onEnable} activeOpacity={0.85}>
        <Text style={styles.introCtaText}>Enable Now</Text>
      </TouchableOpacity>
      <Text style={styles.introFootnote}>Little Hotelier Payments is now active</Text>
    </View>
  );
}

// ── Step 1: Terms & Conditions ───────────────────────────────────────────────

function TermsStep({
  agreed,
  onToggleAgree,
  onClose,
  onContinue,
}: {
  agreed: boolean;
  onToggleAgree: () => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Terms & Conditions</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.termsTitle}>Accept Apple's Tap to Pay on iPhone terms</Text>
        <View style={styles.termsBox}>
          <Text style={styles.termsBoxText}>
            By enabling Tap to Pay on iPhone, you agree to Apple's Tap to Pay on iPhone Terms and
            Conditions and authorize Little Hotelier and Stripe to process contactless card
            transactions using this iPhone's NFC reader. Card data is handled by Apple and Stripe
            and is never stored on this device.
          </Text>
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={onToggleAgree} activeOpacity={0.7}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to Apple's Tap to Pay on iPhone Terms and Conditions.
          </Text>
        </TouchableOpacity>

        <View style={styles.adminNoteRow}>
          <Ionicons name="information-circle-outline" size={16} color="#6d7272" style={{ marginRight: 6 }} />
          <Text style={styles.adminNoteText}>
            You're signed in as an admin, so you're authorised to accept these terms on behalf of
            Sunset Bay B&B.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.stepFooter}>
        <TouchableOpacity
          style={[styles.primaryBtn, !agreed && styles.primaryBtnDisabled]}
          disabled={!agreed}
          onPress={onContinue}
        >
          <Text style={styles.primaryBtnText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Step 2: Face ID (Apple system step, mocked) ──────────────────────────────

function FaceIdStep() {
  return (
    <View style={styles.faceIdContainer}>
      <View style={styles.faceIdIconWrap}>
        <Ionicons name="scan-outline" size={40} color="#333" />
      </View>
      <Text style={styles.faceIdText}>Confirming with Face ID...</Text>
    </View>
  );
}

// ── Steps 3–6: Education carousel ────────────────────────────────────────────

function EducationStep({
  index,
  onClose,
  onBack,
  onSkip,
  onNext,
}: {
  index: number;
  onClose: () => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const data = EDU_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TOTAL_EDU_STEPS - 1;

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>How Tap to Pay works</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.eduBody}>
        <View style={styles.eduIconCircle}>
          <Ionicons name={data.icon} size={28} color={ORANGE} />
        </View>
        <Text style={styles.eduTitle}>{data.title}</Text>
        <Text style={styles.eduText}>{data.body}</Text>
        {data.note && (
          <View style={styles.eduNoteRow}>
            <Ionicons name="volume-medium-outline" size={14} color="#6d7272" style={{ marginRight: 6 }} />
            <Text style={styles.eduNoteText}>{data.note}</Text>
          </View>
        )}
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_EDU_STEPS }).map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.eduFooter}>
        {!isFirst ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.eduFooterLink}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          {!isLast && (
            <TouchableOpacity onPress={onSkip}>
              <Text style={styles.eduFooterLink}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.eduNextBtn} onPress={onNext}>
            <Text style={styles.eduNextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Step 7: Setting up ───────────────────────────────────────────────────────

function SettingUpStep({ progress }: { progress: number }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeaderTitle}>Setting up</Text>
      </View>
      <View style={styles.settingUpBody}>
        <View style={styles.progressRing}>
          <Text style={styles.progressRingText}>{progress}%</Text>
        </View>
        <Text style={styles.eduTitle}>Preparing your iPhone...</Text>
        <Text style={styles.eduText}>Configuring Tap to Pay on iPhone for this device.</Text>
      </View>
    </View>
  );
}

// ── Step 8: Ready ─────────────────────────────────────────────────────────────

function ReadyStep({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.readyBody}>
        <View style={styles.readyIconCircle}>
          <Ionicons name="checkmark" size={28} color={GREEN} />
        </View>
        <Text style={styles.eduTitle}>Tap to Pay on iPhone is ready</Text>
        <Text style={styles.eduText}>
          Your iPhone can now accept contactless cards and Apple Pay. Give it a try or head
          straight to checkout.
        </Text>
      </View>
      <View style={styles.stepFooter}>
        <TouchableOpacity style={[styles.primaryBtn, styles.outlinedBtn]} activeOpacity={0.7}>
          <Text style={styles.outlinedBtnText}>Try a test tap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={onDone}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  safeAreaDark: { backgroundColor: DARK },

  // Shared step shell
  stepContainer: { flex: 1, backgroundColor: '#fff' },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  stepFooter: { paddingHorizontal: 20, paddingBottom: 20 },

  // Intro
  introContainer: { flex: 1, backgroundColor: DARK, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  introClose: { alignSelf: 'flex-end', marginBottom: 24 },
  introIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  introTitle: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34, marginBottom: 16 },
  introBody: { fontSize: 15, color: '#c7c9cc', lineHeight: 22, marginBottom: 24 },
  introFeatureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  introFeature: { flexDirection: 'row', alignItems: 'center' },
  introFeatureText: { color: '#fff', fontSize: 13 },
  introCta: {
    backgroundColor: ORANGE, borderRadius: 24, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  introCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  introFootnote: { color: '#8b8d90', fontSize: 12, textAlign: 'center' },

  // Terms
  termsTitle: { fontSize: 20, fontWeight: '700', color: '#212323', marginBottom: 16, lineHeight: 26 },
  termsBox: {
    backgroundColor: '#f2f3f3', borderRadius: 8, padding: 14, maxHeight: 160, marginBottom: 20,
  },
  termsBoxText: { fontSize: 13, color: '#484b4b', lineHeight: 19 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#ccd1d1',
    alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#333', lineHeight: 20 },
  adminNoteRow: { flexDirection: 'row', alignItems: 'flex-start' },
  adminNoteText: { flex: 1, fontSize: 12, color: '#6d7272', lineHeight: 17 },

  // Face ID
  faceIdContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  faceIdIconWrap: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#e5e8e8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  faceIdText: { fontSize: 14, color: '#6d7272' },

  // Education
  eduBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  eduIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff5ee',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  eduTitle: { fontSize: 20, fontWeight: '700', color: '#212323', textAlign: 'center', marginBottom: 10 },
  eduText: { fontSize: 14, color: '#6d7272', textAlign: 'center', lineHeight: 20 },
  eduNoteRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16, paddingHorizontal: 12 },
  eduNoteText: { flex: 1, fontSize: 12, color: '#6d7272', lineHeight: 17, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e5e8e8' },
  dotActive: { backgroundColor: ORANGE, width: 16 },
  eduFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 24,
  },
  eduFooterLink: { fontSize: 14, color: '#6d7272', fontWeight: '600' },
  eduNextBtn: { backgroundColor: '#212323', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20 },
  eduNextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Setting up
  settingUpBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  progressRing: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 6, borderColor: ORANGE,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  progressRingText: { fontSize: 18, fontWeight: '700', color: '#212323' },

  // Ready
  readyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  readyIconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#e7f5ea',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },

  // Buttons (shared)
  primaryBtn: {
    backgroundColor: '#212323', borderRadius: 24, paddingVertical: 15, alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#ccd1d1' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlinedBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#333' },
  outlinedBtnText: { color: '#333', fontSize: 15, fontWeight: '700' },
});
