/**
 * NoteEditor Component
 * Modal for writing/editing personal notes on verses
 * Uses language-agnostic storage (book/chapter/verse)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { getNoteForVerse, saveNote } from '../db/queries';

interface VerseLocation {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface NoteEditorProps {
  visible: boolean;
  verse: VerseLocation | null;
  onClose: () => void;
  onSave: () => void;
}

export default function NoteEditor({
  visible,
  verse,
  onClose,
  onSave,
}: NoteEditorProps) {
  const { colors } = useTheme();
  const language = useSettingsStore((state) => state.language);
  const inputRef = useRef<TextInput>(null);

  const [noteText, setNoteText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges = noteText !== originalText;

  // Load existing note when verse changes
  useEffect(() => {
    if (visible && verse) {
      loadNote();
    }
  }, [visible, verse?.book, verse?.chapter, verse?.verse]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setNoteText('');
      setOriginalText('');
    }
  }, [visible]);

  const loadNote = async () => {
    if (!verse) return;

    setLoading(true);
    try {
      const existingNote = await getNoteForVerse(verse.book, verse.chapter, verse.verse);
      const text = existingNote || '';
      setNoteText(text);
      setOriginalText(text);
    } catch (e) {
      console.error('Error loading note:', e);
      setNoteText('');
      setOriginalText('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!verse || saving) return;

    setSaving(true);
    try {
      await saveNote(verse.book, verse.chapter, verse.verse, noteText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
      onClose();
    } catch (e) {
      console.error('Error saving note:', e);
      
      const errorLabels = {
        title: { ht: 'Erè', fr: 'Erreur', en: 'Error' }[language],
        message: {
          ht: 'Pa kapab anrejistre nòt la. Tanpri eseye ankò.',
          fr: 'Impossible d\'enregistrer la note. Veuillez réessayer.',
          en: 'Unable to save note. Please try again.',
        }[language],
        ok: { ht: 'OK', fr: 'OK', en: 'OK' }[language],
      };

      Alert.alert(errorLabels.title, errorLabels.message, [{ text: errorLabels.ok }]);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();

    if (hasChanges) {
      const discardLabels = {
        title: { ht: 'Jete chanjman yo?', fr: 'Abandonner les modifications?', en: 'Discard changes?' }[language],
        message: {
          ht: 'Ou gen chanjman ki poko anrejistre. Ou vle jete yo?',
          fr: 'Vous avez des modifications non enregistrées. Voulez-vous les abandonner?',
          en: 'You have unsaved changes. Do you want to discard them?',
        }[language],
        discard: { ht: 'Jete', fr: 'Abandonner', en: 'Discard' }[language],
        cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
      };

      Alert.alert(discardLabels.title, discardLabels.message, [
        { text: discardLabels.cancel, style: 'cancel' },
        { text: discardLabels.discard, style: 'destructive', onPress: onClose },
      ]);
      return;
    }

    onClose();
  };

  const handleTextChange = (text: string) => {
    setNoteText(text);
  };

  const labels = {
    title: { ht: 'Nòt', fr: 'Note', en: 'Note' }[language],
    placeholder: {
      ht: 'Ekri nòt ou sou vèsè sa a...',
      fr: 'Écrivez votre note sur ce verset...',
      en: 'Write your note about this verse...',
    }[language],
    save: { ht: 'Anrejistre', fr: 'Enregistrer', en: 'Save' }[language],
    saving: { ht: 'Anrejistre...', fr: 'Enregistrement...', en: 'Saving...' }[language],
  };

  if (!verse) return null;

  const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
  const canSave = hasChanges || (noteText.trim() !== '' && originalText === '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeButton}
              accessibilityLabel={{ ht: 'Fèmen', fr: 'Fermer', en: 'Close' }[language]}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={[styles.title, { color: colors.text }]}>
                {labels.title}
              </Text>
              <Text style={[styles.reference, { color: colors.textTertiary }]}>
                {reference}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton, 
                { backgroundColor: canSave ? colors.primary : colors.border }
              ]}
              disabled={!canSave || saving}
              accessibilityLabel={saving ? labels.saving : labels.save}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSave || saving }}
            >
              <Text style={[styles.saveButtonText, { opacity: canSave ? 1 : 0.5 }]}>
                {saving ? labels.saving : labels.save}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verse Preview */}
          <View style={[styles.versePreview, { backgroundColor: colors.surfaceHover }]}>
            <Text
              style={[styles.verseText, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              "{verse.text}"
            </Text>
          </View>

          {/* Note Input */}
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={noteText}
            onChangeText={handleTextChange}
            placeholder={labels.placeholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            autoFocus
            editable={!loading && !saving}
            accessibilityLabel={labels.placeholder}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  reference: {
    fontSize: 13,
    marginTop: 2,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 90,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  versePreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  verseText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  input: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
