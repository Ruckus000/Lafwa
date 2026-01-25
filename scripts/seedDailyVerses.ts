/**
 * Seed Daily Verses
 *
 * Seeds the daily_verses table with curated Bible verses.
 * Run this script after generate_db.ts to add daily verses to the database.
 *
 * Usage: npx ts-node scripts/seedDailyVerses.ts
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/assets/lafwa.db');

interface DailyVerseSeed {
  day: number; // 1-366
  book: string; // Kreyòl book name (matches bible_verses.book)
  chapter: number;
  verseStart: number;
  verseEnd?: number; // Optional for ranges
  theme?: string;
}

// Curated daily verses - 366 entries for full year including leap year
// Book names must match the database (French names from Bible JSON)
// Using well-known verses with theme distribution:
// - Hope/Encouragement: 25%
// - Faith/Trust: 20%
// - Love: 15%
// - Wisdom/Guidance: 15%
// - Praise/Worship: 10%
// - Comfort: 10%
// - Other: 5%
export const DAILY_VERSES: DailyVerseSeed[] = [
  // January (Days 1-31)
  { day: 1, book: 'Genèse', chapter: 1, verseStart: 1, theme: 'creation' },
  { day: 2, book: 'Psaumes', chapter: 23, verseStart: 1, verseEnd: 3, theme: 'comfort' },
  { day: 3, book: 'Jean', chapter: 3, verseStart: 16, theme: 'love' },
  { day: 4, book: 'Romains', chapter: 8, verseStart: 28, theme: 'hope' },
  { day: 5, book: 'Philippiens', chapter: 4, verseStart: 13, theme: 'faith' },
  { day: 6, book: 'Proverbes', chapter: 3, verseStart: 5, verseEnd: 6, theme: 'wisdom' },
  { day: 7, book: 'Ésaïe', chapter: 40, verseStart: 31, theme: 'hope' },
  { day: 8, book: 'Jérémie', chapter: 29, verseStart: 11, theme: 'hope' },
  { day: 9, book: 'Matthieu', chapter: 11, verseStart: 28, theme: 'comfort' },
  { day: 10, book: 'Psaumes', chapter: 46, verseStart: 1, theme: 'faith' },
  { day: 11, book: 'Jean', chapter: 14, verseStart: 6, theme: 'faith' },
  { day: 12, book: 'Romains', chapter: 12, verseStart: 2, theme: 'wisdom' },
  { day: 13, book: 'Hébreux', chapter: 11, verseStart: 1, theme: 'faith' },
  { day: 14, book: '1 Corinthiens', chapter: 13, verseStart: 4, verseEnd: 7, theme: 'love' },
  { day: 15, book: 'Galates', chapter: 5, verseStart: 22, verseEnd: 23, theme: 'wisdom' },
  { day: 16, book: 'Psaumes', chapter: 27, verseStart: 1, theme: 'faith' },
  { day: 17, book: 'Jean', chapter: 1, verseStart: 14, theme: 'faith' },
  { day: 18, book: 'Éphésiens', chapter: 2, verseStart: 8, verseEnd: 9, theme: 'faith' },
  { day: 19, book: 'Psaumes', chapter: 119, verseStart: 105, theme: 'guidance' },
  { day: 20, book: 'Matthieu', chapter: 6, verseStart: 33, theme: 'guidance' },
  { day: 21, book: 'Jacques', chapter: 1, verseStart: 5, theme: 'wisdom' },
  { day: 22, book: 'Romains', chapter: 5, verseStart: 8, theme: 'love' },
  { day: 23, book: 'Psaumes', chapter: 34, verseStart: 8, theme: 'praise' },
  { day: 24, book: '2 Timothée', chapter: 1, verseStart: 7, theme: 'courage' },
  { day: 25, book: 'Jean', chapter: 16, verseStart: 33, theme: 'hope' },
  { day: 26, book: 'Psaumes', chapter: 91, verseStart: 1, verseEnd: 2, theme: 'comfort' },
  { day: 27, book: '1 Jean', chapter: 4, verseStart: 19, theme: 'love' },
  { day: 28, book: 'Ésaïe', chapter: 41, verseStart: 10, theme: 'courage' },
  { day: 29, book: 'Matthieu', chapter: 5, verseStart: 14, verseEnd: 16, theme: 'guidance' },
  { day: 30, book: 'Psaumes', chapter: 100, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 31, book: 'Romains', chapter: 15, verseStart: 13, theme: 'hope' },

  // February (Days 32-60)
  { day: 32, book: 'Jean', chapter: 15, verseStart: 5, theme: 'faith' },
  { day: 33, book: 'Psaumes', chapter: 37, verseStart: 4, theme: 'guidance' },
  { day: 34, book: 'Matthieu', chapter: 7, verseStart: 7, theme: 'faith' },
  { day: 35, book: 'Philippiens', chapter: 4, verseStart: 6, verseEnd: 7, theme: 'comfort' },
  { day: 36, book: '1 Pierre', chapter: 5, verseStart: 7, theme: 'faith' },
  { day: 37, book: 'Psaumes', chapter: 121, verseStart: 1, verseEnd: 2, theme: 'faith' },
  { day: 38, book: 'Ésaïe', chapter: 53, verseStart: 5, theme: 'love' },
  { day: 39, book: 'Colossiens', chapter: 3, verseStart: 23, theme: 'guidance' },
  { day: 40, book: 'Jean', chapter: 10, verseStart: 10, theme: 'hope' },
  { day: 41, book: 'Psaumes', chapter: 139, verseStart: 14, theme: 'praise' },
  { day: 42, book: 'Romains', chapter: 6, verseStart: 23, theme: 'faith' },
  { day: 43, book: '2 Corinthiens', chapter: 5, verseStart: 17, theme: 'hope' },
  { day: 44, book: 'Psaumes', chapter: 55, verseStart: 22, theme: 'faith' },
  { day: 45, book: 'Luc', chapter: 6, verseStart: 31, theme: 'love' },
  { day: 46, book: 'Psaumes', chapter: 103, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 47, book: 'Jean', chapter: 8, verseStart: 12, theme: 'guidance' },
  { day: 48, book: 'Ésaïe', chapter: 26, verseStart: 3, theme: 'comfort' },
  { day: 49, book: 'Matthieu', chapter: 28, verseStart: 19, verseEnd: 20, theme: 'guidance' },
  { day: 50, book: 'Psaumes', chapter: 62, verseStart: 1, verseEnd: 2, theme: 'faith' },
  { day: 51, book: 'Romains', chapter: 10, verseStart: 9, theme: 'faith' },
  { day: 52, book: '1 Corinthiens', chapter: 10, verseStart: 13, theme: 'comfort' },
  { day: 53, book: 'Jean', chapter: 11, verseStart: 25, verseEnd: 26, theme: 'faith' },
  { day: 54, book: 'Psaumes', chapter: 145, verseStart: 18, theme: 'faith' },
  { day: 55, book: 'Éphésiens', chapter: 3, verseStart: 20, theme: 'praise' },
  { day: 56, book: 'Matthieu', chapter: 22, verseStart: 37, verseEnd: 39, theme: 'love' },
  { day: 57, book: 'Psaumes', chapter: 16, verseStart: 11, theme: 'hope' },
  { day: 58, book: 'Actes des Apôtres', chapter: 1, verseStart: 8, theme: 'guidance' },
  { day: 59, book: 'Jean', chapter: 6, verseStart: 35, theme: 'faith' },
  { day: 60, book: 'Psaumes', chapter: 23, verseStart: 4, theme: 'comfort' },

  // March (Days 61-91)
  { day: 61, book: 'Romains', chapter: 8, verseStart: 38, verseEnd: 39, theme: 'love' },
  { day: 62, book: 'Matthieu', chapter: 4, verseStart: 4, theme: 'wisdom' },
  { day: 63, book: 'Psaumes', chapter: 19, verseStart: 1, theme: 'praise' },
  { day: 64, book: '1 Jean', chapter: 1, verseStart: 9, theme: 'faith' },
  { day: 65, book: 'Jean', chapter: 4, verseStart: 14, theme: 'hope' },
  { day: 66, book: 'Psaumes', chapter: 42, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 67, book: 'Ésaïe', chapter: 43, verseStart: 2, theme: 'comfort' },
  { day: 68, book: 'Philippiens', chapter: 1, verseStart: 6, theme: 'hope' },
  { day: 69, book: 'Matthieu', chapter: 11, verseStart: 29, theme: 'comfort' },
  { day: 70, book: 'Psaumes', chapter: 51, verseStart: 10, theme: 'faith' },
  { day: 71, book: 'Jean', chapter: 17, verseStart: 3, theme: 'wisdom' },
  { day: 72, book: 'Romains', chapter: 12, verseStart: 12, theme: 'hope' },
  { day: 73, book: 'Psaumes', chapter: 63, verseStart: 1, theme: 'praise' },
  { day: 74, book: '2 Corinthiens', chapter: 12, verseStart: 9, theme: 'faith' },
  { day: 75, book: 'Matthieu', chapter: 6, verseStart: 34, theme: 'faith' },
  { day: 76, book: 'Psaumes', chapter: 84, verseStart: 11, theme: 'faith' },
  { day: 77, book: 'Jean', chapter: 13, verseStart: 34, verseEnd: 35, theme: 'love' },
  { day: 78, book: 'Ésaïe', chapter: 55, verseStart: 8, verseEnd: 9, theme: 'wisdom' },
  { day: 79, book: 'Galates', chapter: 2, verseStart: 20, theme: 'faith' },
  { day: 80, book: 'Psaumes', chapter: 116, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 81, book: 'Matthieu', chapter: 19, verseStart: 26, theme: 'faith' },
  { day: 82, book: 'Jean', chapter: 20, verseStart: 31, theme: 'faith' },
  { day: 83, book: 'Psaumes', chapter: 118, verseStart: 24, theme: 'praise' },
  { day: 84, book: 'Romains', chapter: 11, verseStart: 33, theme: 'wisdom' },
  { day: 85, book: '1 Thessaloniciens', chapter: 5, verseStart: 16, verseEnd: 18, theme: 'guidance' },
  { day: 86, book: 'Jean', chapter: 5, verseStart: 24, theme: 'faith' },
  { day: 87, book: 'Psaumes', chapter: 73, verseStart: 26, theme: 'faith' },
  { day: 88, book: 'Ésaïe', chapter: 12, verseStart: 2, theme: 'faith' },
  { day: 89, book: 'Matthieu', chapter: 5, verseStart: 6, theme: 'hope' },
  { day: 90, book: 'Psaumes', chapter: 90, verseStart: 12, theme: 'wisdom' },
  { day: 91, book: '1 Pierre', chapter: 2, verseStart: 9, theme: 'praise' },

  // April (Days 92-121)
  { day: 92, book: 'Jean', chapter: 7, verseStart: 37, verseEnd: 38, theme: 'hope' },
  { day: 93, book: 'Psaumes', chapter: 95, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 94, book: 'Romains', chapter: 1, verseStart: 16, theme: 'faith' },
  { day: 95, book: 'Matthieu', chapter: 9, verseStart: 29, theme: 'faith' },
  { day: 96, book: 'Psaumes', chapter: 33, verseStart: 4, theme: 'wisdom' },
  { day: 97, book: 'Éphésiens', chapter: 4, verseStart: 32, theme: 'love' },
  { day: 98, book: 'Jean', chapter: 12, verseStart: 46, theme: 'faith' },
  { day: 99, book: 'Psaumes', chapter: 40, verseStart: 1, verseEnd: 2, theme: 'faith' },
  { day: 100, book: 'Ésaïe', chapter: 30, verseStart: 15, theme: 'faith' },
  { day: 101, book: '2 Corinthiens', chapter: 1, verseStart: 3, verseEnd: 4, theme: 'comfort' },
  { day: 102, book: 'Matthieu', chapter: 18, verseStart: 20, theme: 'faith' },
  { day: 103, book: 'Psaumes', chapter: 147, verseStart: 3, theme: 'comfort' },
  { day: 104, book: 'Jean', chapter: 9, verseStart: 25, theme: 'faith' },
  { day: 105, book: 'Romains', chapter: 14, verseStart: 8, theme: 'faith' },
  { day: 106, book: 'Psaumes', chapter: 1, verseStart: 1, verseEnd: 2, theme: 'wisdom' },
  { day: 107, book: 'Philippiens', chapter: 3, verseStart: 14, theme: 'hope' },
  { day: 108, book: 'Matthieu', chapter: 5, verseStart: 9, theme: 'love' },
  { day: 109, book: 'Psaumes', chapter: 107, verseStart: 1, theme: 'praise' },
  { day: 110, book: 'Jean', chapter: 21, verseStart: 17, theme: 'love' },
  { day: 111, book: 'Hébreux', chapter: 12, verseStart: 2, theme: 'faith' },
  { day: 112, book: 'Psaumes', chapter: 138, verseStart: 3, theme: 'praise' },
  { day: 113, book: 'Ésaïe', chapter: 49, verseStart: 15, theme: 'love' },
  { day: 114, book: 'Matthieu', chapter: 24, verseStart: 35, theme: 'faith' },
  { day: 115, book: 'Psaumes', chapter: 31, verseStart: 24, theme: 'hope' },
  { day: 116, book: 'Romains', chapter: 8, verseStart: 1, theme: 'faith' },
  { day: 117, book: 'Jean', chapter: 1, verseStart: 12, theme: 'faith' },
  { day: 118, book: 'Psaumes', chapter: 143, verseStart: 8, theme: 'guidance' },
  { day: 119, book: '1 Jean', chapter: 3, verseStart: 1, theme: 'love' },
  { day: 120, book: 'Matthieu', chapter: 10, verseStart: 31, theme: 'faith' },
  { day: 121, book: 'Psaumes', chapter: 96, verseStart: 1, verseEnd: 2, theme: 'praise' },

  // May (Days 122-152)
  { day: 122, book: 'Jean', chapter: 14, verseStart: 27, theme: 'comfort' },
  { day: 123, book: 'Psaumes', chapter: 18, verseStart: 2, theme: 'faith' },
  { day: 124, book: 'Éphésiens', chapter: 6, verseStart: 10, theme: 'courage' },
  { day: 125, book: 'Matthieu', chapter: 17, verseStart: 20, theme: 'faith' },
  { day: 126, book: 'Psaumes', chapter: 25, verseStart: 4, verseEnd: 5, theme: 'guidance' },
  { day: 127, book: 'Romains', chapter: 3, verseStart: 23, verseEnd: 24, theme: 'faith' },
  { day: 128, book: 'Jean', chapter: 19, verseStart: 30, theme: 'faith' },
  { day: 129, book: 'Psaumes', chapter: 30, verseStart: 5, theme: 'hope' },
  { day: 130, book: 'Ésaïe', chapter: 54, verseStart: 10, theme: 'love' },
  { day: 131, book: '2 Corinthiens', chapter: 4, verseStart: 16, verseEnd: 18, theme: 'hope' },
  { day: 132, book: 'Matthieu', chapter: 6, verseStart: 9, verseEnd: 10, theme: 'guidance' },
  { day: 133, book: 'Psaumes', chapter: 86, verseStart: 5, theme: 'love' },
  { day: 134, book: 'Jean', chapter: 2, verseStart: 5, theme: 'faith' },
  { day: 135, book: 'Galates', chapter: 6, verseStart: 9, theme: 'hope' },
  { day: 136, book: 'Psaumes', chapter: 111, verseStart: 10, theme: 'wisdom' },
  { day: 137, book: 'Romains', chapter: 8, verseStart: 31, theme: 'faith' },
  { day: 138, book: 'Matthieu', chapter: 12, verseStart: 21, theme: 'hope' },
  { day: 139, book: 'Psaumes', chapter: 57, verseStart: 1, theme: 'faith' },
  { day: 140, book: 'Jean', chapter: 16, verseStart: 24, theme: 'faith' },
  { day: 141, book: 'Ésaïe', chapter: 46, verseStart: 4, theme: 'comfort' },
  { day: 142, book: 'Psaumes', chapter: 126, verseStart: 5, verseEnd: 6, theme: 'hope' },
  { day: 143, book: 'Philippiens', chapter: 2, verseStart: 13, theme: 'faith' },
  { day: 144, book: 'Matthieu', chapter: 21, verseStart: 22, theme: 'faith' },
  { day: 145, book: 'Psaumes', chapter: 92, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 146, book: '1 Corinthiens', chapter: 2, verseStart: 9, theme: 'hope' },
  { day: 147, book: 'Jean', chapter: 14, verseStart: 1, theme: 'comfort' },
  { day: 148, book: 'Psaumes', chapter: 5, verseStart: 3, theme: 'faith' },
  { day: 149, book: 'Romains', chapter: 5, verseStart: 1, theme: 'faith' },
  { day: 150, book: 'Matthieu', chapter: 5, verseStart: 8, theme: 'hope' },
  { day: 151, book: 'Psaumes', chapter: 67, verseStart: 1, theme: 'praise' },
  { day: 152, book: 'Ésaïe', chapter: 58, verseStart: 11, theme: 'guidance' },

  // June (Days 153-182)
  { day: 153, book: 'Jean', chapter: 6, verseStart: 63, theme: 'wisdom' },
  { day: 154, book: 'Psaumes', chapter: 4, verseStart: 8, theme: 'comfort' },
  { day: 155, book: 'Hébreux', chapter: 4, verseStart: 16, theme: 'faith' },
  { day: 156, book: 'Matthieu', chapter: 7, verseStart: 11, theme: 'love' },
  { day: 157, book: 'Psaumes', chapter: 112, verseStart: 1, theme: 'wisdom' },
  { day: 158, book: 'Romains', chapter: 15, verseStart: 4, theme: 'hope' },
  { day: 159, book: 'Jean', chapter: 8, verseStart: 32, theme: 'faith' },
  { day: 160, book: 'Psaumes', chapter: 147, verseStart: 11, theme: 'love' },
  { day: 161, book: 'Éphésiens', chapter: 1, verseStart: 3, theme: 'praise' },
  { day: 162, book: 'Matthieu', chapter: 6, verseStart: 26, theme: 'faith' },
  { day: 163, book: 'Psaumes', chapter: 29, verseStart: 2, theme: 'praise' },
  { day: 164, book: 'Jean', chapter: 4, verseStart: 24, theme: 'wisdom' },
  { day: 165, book: 'Ésaïe', chapter: 25, verseStart: 1, theme: 'praise' },
  { day: 166, book: '2 Corinthiens', chapter: 3, verseStart: 17, theme: 'faith' },
  { day: 167, book: 'Psaumes', chapter: 36, verseStart: 5, theme: 'love' },
  { day: 168, book: 'Matthieu', chapter: 16, verseStart: 24, theme: 'guidance' },
  { day: 169, book: 'Romains', chapter: 8, verseStart: 26, theme: 'comfort' },
  { day: 170, book: 'Psaumes', chapter: 133, verseStart: 1, theme: 'love' },
  { day: 171, book: 'Jean', chapter: 15, verseStart: 11, theme: 'hope' },
  { day: 172, book: 'Philippiens', chapter: 4, verseStart: 19, theme: 'faith' },
  { day: 173, book: 'Psaumes', chapter: 148, verseStart: 1, theme: 'praise' },
  { day: 174, book: 'Matthieu', chapter: 14, verseStart: 27, theme: 'faith' },
  { day: 175, book: 'Ésaïe', chapter: 40, verseStart: 29, theme: 'hope' },
  { day: 176, book: 'Psaumes', chapter: 71, verseStart: 5, theme: 'faith' },
  { day: 177, book: 'Jean', chapter: 3, verseStart: 36, theme: 'faith' },
  { day: 178, book: '1 Jean', chapter: 5, verseStart: 14, theme: 'faith' },
  { day: 179, book: 'Psaumes', chapter: 89, verseStart: 1, theme: 'praise' },
  { day: 180, book: 'Matthieu', chapter: 8, verseStart: 26, theme: 'faith' },
  { day: 181, book: 'Romains', chapter: 8, verseStart: 18, theme: 'hope' },
  { day: 182, book: 'Psaumes', chapter: 68, verseStart: 19, theme: 'praise' },

  // July (Days 183-213)
  { day: 183, book: 'Jean', chapter: 10, verseStart: 27, verseEnd: 28, theme: 'faith' },
  { day: 184, book: 'Psaumes', chapter: 77, verseStart: 13, theme: 'praise' },
  { day: 185, book: 'Galates', chapter: 3, verseStart: 26, theme: 'faith' },
  { day: 186, book: 'Matthieu', chapter: 5, verseStart: 4, theme: 'comfort' },
  { day: 187, book: 'Psaumes', chapter: 115, verseStart: 1, theme: 'praise' },
  { day: 188, book: 'Ésaïe', chapter: 43, verseStart: 18, verseEnd: 19, theme: 'hope' },
  { day: 189, book: 'Jean', chapter: 12, verseStart: 26, theme: 'guidance' },
  { day: 190, book: 'Psaumes', chapter: 22, verseStart: 27, theme: 'praise' },
  { day: 191, book: 'Romains', chapter: 10, verseStart: 17, theme: 'faith' },
  { day: 192, book: '2 Corinthiens', chapter: 9, verseStart: 8, theme: 'faith' },
  { day: 193, book: 'Matthieu', chapter: 11, verseStart: 30, theme: 'comfort' },
  { day: 194, book: 'Psaumes', chapter: 135, verseStart: 3, theme: 'praise' },
  { day: 195, book: 'Jean', chapter: 14, verseStart: 21, theme: 'love' },
  { day: 196, book: 'Éphésiens', chapter: 5, verseStart: 1, verseEnd: 2, theme: 'love' },
  { day: 197, book: 'Psaumes', chapter: 98, verseStart: 1, theme: 'praise' },
  { day: 198, book: 'Ésaïe', chapter: 41, verseStart: 13, theme: 'courage' },
  { day: 199, book: 'Matthieu', chapter: 6, verseStart: 21, theme: 'wisdom' },
  { day: 200, book: 'Psaumes', chapter: 20, verseStart: 4, theme: 'faith' },
  { day: 201, book: 'Jean', chapter: 15, verseStart: 16, theme: 'guidance' },
  { day: 202, book: '1 Pierre', chapter: 4, verseStart: 8, theme: 'love' },
  { day: 203, book: 'Psaumes', chapter: 48, verseStart: 14, theme: 'guidance' },
  { day: 204, book: 'Romains', chapter: 8, verseStart: 37, theme: 'faith' },
  { day: 205, book: 'Matthieu', chapter: 25, verseStart: 21, theme: 'hope' },
  { day: 206, book: 'Psaumes', chapter: 104, verseStart: 1, theme: 'praise' },
  { day: 207, book: 'Jean', chapter: 6, verseStart: 68, theme: 'faith' },
  { day: 208, book: 'Colossiens', chapter: 3, verseStart: 2, theme: 'guidance' },
  { day: 209, book: 'Psaumes', chapter: 65, verseStart: 1, theme: 'praise' },
  { day: 210, book: 'Ésaïe', chapter: 33, verseStart: 2, theme: 'faith' },
  { day: 211, book: 'Matthieu', chapter: 7, verseStart: 24, theme: 'wisdom' },
  { day: 212, book: 'Psaumes', chapter: 145, verseStart: 3, theme: 'praise' },
  { day: 213, book: 'Jean', chapter: 8, verseStart: 36, theme: 'faith' },

  // August (Days 214-244)
  { day: 214, book: 'Romains', chapter: 12, verseStart: 1, theme: 'guidance' },
  { day: 215, book: 'Psaumes', chapter: 56, verseStart: 3, verseEnd: 4, theme: 'faith' },
  { day: 216, book: '2 Timothée', chapter: 2, verseStart: 15, theme: 'guidance' },
  { day: 217, book: 'Matthieu', chapter: 6, verseStart: 6, theme: 'faith' },
  { day: 218, book: 'Psaumes', chapter: 150, verseStart: 6, theme: 'praise' },
  { day: 219, book: 'Jean', chapter: 17, verseStart: 17, theme: 'wisdom' },
  { day: 220, book: 'Éphésiens', chapter: 6, verseStart: 18, theme: 'faith' },
  { day: 221, book: 'Psaumes', chapter: 123, verseStart: 2, theme: 'faith' },
  { day: 222, book: 'Ésaïe', chapter: 26, verseStart: 4, theme: 'faith' },
  { day: 223, book: 'Matthieu', chapter: 5, verseStart: 44, theme: 'love' },
  { day: 224, book: 'Psaumes', chapter: 97, verseStart: 1, theme: 'praise' },
  { day: 225, book: 'Jean', chapter: 4, verseStart: 23, theme: 'wisdom' },
  { day: 226, book: 'Galates', chapter: 5, verseStart: 1, theme: 'faith' },
  { day: 227, book: 'Psaumes', chapter: 37, verseStart: 5, verseEnd: 6, theme: 'faith' },
  { day: 228, book: 'Romains', chapter: 8, verseStart: 14, theme: 'guidance' },
  { day: 229, book: 'Matthieu', chapter: 26, verseStart: 41, theme: 'wisdom' },
  { day: 230, book: 'Psaumes', chapter: 119, verseStart: 11, theme: 'wisdom' },
  { day: 231, book: 'Jean', chapter: 1, verseStart: 4, verseEnd: 5, theme: 'faith' },
  { day: 232, book: '1 Corinthiens', chapter: 15, verseStart: 58, theme: 'hope' },
  { day: 233, book: 'Psaumes', chapter: 102, verseStart: 27, theme: 'faith' },
  { day: 234, book: 'Ésaïe', chapter: 9, verseStart: 6, theme: 'hope' },
  { day: 235, book: 'Matthieu', chapter: 18, verseStart: 3, theme: 'wisdom' },
  { day: 236, book: 'Psaumes', chapter: 66, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 237, book: 'Jean', chapter: 13, verseStart: 17, theme: 'wisdom' },
  { day: 238, book: 'Philippiens', chapter: 4, verseStart: 4, theme: 'hope' },
  { day: 239, book: 'Psaumes', chapter: 113, verseStart: 3, theme: 'praise' },
  { day: 240, book: 'Romains', chapter: 8, verseStart: 6, theme: 'wisdom' },
  { day: 241, book: 'Matthieu', chapter: 10, verseStart: 8, theme: 'guidance' },
  { day: 242, book: 'Psaumes', chapter: 28, verseStart: 7, theme: 'faith' },
  { day: 243, book: 'Jean', chapter: 16, verseStart: 13, theme: 'guidance' },
  { day: 244, book: 'Hébreux', chapter: 13, verseStart: 8, theme: 'faith' },

  // September (Days 245-274)
  { day: 245, book: 'Psaumes', chapter: 99, verseStart: 9, theme: 'praise' },
  { day: 246, book: 'Ésaïe', chapter: 35, verseStart: 4, theme: 'hope' },
  { day: 247, book: 'Matthieu', chapter: 5, verseStart: 3, theme: 'hope' },
  { day: 248, book: 'Psaumes', chapter: 34, verseStart: 18, theme: 'comfort' },
  { day: 249, book: 'Jean', chapter: 15, verseStart: 7, theme: 'faith' },
  { day: 250, book: '2 Corinthiens', chapter: 7, verseStart: 1, theme: 'guidance' },
  { day: 251, book: 'Psaumes', chapter: 119, verseStart: 130, theme: 'wisdom' },
  { day: 252, book: 'Romains', chapter: 5, verseStart: 5, theme: 'hope' },
  { day: 253, book: 'Matthieu', chapter: 4, verseStart: 19, theme: 'guidance' },
  { day: 254, book: 'Psaumes', chapter: 136, verseStart: 1, theme: 'love' },
  { day: 255, book: 'Jean', chapter: 11, verseStart: 40, theme: 'faith' },
  { day: 256, book: 'Éphésiens', chapter: 3, verseStart: 16, theme: 'faith' },
  { day: 257, book: 'Psaumes', chapter: 8, verseStart: 1, theme: 'praise' },
  { day: 258, book: 'Ésaïe', chapter: 40, verseStart: 11, theme: 'love' },
  { day: 259, book: 'Matthieu', chapter: 11, verseStart: 5, theme: 'hope' },
  { day: 260, book: 'Psaumes', chapter: 59, verseStart: 16, theme: 'praise' },
  { day: 261, book: 'Jean', chapter: 5, verseStart: 39, theme: 'wisdom' },
  { day: 262, book: '1 Thessaloniciens', chapter: 4, verseStart: 17, verseEnd: 18, theme: 'hope' },
  { day: 263, book: 'Psaumes', chapter: 72, verseStart: 18, verseEnd: 19, theme: 'praise' },
  { day: 264, book: 'Romains', chapter: 8, verseStart: 35, theme: 'love' },
  { day: 265, book: 'Matthieu', chapter: 20, verseStart: 28, theme: 'love' },
  { day: 266, book: 'Psaumes', chapter: 85, verseStart: 10, theme: 'love' },
  { day: 267, book: 'Jean', chapter: 18, verseStart: 37, theme: 'wisdom' },
  { day: 268, book: 'Galates', chapter: 2, verseStart: 16, theme: 'faith' },
  { day: 269, book: 'Psaumes', chapter: 94, verseStart: 19, theme: 'comfort' },
  { day: 270, book: 'Ésaïe', chapter: 61, verseStart: 1, theme: 'hope' },
  { day: 271, book: 'Matthieu', chapter: 5, verseStart: 7, theme: 'love' },
  { day: 272, book: 'Psaumes', chapter: 149, verseStart: 1, theme: 'praise' },
  { day: 273, book: 'Jean', chapter: 8, verseStart: 28, theme: 'faith' },
  { day: 274, book: 'Colossiens', chapter: 1, verseStart: 27, theme: 'hope' },

  // October (Days 275-305)
  { day: 275, book: 'Psaumes', chapter: 93, verseStart: 4, theme: 'praise' },
  { day: 276, book: 'Romains', chapter: 1, verseStart: 17, theme: 'faith' },
  { day: 277, book: 'Matthieu', chapter: 13, verseStart: 44, theme: 'wisdom' },
  { day: 278, book: 'Psaumes', chapter: 119, verseStart: 89, theme: 'faith' },
  { day: 279, book: 'Jean', chapter: 10, verseStart: 14, verseEnd: 15, theme: 'love' },
  { day: 280, book: 'Hébreux', chapter: 11, verseStart: 6, theme: 'faith' },
  { day: 281, book: 'Psaumes', chapter: 146, verseStart: 5, theme: 'faith' },
  { day: 282, book: 'Ésaïe', chapter: 41, verseStart: 17, theme: 'comfort' },
  { day: 283, book: 'Matthieu', chapter: 6, verseStart: 31, verseEnd: 32, theme: 'faith' },
  { day: 284, book: 'Psaumes', chapter: 61, verseStart: 1, verseEnd: 2, theme: 'faith' },
  { day: 285, book: 'Jean', chapter: 6, verseStart: 47, theme: 'faith' },
  { day: 286, book: '2 Corinthiens', chapter: 5, verseStart: 7, theme: 'faith' },
  { day: 287, book: 'Psaumes', chapter: 144, verseStart: 1, theme: 'praise' },
  { day: 288, book: 'Romains', chapter: 4, verseStart: 20, verseEnd: 21, theme: 'faith' },
  { day: 289, book: 'Matthieu', chapter: 24, verseStart: 14, theme: 'hope' },
  { day: 290, book: 'Psaumes', chapter: 119, verseStart: 50, theme: 'comfort' },
  { day: 291, book: 'Jean', chapter: 14, verseStart: 16, verseEnd: 17, theme: 'comfort' },
  { day: 292, book: 'Éphésiens', chapter: 4, verseStart: 2, verseEnd: 3, theme: 'love' },
  { day: 293, book: 'Psaumes', chapter: 47, verseStart: 1, theme: 'praise' },
  { day: 294, book: 'Ésaïe', chapter: 57, verseStart: 15, theme: 'faith' },
  { day: 295, book: 'Matthieu', chapter: 7, verseStart: 12, theme: 'love' },
  { day: 296, book: 'Psaumes', chapter: 80, verseStart: 19, theme: 'faith' },
  { day: 297, book: 'Jean', chapter: 17, verseStart: 20, verseEnd: 21, theme: 'love' },
  { day: 298, book: '1 Jean', chapter: 4, verseStart: 8, theme: 'love' },
  { day: 299, book: 'Psaumes', chapter: 106, verseStart: 1, theme: 'praise' },
  { day: 300, book: 'Romains', chapter: 6, verseStart: 4, theme: 'faith' },
  { day: 301, book: 'Matthieu', chapter: 6, verseStart: 14, theme: 'love' },
  { day: 302, book: 'Psaumes', chapter: 119, verseStart: 165, theme: 'comfort' },
  { day: 303, book: 'Jean', chapter: 12, verseStart: 32, theme: 'hope' },
  { day: 304, book: 'Galates', chapter: 6, verseStart: 2, theme: 'love' },
  { day: 305, book: 'Psaumes', chapter: 105, verseStart: 1, verseEnd: 2, theme: 'praise' },

  // November (Days 306-335)
  { day: 306, book: 'Ésaïe', chapter: 40, verseStart: 28, theme: 'faith' },
  { day: 307, book: 'Matthieu', chapter: 5, verseStart: 10, theme: 'hope' },
  { day: 308, book: 'Psaumes', chapter: 32, verseStart: 8, theme: 'guidance' },
  { day: 309, book: 'Jean', chapter: 14, verseStart: 18, theme: 'comfort' },
  { day: 310, book: 'Romains', chapter: 8, verseStart: 16, verseEnd: 17, theme: 'faith' },
  { day: 311, book: 'Psaumes', chapter: 82, verseStart: 8, theme: 'hope' },
  { day: 312, book: '2 Corinthiens', chapter: 6, verseStart: 2, theme: 'hope' },
  { day: 313, book: 'Matthieu', chapter: 8, verseStart: 3, theme: 'faith' },
  { day: 314, book: 'Psaumes', chapter: 50, verseStart: 15, theme: 'faith' },
  { day: 315, book: 'Jean', chapter: 1, verseStart: 16, theme: 'love' },
  { day: 316, book: 'Philippiens', chapter: 2, verseStart: 3, verseEnd: 4, theme: 'love' },
  { day: 317, book: 'Psaumes', chapter: 119, verseStart: 71, theme: 'wisdom' },
  { day: 318, book: 'Ésaïe', chapter: 44, verseStart: 3, theme: 'hope' },
  { day: 319, book: 'Matthieu', chapter: 15, verseStart: 28, theme: 'faith' },
  { day: 320, book: 'Psaumes', chapter: 142, verseStart: 5, theme: 'faith' },
  { day: 321, book: 'Jean', chapter: 6, verseStart: 37, theme: 'love' },
  { day: 322, book: 'Hébreux', chapter: 10, verseStart: 23, theme: 'faith' },
  { day: 323, book: 'Psaumes', chapter: 141, verseStart: 3, theme: 'wisdom' },
  { day: 324, book: 'Romains', chapter: 14, verseStart: 17, theme: 'hope' },
  { day: 325, book: 'Matthieu', chapter: 11, verseStart: 6, theme: 'faith' },
  { day: 326, book: 'Psaumes', chapter: 119, verseStart: 114, theme: 'hope' },
  { day: 327, book: 'Jean', chapter: 16, verseStart: 22, theme: 'hope' },
  { day: 328, book: '1 Thessaloniciens', chapter: 5, verseStart: 11, theme: 'love' },
  { day: 329, book: 'Psaumes', chapter: 101, verseStart: 2, theme: 'wisdom' },
  { day: 330, book: 'Ésaïe', chapter: 45, verseStart: 22, theme: 'faith' },
  { day: 331, book: 'Matthieu', chapter: 6, verseStart: 20, theme: 'wisdom' },
  { day: 332, book: 'Psaumes', chapter: 119, verseStart: 32, theme: 'guidance' },
  { day: 333, book: 'Jean', chapter: 5, verseStart: 14, theme: 'guidance' },
  { day: 334, book: 'Colossiens', chapter: 3, verseStart: 12, theme: 'love' },
  { day: 335, book: 'Psaumes', chapter: 119, verseStart: 97, theme: 'love' },

  // December (Days 336-366)
  { day: 336, book: 'Romains', chapter: 12, verseStart: 21, theme: 'love' },
  { day: 337, book: 'Matthieu', chapter: 1, verseStart: 23, theme: 'hope' },
  { day: 338, book: 'Psaumes', chapter: 119, verseStart: 143, theme: 'faith' },
  { day: 339, book: 'Jean', chapter: 1, verseStart: 9, theme: 'hope' },
  { day: 340, book: 'Ésaïe', chapter: 7, verseStart: 14, theme: 'hope' },
  { day: 341, book: 'Psaumes', chapter: 130, verseStart: 5, theme: 'hope' },
  { day: 342, book: 'Luc', chapter: 1, verseStart: 37, theme: 'faith' },
  { day: 343, book: 'Matthieu', chapter: 2, verseStart: 11, theme: 'praise' },
  { day: 344, book: 'Psaumes', chapter: 2, verseStart: 11, theme: 'wisdom' },
  { day: 345, book: 'Jean', chapter: 3, verseStart: 17, theme: 'love' },
  { day: 346, book: 'Ésaïe', chapter: 11, verseStart: 1, theme: 'hope' },
  { day: 347, book: 'Psaumes', chapter: 122, verseStart: 1, theme: 'praise' },
  { day: 348, book: 'Luc', chapter: 2, verseStart: 10, verseEnd: 11, theme: 'hope' },
  { day: 349, book: 'Matthieu', chapter: 1, verseStart: 21, theme: 'faith' },
  { day: 350, book: 'Psaumes', chapter: 108, verseStart: 1, theme: 'praise' },
  { day: 351, book: 'Jean', chapter: 1, verseStart: 1, verseEnd: 3, theme: 'faith' },
  { day: 352, book: 'Ésaïe', chapter: 60, verseStart: 1, theme: 'hope' },
  { day: 353, book: 'Psaumes', chapter: 117, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 354, book: 'Luc', chapter: 2, verseStart: 14, theme: 'praise' },
  { day: 355, book: 'Matthieu', chapter: 2, verseStart: 2, theme: 'praise' },
  { day: 356, book: 'Psaumes', chapter: 96, verseStart: 11, verseEnd: 12, theme: 'praise' },
  { day: 357, book: 'Jean', chapter: 1, verseStart: 17, theme: 'faith' },
  { day: 358, book: 'Ésaïe', chapter: 52, verseStart: 7, theme: 'hope' },
  { day: 359, book: 'Psaumes', chapter: 134, verseStart: 1, verseEnd: 2, theme: 'praise' },
  { day: 360, book: 'Luc', chapter: 1, verseStart: 78, verseEnd: 79, theme: 'hope' },
  { day: 361, book: 'Matthieu', chapter: 28, verseStart: 6, theme: 'faith' },
  { day: 362, book: 'Psaumes', chapter: 103, verseStart: 17, theme: 'love' },
  { day: 363, book: 'Romains', chapter: 8, verseStart: 39, theme: 'love' },
  { day: 364, book: 'Psaumes', chapter: 139, verseStart: 23, verseEnd: 24, theme: 'guidance' },
  { day: 365, book: 'Apocalypse', chapter: 21, verseStart: 5, theme: 'hope' },
  { day: 366, book: 'Apocalypse', chapter: 22, verseStart: 21, theme: 'blessing' }, // Leap year
];

// Helper functions for database operations
function runSql(
  db: sqlite3.Database,
  sql: string,
  params: any[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getSql<T>(
  db: sqlite3.Database,
  sql: string,
  params: any[] = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

interface VerseRow {
  id: number;
}

/**
 * Validates that all seed data verses exist in the database.
 */
