/**
 * Text Utilities
 */

/**
 * Truncates text at word boundary with ellipsis
 * Avoids cutting words mid-syllable
 */
export function truncateAtWordBoundary(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find the last space before maxLength
  const truncated = text.slice(0, maxLength - suffix.length);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.5) {
    // Only use word boundary if it's in the latter half
    return truncated.slice(0, lastSpaceIndex) + suffix;
  }

  // Fallback to hard cut if word boundary is too early
  return truncated + suffix;
}
