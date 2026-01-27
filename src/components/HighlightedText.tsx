/**
 * HighlightedText Component
 * Renders text with search term matches highlighted.
 * 
 * Uses case-insensitive, accent-insensitive matching for Kreyòl support.
 */

import React, { useMemo } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  style?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
}

function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function mapIndicesToOriginal(
  original: string,
  normalizedStart: number,
  normalizedEnd: number
): [number, number] {
  let normIndex = 0;
  const normToOrig: number[] = [];

  for (let i = 0; i < original.length; i++) {
    const char = original[i];
    const normChar = normalizeForSearch(char);
    for (let j = 0; j < normChar.length; j++) {
      normToOrig[normIndex + j] = i;
    }
    normIndex += normChar.length;
  }
  normToOrig[normIndex] = original.length;

  const origStart = normToOrig[normalizedStart] ?? 0;
  const origEnd = normToOrig[normalizedEnd] ?? original.length;

  return [origStart, origEnd];
}

export function HighlightedText({
  text,
  highlight,
  style,
  highlightStyle,
  numberOfLines,
  accessibilityLabel,
}: HighlightedTextProps) {
  const segments = useMemo(() => {
    if (!highlight || highlight.length < 2 || !text) {
      return [{ text, highlighted: false }];
    }

    const normalizedText = normalizeForSearch(text);
    const normalizedSearch = normalizeForSearch(highlight);
    const result: { text: string; highlighted: boolean }[] = [];

    let lastEnd = 0;
    let searchStart = 0;

    while (searchStart < normalizedText.length) {
      const foundIndex = normalizedText.indexOf(normalizedSearch, searchStart);
      if (foundIndex === -1) break;

      const [origStart, origEnd] = mapIndicesToOriginal(
        text,
        foundIndex,
        foundIndex + normalizedSearch.length
      );

      if (origStart > lastEnd) {
        result.push({ text: text.slice(lastEnd, origStart), highlighted: false });
      }

      result.push({ text: text.slice(origStart, origEnd), highlighted: true });

      lastEnd = origEnd;
      searchStart = foundIndex + 1;
    }

    if (lastEnd < text.length) {
      result.push({ text: text.slice(lastEnd), highlighted: false });
    }

    return result.length > 0 ? result : [{ text, highlighted: false }];
  }, [text, highlight]);

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel || text}
    >
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={segment.highlighted ? highlightStyle : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

export default HighlightedText;
