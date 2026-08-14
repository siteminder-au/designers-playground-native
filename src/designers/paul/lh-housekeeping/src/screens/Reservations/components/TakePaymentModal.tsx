import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ORANGE = '#ff6842';

type Tab = 'process' | 'record' | 'request';

export interface TakePaymentReservation {
  id: string;
  guestName: string;
  outstandingBalance?: number | null;
}

export function TakePaymentModal({
  visible,
  res,
  onClose,
  onSetUpTapToPay,
}: {
  visible: boolean;
  res: TakePaymentReservation | null;
  onClose: () => void;
  onSetUpTapToPay: () => void;
}) {
  const [tab, setTab] = useState<Tab>('process');
  const [amount, setAmount] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [markAsDeposit, setMarkAsDeposit] = useState(false);
  const [applySurcharge, setApplySurcharge] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState(false);

  // Reset transient per-payment state whenever a new reservation opens —
  // amount defaults to the outstanding balance each time.
  React.useEffect(() => {
    if (!res) return;
    setTab('process');
    setAmount(res.outstandingBalance != null ? String(res.outstandingBalance) : '');
    setNoteOpen(false);
    setNote('');
    setMarkAsDeposit(false);
    setApplySurcharge(false);
    setEmailInvoice(false);
  }, [res?.id]);

  if (!res) return null;

  const outstanding = res.outstandingBalance ?? 0;
  const amountNum = parseFloat(amount) || 0;
  const surchargeAmount = applySurcharge ? Math.round(amountNum * 0.015 * 100) / 100 : 0;
  const total = amountNum + surchargeAmount;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Take payment</Text>
            <View style={styles.headerSide} />
          </View>

          {/* Process / Record / Request */}
          <View style={styles.tabsWrapper}>
            <View style={styles.tabs}>
              {([
                { key: 'process', label: 'Process' },
                { key: 'record', label: 'Record' },
                { key: 'request', label: 'Request' },
              ] as { key: Tab; label: string }[]).map(t => {
                const isActive = tab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                    onPress={() => setTab(t.key)}
                  >
                    <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {tab !== 'process' ? (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>
                {tab === 'record' ? 'Recording a payment taken elsewhere' : 'Requesting payment from the guest'} isn't part of this exploration yet.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Payment details */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment details</Text>
                  <View style={styles.cardRow}>
                    <View style={styles.cardBrandIcon}>
                      <MaterialCommunityIcons name="credit-card-outline" size={18} color="#333" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{res.guestName}</Text>
                      <Text style={styles.cardNumber}>•••• 4242</Text>
                    </View>
                    <Ionicons name="chevron-expand-outline" size={18} color="#9ca3af" />
                  </View>

                  <TouchableOpacity style={styles.ttpRow} activeOpacity={0.7} onPress={onSetUpTapToPay}>
                    <MaterialCommunityIcons name="contactless-payment-circle-outline" size={18} color={ORANGE} style={{ marginRight: 6 }} />
                    <Text style={styles.ttpText}>Set up Tap to Pay</Text>
                    <Ionicons name="arrow-forward" size={14} color={ORANGE} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* Amount */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Amount to be charged</Text>
                  <View style={styles.amountField}>
                    <Text style={styles.amountPrefix}>AUD</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.helperText}>
                    The amount outstanding is AUD {outstanding.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* Notes */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  {noteOpen ? (
                    <TextInput
                      style={styles.noteInput}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Add a note about this payment"
                      multiline
                      autoFocus
                    />
                  ) : (
                    <TouchableOpacity style={styles.addNoteBtn} onPress={() => setNoteOpen(true)}>
                      <Text style={styles.addNoteText}>Add note</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Payment summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment summary</Text>

                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Mark payment as deposit</Text>
                    <Switch value={markAsDeposit} onValueChange={setMarkAsDeposit} trackColor={{ false: '#e5e7eb', true: ORANGE }} thumbColor="#fff" />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Apply surcharge</Text>
                    <Switch value={applySurcharge} onValueChange={setApplySurcharge} trackColor={{ false: '#e5e7eb', true: ORANGE }} thumbColor="#fff" />
                  </View>
                  <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>E-mail copy of invoice</Text>
                    <Switch value={emailInvoice} onValueChange={setEmailInvoice} trackColor={{ false: '#e5e7eb', true: ORANGE }} thumbColor="#fff" />
                  </View>

                  <View style={styles.summaryBox}>
                    {applySurcharge && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>AUD {amountNum.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</Text>
                      </View>
                    )}
                    {applySurcharge && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Surcharge</Text>
                        <Text style={styles.summaryValue}>AUD {surchargeAmount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</Text>
                      </View>
                    )}
                    <View style={[styles.summaryRow, { marginTop: applySurcharge ? 8 : 0 }]}>
                      <Text style={styles.summaryTotalLabel}>Total</Text>
                      <Text style={styles.summaryTotalValue}>AUD {total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Footer CTA */}
              <View style={styles.footer}>
                <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85} onPress={onClose}>
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '92%',
    minHeight: '75%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSide: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111' },

  tabsWrapper: { paddingHorizontal: 16, paddingBottom: 12 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f2f3f3',
    borderRadius: 9,
    padding: 2,
  },
  tabBtn: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 7 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  tabBtnTextActive: { fontWeight: '700' },

  comingSoon: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  comingSoonText: { fontSize: 14, color: '#6d7272', textAlign: 'center', lineHeight: 20 },

  section: { paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  divider: { height: 1, backgroundColor: '#e5e8e8' },

  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e8e8',
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  cardBrandIcon: {
    width: 24, height: 24, borderRadius: 4, backgroundColor: '#f2f3f3',
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '700', color: '#333' },
  cardNumber: { fontSize: 12, color: '#333', marginTop: 2 },

  ttpRow: { flexDirection: 'row', alignItems: 'center' },
  ttpText: { fontSize: 12, fontWeight: '700', color: ORANGE },

  amountField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e8e8',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  amountPrefix: { fontSize: 22, color: '#484b4b' },
  amountInput: { flex: 1, fontSize: 22, color: '#212323', padding: 0 },
  helperText: { fontSize: 12, color: '#484b4b' },

  addNoteBtn: {
    borderWidth: 1,
    borderColor: '#e5e8e8',
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
  },
  addNoteText: { fontSize: 14, fontWeight: '700', color: ORANGE },
  noteInput: {
    borderWidth: 1,
    borderColor: '#e5e8e8',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 34,
  },
  toggleLabel: { fontSize: 14, color: '#484b4b' },

  summaryBox: {
    borderWidth: 1,
    borderColor: '#e5e8e8',
    borderRadius: 6,
    padding: 16,
    marginTop: 4,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#484b4b' },
  summaryValue: { fontSize: 13, color: '#484b4b' },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700', color: '#212323' },
  summaryTotalValue: { fontSize: 14, fontWeight: '700', color: '#212323' },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e8e8',
  },
  reviewBtn: {
    backgroundColor: '#212323',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
