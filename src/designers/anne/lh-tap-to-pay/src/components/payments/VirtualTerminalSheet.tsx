import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../config/colors';
import { TextField } from './TextField';
import { PickerField } from './PickerField';
import { ToggleSwitch } from './ToggleSwitch';
import { ActionSheet, type ActionSheetOption } from './ActionSheet';
import { InfoSheet } from './InfoSheet';
import { TapToPayFlow } from './TapToPayFlow';
import ContactlessWave from '../../../assets/ContactlessWave.svg';

const CHARGE_TYPE_OPTIONS: ActionSheetOption[] = [
  { key: 'conferenceRoom', label: 'Conference room' },
  { key: 'foodAndBeverage', label: 'Food and beverage' },
  { key: 'parking', label: 'Parking' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'other', label: 'Other' },
];

// Labels follow Apple's Tap to Pay on iPhone HIG page verbatim: always
// "Tap to Pay on iPhone" for a payment action, never shortened or paired
// with an icon/illustration of an iPhone (that's reserved for Apple's own
// marketing assets).
const PROCESS_VIA_OPTIONS: ActionSheetOption[] = [
  { key: 'creditCardOnline', label: 'Credit card (Online)' },
  { key: 'paymentTerminal', label: 'Payment terminal' },
  { key: 'tapToPay', label: 'Tap to Pay on iPhone' },
];

const PROCESS_VIA_HELPER_TEXT: Record<string, string> = {
  paymentTerminal: 'Present the terminal to the customer to complete payment.',
  tapToPay: 'Ask the customer to tap their card or device on the back of your iPhone.',
};

const SURCHARGE_RATE = 0.015;

type ActiveSheet = 'chargeType' | 'processVia' | null;