async function validateSeedData(db: sqlite3.Database): Promise<string[]> {
  const errors: string[] = [];

  console.log('Validating seed data against bible_verses...');

  for (const verse of DAILY_VERSES) {
    // Check day is valid
    if (verse.day < 1 || verse.day > 366) {
      errors.push(`Day ${verse.day}: Invalid day number`);
      continue;
    }

    // Check verse exists in Haitian Creole
    const htResult = await getSql<VerseRow>(
      db,
      'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
      [verse.book, verse.chapter, verse.verseStart, 'ht']
    );

    if (!htResult) {
      errors.push(
        `Day ${verse.day}: ${verse.book} ${verse.chapter}:${verse.verseStart} not found in Kreyòl`
      );
    }

    // Check verse exists in French
    const frResult = await getSql<VerseRow>(
      db,
      'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
      [verse.book, verse.chapter, verse.verseStart, 'fr']
    );

    if (!frResult) {
      errors.push(
        `Day ${verse.day}: ${verse.book} ${verse.chapter}:${verse.verseStart} not found in French`
      );
    }

    // Check verse range if applicable
    if (verse.verseEnd) {
      for (let v = verse.verseStart; v <= verse.verseEnd; v++) {
        const rangeResult = await getSql<VerseRow>(
          db,
          'SELECT id FROM bible_verses WHERE book = ? AND chapter = ? AND verse = ? AND version = ?',
          [verse.book, verse.chapter, v, 'ht']
        );
        if (!rangeResult) {
          errors.push(
            `Day ${verse.day}: ${verse.book} ${verse.chapter}:${v} (in range) not found`
          );
        }
      }
    }
  }

  // Check for duplicate days
  const days = DAILY_VERSES.map((v) => v.day);
  const duplicates = days.filter((day, index) => days.indexOf(day) !== index);
  for (const dup of new Set(duplicates)) {
    errors.push(`Day ${dup}: Duplicate entry`);
  }

  // Check for missing days
  for (let day = 1; day <= 366; day++) {
    if (!days.includes(day)) {
      errors.push(`Day ${day}: Missing entry`);
    }
  }

  return errors;
}

