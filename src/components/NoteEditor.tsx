/**
 * NoteEditor Component
 * Modal for writing/editing personal notes on verses
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { getNoteForVerse, saveNote } from '../db/queries';

interface NoteEditorProps {
  visible: boolean;
  verse: {
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
  } | null;
  onClose: () => void;
  onSave: () => void;
}

export default function NoteEditor({
  visible,
  verse,
  onClose,
  onSave,
}: NoteEditorProps) {
  const { colors, shadows } = useTheme();
  const language = useSettingsStore((state) => state.language);
  const inputRef = useRef<TextInput>(null);

  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing note when verse changes
  useEffect(() => {
    if (visible && verse) {
      loadNote();
    }
  }, [visible, verse?.id]);

  const loadNote = async () => {
    if (!verse) return;

    setLoading(true);
    try {
      const existingNote = await getNoteForVerse(verse.id);
      setNoteText(existingNote || '');
      setHasChanges(false);
    } catch (e) {
      console.error('Error loading note:', e);
      setNoteText('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!verse) return;

    try {
      await saveNote(verse.id, noteText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSave();
      onClose();
    } catch (e) {
      console.error('Error saving note:', e);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    if (hasChanges) {
      // Could add confirmation dialog here
    }
    onClose();
  };

  const handleTextChange = (text: string) => {
    setNoteText(text);
    setHasChanges(true);
  };

  const labels = {
    title: { ht: 'Nòt', fr: 'Note', en: 'Note' }[language],
    placeholder: {
      ht: 'Ekri nòt ou sou vèsè sa a...',
      fr: 'Écrivez votre note sur ce verset...',
      en: 'Write your note about this verse...',
    }[language],
    save: { ht: 'Anrejistre', fr: 'Enregistrer', en: 'Save' }[language],
    cancel: { ht: 'Anile', fr: 'Annuler', en: 'Cancel' }[language],
  };

  if (!verse) return null;

  const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;

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
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
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
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              disabled={!hasChanges && noteText.trim() === ''}
            >
              <Text style={styles.saveButtonText}>{labels.save}</Text>
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
