import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from './navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootParamList>;

const designers: {
  name: string;
  initials: string;
  prototypes: { screenName: keyof RootParamList; label: string }[];
}[] = [
  {
    name: 'Radha Ranaware',
    initials: 'RR',
    prototypes: [{ screenName: 'RadhaSmMobile', label: 'SM Mobile' }],
  },
  // Add new designers here — maintain alphabetical order by first name
];

export default function PlaygroundHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Native Prototyping{'\n'}Environment</Text>
          <Text style={styles.subtitle}>Select a prototype to view</Text>
        </View>

        {designers.map((designer) => (
          <View key={designer.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{designer.initials}</Text>
              </View>
              <Text style={styles.designerName}>{designer.name}</Text>
            </View>

            {designer.prototypes.map((proto) => (
              <TouchableOpacity
                key={proto.screenName}
                style={styles.protoRow}
                onPress={() => navigation.navigate(proto.screenName)}
                activeOpacity={0.7}
              >
                <Text style={styles.protoLabel}>{proto.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#717171" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9ff',
  },
  scroll: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#717171',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dde3ee',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dde3ee',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#006add',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  designerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  protoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dde3ee',
  },
  protoLabel: {
    fontSize: 14,
    color: '#1a1a2e',
  },
});
