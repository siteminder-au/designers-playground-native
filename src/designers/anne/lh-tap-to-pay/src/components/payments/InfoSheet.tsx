import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../config/colors';

export function InfoSheet({
  visible,
  title,
  icon,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{children}</Text>
          <TouchableOpacity style={styles.dismiss} onPress={onClose}>
            <Text style={styles.dismissText}>Got it</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  icon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    marginBottom: 12,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Primary[600],
  },
  title: {
    marginBottom: 8,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.Black[100],
    textAlign: 'center',
  },
  body: {
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.Black[300],
    textAlign: 'center',
  },
  dismiss: {
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: COLORS.Primary[100],
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
