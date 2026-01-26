import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const content = {
    tagline: { ht: 'Lafwa soti nan tande', fr: "La foi vient de ce qu'on entend", en: 'Faith comes from hearing' }[language],
    mission: { ht: "Lafwa se yon aplikasyon gratis ki pèmèt Ayisyen yo gen aksè a Bib la ak Chant d'Espérance san entènèt.", fr: "Lafwa est une application gratuite permettant aux Haïtiens d'accéder à la Bible et aux Chants d'Espérance hors ligne.", en: "Lafwa is a free app enabling Haitians to access the Bible and Chants d'Espérance offline." }[language],
    version: 'Version 1.0.0',
    credits: { ht: 'Rekonesans', fr: 'Remerciements', en: 'Acknowledgments' }[language],
    bibleCredit: { ht: 'Tèks Bib la disponib grasa jenerozite tradiktè yo.', fr: 'Le texte biblique est disponible grâce à la générosité des traducteurs.', en: 'Bible text available thanks to the generosity of translators.' }[language],
    hymnCredit: { ht: "Chant d'Espérance disponib avèk pèmisyon.", fr: "Chants d'Espérance disponibles avec permission.", en: "Chants d'Espérance available with permission." }[language],
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo placeholder */}
        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.logoText, { color: colors.primary }]}>Lafwa</Text>
        </View>

        <Text style={[styles.tagline, { color: colors.textTertiary }]}>
          "{content.tagline}"
        </Text>

        <Text style={[styles.version, { color: colors.textTertiary }]}>{content.version}</Text>

        <View style={styles.section}>
          <Text style={[styles.body, { color: colors.text }]}>{content.mission}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{content.credits}</Text>
          <Text style={[styles.body, { color: colors.textTertiary }]}>{content.bibleCredit}</Text>
          <Text style={[styles.body, { color: colors.textTertiary }]}>{content.hymnCredit}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    marginBottom: 32,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
