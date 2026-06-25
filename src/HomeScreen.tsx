import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from './navigation/AppNavigator';
import { designers } from './prototypes';
import pkg from '../package.json';

type Nav = NativeStackNavigationProp<RootParamList>;

// App switcher — opens the other deployed playgrounds. `currentApp` marks this
// one as active (rendered non-pressable).
const currentApp = 'native';
const apps = [
  { key: 'vue', label: 'Vue', url: 'https://sm-vue-c9f4e18919d2.herokuapp.com/' },
  { key: 'react', label: 'React', url: 'https://sm-react-0f29bcd17aa4.herokuapp.com/' },
  { key: 'native', label: 'Native', url: 'https://sm-native-5c5b643660da.herokuapp.com/' },
];

export default function PlaygroundHomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.switcher}>
          {apps.map((app) =>
            app.key === currentApp ? (
              <View
                key={app.key}
                style={[styles.switcherBtn, styles.switcherBtnActive]}
              >
                <Text style={[styles.switcherText, styles.switcherTextActive]}>
                  {app.label}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                key={app.key}
                style={styles.switcherBtn}
                onPress={() => Linking.openURL(app.url)}
                activeOpacity={0.7}
              >
                <Text style={styles.switcherText}>{app.label}</Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Native Prototyping{'\n'}Environment{' '}
            <Text style={styles.titleVersion}>v{pkg.version}</Text>
          </Text>
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
                key={proto.route}
                style={styles.protoRow}
                onPress={() => navigation.navigate(proto.route)}
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
  switcher: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#eef2f9',
    borderWidth: 1,
    borderColor: '#dde3ee',
    borderRadius: 999,
    padding: 3,
    gap: 2,
    marginBottom: 24,
  },
  switcherBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  switcherBtnActive: {
    backgroundColor: '#006add',
  },
  switcherText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a6472',
  },
  switcherTextActive: {
    color: '#ffffff',
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
  titleVersion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#aaa',
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