export function VirtualTerminalSheet({
  visible,
  termsAccepted,
  onClose,
  onAcceptTapToPayTerms,
  onPaymentComplete,
}: {
  visible: boolean;
  termsAccepted: boolean;
  onClose: () => void;
  onAcceptTapToPayTerms: () => void;
  onPaymentComplete: () => void;
}) {
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [showTapToPayInfo, setShowTapToPayInfo] = useState(false);
  const [showTapToPayFlow, setShowTapToPayFlow] = useState(false);

  const [chargeType, setChargeType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [applySurcharge, setApplySurcharge] = useState(false);

  const [processVia, setProcessVia] = useState('creditCardOnline');
  const [cardNumber, setCardNumber] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvc, setCvc] = useState('');

  const [emailInvoice, setEmailInvoice] = useState(false);
  const [emailReceipt, setEmailReceipt] = useState(false);

  const chargeTypeLabel = CHARGE_TYPE_OPTIONS.find(o => o.key === chargeType)?.label ?? '';
  const processViaLabel = PROCESS_VIA_OPTIONS.find(o => o.key === processVia)?.label ?? '';
  const processViaHelperText = PROCESS_VIA_HELPER_TEXT[processVia] ?? '';

  const baseAmount = Number.isFinite(parseFloat(amount)) ? parseFloat(amount) : 0;
  const surchargeAmount = applySurcharge ? baseAmount * SURCHARGE_RATE : 0;
  const totalAmount = baseAmount + surchargeAmount;
  const surchargeLabel = `AUD ${surchargeAmount.toFixed(2)}`;
  const totalLabel = `AUD ${totalAmount.toFixed(2)}`;

  // Apple's Tap to Pay on iPhone HIG page requires the button that activates the
  // feature to be labeled "Tap to Pay on iPhone" (or "Tap to Pay" if space is
  // constrained) rather than a generic checkout label — but only for this method.
  const submitLabel = processVia === 'tapToPay' ? 'Tap to Pay on iPhone' : 'Process payment';

  const hasBaseFields = Boolean(chargeType) && parseFloat(amount) > 0;
  const canSubmit = hasBaseFields && (
    processVia !== 'creditCardOnline' ||
    Boolean(cardNumber && nameOnCard && expiryMonth && expiryYear && cvc)
  );

  function handleSubmit() {
    if (processVia === 'tapToPay') {
      setShowTapToPayFlow(true);
    }
    // Credit card (Online) and Payment terminal don't have a built flow yet — the
    // button stays inert for those until those flows are built out.
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.vt} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Take payment</Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.section}>
            <Text style={styles.heading}>Charge details</Text>

            <PickerField
              placeholder="Charge type"
              valueLabel={chargeTypeLabel}
              onOpen={() => setActiveSheet('chargeType')}
            />

            <TextField value={description} onChangeText={setDescription} placeholder="Description" />

            <TextField
              value={amount}
              onChangeText={setAmount}
              placeholder="Amount"
              keyboardType="decimal-pad"
            />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Apply surcharge</Text>
              <ToggleSwitch value={applySurcharge} onValueChange={setApplySurcharge} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.heading}>Payment details</Text>

            <PickerField
              label="Process via"
              placeholder="Select a payment method"
              valueLabel={processViaLabel}
              onOpen={() => setActiveSheet('processVia')}
            />

            {processVia === 'creditCardOnline' ? (
              <>
                <TextField
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Card number"
                  keyboardType="number-pad"
                  prefix={<Ionicons name="card-outline" size={20} color={COLORS.Black[500]} />}
                />
                <TextField value={nameOnCard} onChangeText={setNameOnCard} placeholder="Name on card" />
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <TextField value={expiryMonth} onChangeText={setExpiryMonth} placeholder="MM" keyboardType="number-pad" maxLength={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField value={expiryYear} onChangeText={setExpiryYear} placeholder="YYYY" keyboardType="number-pad" maxLength={4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField value={cvc} onChangeText={setCvc} placeholder="CVC" keyboardType="number-pad" maxLength={4} />
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.helperText}>
                {processViaHelperText}
                {processVia === 'tapToPay' && (
                  <>
                    {' '}
                    <Text style={styles.learnMore} onPress={() => setShowTapToPayInfo(true)}>
                      Learn more
                    </Text>
                  </>
                )}
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.heading}>Additional options</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>E-mail copy of invoice</Text>
              <ToggleSwitch value={emailInvoice} onValueChange={setEmailInvoice} />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>E-mail receipt</Text>
              <ToggleSwitch value={emailReceipt} onValueChange={setEmailReceipt} />
            </View>

            <View style={styles.total}>
              {applySurcharge && (
                <View style={[styles.totalRow, styles.totalRowSurcharge]}>
                  <Text style={styles.totalRowLabelSurcharge}>Surcharge</Text>
                  <Text style={styles.totalRowValueSurcharge}>{surchargeLabel}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={styles.totalRowLabelGrand}>Total</Text>
                <Text style={styles.totalRowValueGrand}>{totalLabel}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            disabled={!canSubmit}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}>{submitLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ActionSheet
        visible={activeSheet === 'chargeType'}
        options={CHARGE_TYPE_OPTIONS}
        selected={chargeType}
        onSelect={key => { setChargeType(key); setActiveSheet(null); }}
        onClose={() => setActiveSheet(null)}
      />

      <ActionSheet
        visible={activeSheet === 'processVia'}
        options={PROCESS_VIA_OPTIONS}
        selected={processVia}
        onSelect={key => { setProcessVia(key); setActiveSheet(null); }}
        onClose={() => setActiveSheet(null)}
      />

      <InfoSheet
        visible={showTapToPayInfo}
        title="Tap to Pay on iPhone"
        icon={<ContactlessWave width={48} height={48} color={COLORS.Primary[100]} />}
        onClose={() => setShowTapToPayInfo(false)}
      >
        Ask the customer to hold their contactless card, Apple Pay, or Google Pay device near the top of
        your iPhone. They'll feel a vibration when the payment starts, and may be asked to enter their
        PIN. You'll see a checkmark once the payment is approved.
      </InfoSheet>

      <TapToPayFlow
        visible={showTapToPayFlow}
        amountLabel={totalLabel}
        termsAccepted={termsAccepted}
        emailReceiptRequested={emailReceipt}
        onAcceptTerms={onAcceptTapToPayTerms}
        onClose={() => setShowTapToPayFlow(false)}
        onDone={() => { setShowTapToPayFlow(false); onPaymentComplete(); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  vt: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginHorizontal: -16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: COLORS.Black[100],
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.Black[400],
  },
  learnMore: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.Primary[100],
    textDecorationLine: 'underline',
  },
  total: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalRowSurcharge: {
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  totalRowLabelSurcharge: {
    fontSize: 14,
    color: COLORS.Black[400],
  },
  totalRowValueSurcharge: {
    fontSize: 14,
    color: COLORS.Black[400],
  },
  totalRowLabelGrand: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
  totalRowValueGrand: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
  actions: {
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  submit: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.Primary[100],
    alignItems: 'center',
  },
  submitDisabled: {
    backgroundColor: '#d8d8d8',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  submitTextDisabled: {
    color: COLORS.Black[500],
  },
  cancel: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.Black[100],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.Black[100],
  },
});
