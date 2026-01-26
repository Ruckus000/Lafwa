import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useSettingsStore } from '../src/stores/settingsStore';

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const { language } = useSettingsStore();

  const labels = {
    description: { ht: 'Nou ta renmen tande ou! Pataje ide w oswa rapòte pwoblèm.', fr: 'Nous aimerions vous entendre! Partagez vos idées ou signalez des problèmes.', en: "We'd love to hear from you! Share ideas or report issues." }[language],
    emailButton: { ht: 'Voye Imèl', fr: 'Envoyer un email', en: 'Send Email' }[language],
    error: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
    errorMessage: { ht: 'Pa kapab ouvri aplikasyon imèl', fr: "Impossible d'ouvrir l'application email", en: 'Unable to open email app' }[language],
  };

  const sendEmail = async () => {
    const subject = encodeURIComponent('Lafwa Feedback');
    const url = `mailto:feedback@lafwa.app?subject=${subject}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(labels.error, labels.errorMessage);
      }
    } catch {
      Alert.alert(labels.error, labels.errorMessage);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="chatbubbles" size={48} color={colors.primary} />
        </View>

        <Text style={[styles.description, { color: colors.textTertiary }]}>
          {labels.description}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={sendEmail}
        >
          <Ionicons name="mail" size={20} color="#fff" />
          <Text style={styles.buttonText}>{labels.emailButton}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