/**
 * Seeds the daily_verses table.
 */
async function seedDailyVerses(db: sqlite3.Database): Promise<void> {
  // Validate first
  const errors = await validateSeedData(db);
  if (errors.length > 0) {
    console.error('\nValidation errors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    throw new Error(
      `${errors.length} validation errors found. Fix seed data before continuing.`
    );
  }

  console.log('Validation passed! Seeding daily verses...');

  // Clear existing data
  await runSql(db, 'DELETE FROM daily_verses');

  // Insert in batches
  await runSql(db, 'BEGIN TRANSACTION');

  for (const verse of DAILY_VERSES) {
    await runSql(
      db,
      `INSERT INTO daily_verses (day_of_year, book, chapter, verse_start, verse_end, theme)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        verse.day,
        verse.book,
        verse.chapter,
        verse.verseStart,
        verse.verseEnd ?? null,
        verse.theme ?? null,
      ]
    );
  }

  await runSql(db, 'COMMIT');

  console.log(`Successfully seeded ${DAILY_VERSES.length} daily verses`);
}

/**
 * Main entry point.
 */
async function main() {
  console.log('=== Seed Daily Verses ===\n');
  console.log(`Database: ${DB_PATH}\n`);

  const db = new sqlite3.Database(DB_PATH);

  try {
    await seedDailyVerses(db);

    // Verify count
    const result = await getSql<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM daily_verses'
    );
    console.log(`\nVerification: ${result?.count || 0} daily verses in database`);
  } catch (err) {
    console.error('\nSeeding failed:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
