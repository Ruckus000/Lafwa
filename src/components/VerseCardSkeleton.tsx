/**
 * Verse Card Skeleton
 * Loading state placeholder for the daily verse card.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

export function VerseCardSkeleton() {
  const { colors, shadows, isDark } = useTheme();
  const { rs } = useResponsive();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const skeletonColor = isDark ? colors.surfaceHover : colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.surface : colors.primaryLight,
          borderColor: colors.border,
          borderRadius: rs(20),
          padding: rs(20),
          marginBottom: rs(24),
        },
        !isDark && shadows.card,
      ]}
    >
      {/* Label skeleton */}
      <Animated.View
        style={[
          styles.label,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />

      {/* Text line skeletons */}
      <Animated.View
        style={[
          styles.line,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.line,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />
      <Animated.View
        style={[
          styles.line,
          styles.lineShort,
          { backgroundColor: skeletonColor, opacity },
        ]}
      />

      {/* Footer skeleton */}
      <View style={styles.footer}>
        <Animated.View
          style={[
            styles.reference,
            { backgroundColor: skeletonColor, opacity },
          ]}
        />
        <View style={styles.actions}>
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.actionButton,
              { backgroundColor: skeletonColor, opacity },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  label: {
    width: 120,
    height: 14,
    borderRadius: 7,
    marginBottom: 16,
  },
  line: {
    width: '100%',
    height: 22,
    borderRadius: 4,
    marginBottom: 8,
  },
  lineShort: {
    width: '70%',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reference: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
