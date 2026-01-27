/**
 * PresentationMode Component
 * Full-screen hymn display for church presentations
 * Based on UX/UI Spec v1
 */

import React, { useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity,
  PanResponder,
  StatusBar,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { HymnSection } from '../db/queries';
import { useSettingsStore } from '../stores/settingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

interface PresentationModeProps {
  hymnNumber: number;
  title: string;
  sections: HymnSection[];
  onExit: () => void;
}

export default function PresentationMode({
  hymnNumber,
  title,
  sections,
  onExit,
}: PresentationModeProps) {
  useKeepAwake();

  const language = useSettingsStore((state) => state.language);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Validate sections array - must have at least one valid section
  // This prevents crashes when sections is empty, undefined, or contains malformed data
  const validSections = useMemo(() => {
    if (!Array.isArray(sections) || sections.length === 0) {
      return [];
    }
    // Filter out any undefined or malformed sections
    return sections.filter(
      (s): s is HymnSection => 
        s !== null && 
        s !== undefined && 
        typeof s.section_type === 'string'
    );
  }, [sections]);

  // Calculate max valid index to prevent out-of-bounds access
  const maxIndex = Math.max(0, validSections.length - 1);

  // Get section text based on language - with null safety
  const getSectionText = (section: HymnSection | undefined): string => {
    if (!section) return '';
    if (language === 'ht' && section.text_ht) return section.text_ht;
    if (language === 'fr' && section.text_fr) return section.text_fr;
    return section.text_ht || section.text_fr || '';
  };

  // Get section label - with null safety
  const getSectionLabel = (section: HymnSection | undefined): string => {
    if (!section) return '';
    if (section.section_type === 'refrain') {
      return { ht: 'Refren', fr: 'Refrain', en: 'Refrain' }[language] ?? 'Refrain';
    }
    const verseWord = { ht: 'Vèsè', fr: 'Couplet', en: 'Verse' }[language] ?? 'Verse';
    return section.section_number ? `${verseWord} ${section.section_number}` : verseWord;
  };

  // Handle exit with haptic feedback
  const handleExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExit();
  };

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const { dx, dy } = gestureState;

        // Swipe down to exit
        if (dy > SWIPE_THRESHOLD && Math.abs(dx) < SWIPE_THRESHOLD) {
          handleExit();
          return;
        }

        // Swipe left (next) - use functional update with bounds check
        if (dx < -SWIPE_THRESHOLD) {
          setCurrentIndex((prev) => {
            const next = prev + 1;
            if (next <= maxIndex) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return next;
            }
            return prev;
          });
          return;
        }

        // Swipe right (previous)
        if (dx > SWIPE_THRESHOLD) {
          setCurrentIndex((prev) => {
            if (prev > 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              return prev - 1;
            }
            return prev;
          });
        }
      },
    })
  ).current;

  // Handle tap navigation with bounds checking
  const handleTap = (event: any) => {
    const tapX = event.nativeEvent.locationX;

    // Tap on right side = next
    if (tapX > SCREEN_WIDTH * 0.6) {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next <= maxIndex) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return next;
        }
        return prev;
      });
    }
    // Tap on left side = previous
    else if (tapX < SCREEN_WIDTH * 0.4) {
      setCurrentIndex((prev) => {
        if (prev > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev - 1;
        }
        return prev;
      });
    }
  };

  // Safely get current section with bounds check
  const safeIndex = Math.min(currentIndex, maxIndex);
  const currentSection = validSections[safeIndex];

  // Handle empty sections - show error state instead of crashing
  if (validSections.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        
        {/* Close button - always visible */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleExit}
          accessibilityRole="button"
          accessibilityLabel={{ ht: 'Fèmen', fr: 'Fermer', en: 'Close' }[language]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="rgba(255, 255, 255, 0.7)" />
        </TouchableOpacity>

        <View style={styles.errorContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color="rgba(255, 255, 255, 0.5)" 
            accessibilityLabel="Alert icon"
          />
          <Text style={styles.errorText}>
            {{ 
              ht: 'Pa gen pawòl pou kantik sa a',
              fr: 'Aucun texte disponible pour ce cantique',
              en: 'No lyrics available for this hymn'
            }[language]}
          </Text>
          <TouchableOpacity 
            onPress={handleExit}
            style={styles.exitButton}
            accessibilityRole="button"
            accessibilityLabel={{ ht: 'Retounen', fr: 'Retour', en: 'Go Back' }[language]}
          >
            <Text style={styles.exitButtonText}>
              {{ ht: 'Retounen', fr: 'Retour', en: 'Go Back' }[language]}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />

      {/* Close button - always visible in top-right corner */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleExit}
        accessibilityRole="button"
        accessibilityLabel={{ ht: 'Fèmen', fr: 'Fermer', en: 'Close' }[language]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={28} color="rgba(255, 255, 255, 0.7)" />
      </TouchableOpacity>

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.hymnNumber}>#{hymnNumber}</Text>
            <Text style={styles.sectionLabel}>
              {getSectionLabel(currentSection)}
            </Text>
          </View>

          {/* Section Text */}
          <View style={styles.textContainer}>
            <Text style={styles.sectionText}>
              {getSectionText(currentSection)}
            </Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            {validSections.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === safeIndex && styles.progressDotActive,
                ]}
                accessibilityLabel={`Section ${index + 1} of ${validSections.length}${index === safeIndex ? ', current' : ''}`}
              />
            ))}
          </View>

          {/* Navigation Hint - updated to mention X button */}
          <Text style={styles.hint}>
            {{ 
              ht: 'Tape X oswa glise anba pou sòti', 
              fr: 'Appuyez sur X ou glissez vers le bas pour quitter', 
              en: 'Tap X or swipe down to exit' 
            }[language]}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  hymnNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.5,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 48,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    textAlign: 'center',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  exitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  exitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
