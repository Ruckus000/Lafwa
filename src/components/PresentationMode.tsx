/**
 * PresentationMode Component
 * Full-screen hymn display for church presentations
 * Based on UX/UI Spec v1
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableWithoutFeedback,
  PanResponder,
  StatusBar,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
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

  // Get section text based on language
  const getSectionText = (section: HymnSection): string => {
    if (language === 'ht' && section.text_ht) return section.text_ht;
    if (language === 'fr' && section.text_fr) return section.text_fr;
    return section.text_ht || section.text_fr || '';
  };

  // Get section label
  const getSectionLabel = (section: HymnSection): string => {
    if (section.section_type === 'refrain') {
      return { ht: 'Refren', fr: 'Refrain', en: 'Refrain' }[language];
    }
    const verseWord = { ht: 'Vèsè', fr: 'Couplet', en: 'Verse' }[language];
    return section.section_number ? `${verseWord} ${section.section_number}` : verseWord;
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onExit();
          return;
        }

        // Swipe left (next)
        if (dx < -SWIPE_THRESHOLD && currentIndex < sections.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCurrentIndex((prev) => prev + 1);
          return;
        }

        // Swipe right (previous)
        if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setCurrentIndex((prev) => prev - 1);
        }
      },
    })
  ).current;

  // Handle tap navigation
  const handleTap = (event: any) => {
    const tapX = event.nativeEvent.locationX;

    // Tap on right side = next
    if (tapX > SCREEN_WIDTH * 0.6 && currentIndex < sections.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev + 1);
    }
    // Tap on left side = previous
    else if (tapX < SCREEN_WIDTH * 0.4 && currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const currentSection = sections[currentIndex];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar hidden />

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
            {sections.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Navigation Hint */}
          <Text style={styles.hint}>
            {{ ht: 'Glise anba pou sòti', fr: 'Glissez vers le bas pour quitter', en: 'Swipe down to exit' }[language]}
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
});
