/**
 * Converts World English Bible from arron-taylor format to Lafwa app format
 *
 * Source format:
 * { "Genesis": { "1": { "1": "verse text", ... }, ... }, ... }
 *
 * Target format:
 * { "Testaments": [{ "Books": [{ "Text": "Genèse", "Chapters": [{ "Verses": [...] }] }] }] }
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'src/assets/data/raw');
const SOURCE_FILE = path.join(DATA_DIR, 'web_bible_source.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'english_bible.json');

// English to French book name mapping (must match existing database)
const ENGLISH_TO_FRENCH_BOOKS: Record<string, { french: string; testament: 'OT' | 'NT' }> = {
  // Old Testament (39 books)
  'Genesis': { french: 'Genèse', testament: 'OT' },
  'Exodus': { french: 'Exode', testament: 'OT' },
  'Leviticus': { french: 'Lévitique', testament: 'OT' },
  'Numbers': { french: 'Nombres', testament: 'OT' },
  'Deuteronomy': { french: 'Deutéronome', testament: 'OT' },
  'Joshua': { french: 'Josué', testament: 'OT' },
  'Judges': { french: 'Juges', testament: 'OT' },
  'Ruth': { french: 'Ruth', testament: 'OT' },
  '1 Samuel': { french: '1 Samuel', testament: 'OT' },
  '2 Samuel': { french: '2 Samuel', testament: 'OT' },
  '1 Kings': { french: '1 Rois', testament: 'OT' },
  '2 Kings': { french: '2 Rois', testament: 'OT' },
  '1 Chronicles': { french: '1 Chroniques', testament: 'OT' },
  '2 Chronicles': { french: '2 Chroniques', testament: 'OT' },
  'Ezra': { french: 'Esdras', testament: 'OT' },
  'Nehemiah': { french: 'Néhémie', testament: 'OT' },
  'Esther': { french: 'Esther', testament: 'OT' },
  'Job': { french: 'Job', testament: 'OT' },
  'Psalms': { french: 'Psaumes', testament: 'OT' },
  'Proverbs': { french: 'Proverbes', testament: 'OT' },
  'Ecclesiastes': { french: 'Ecclésiaste', testament: 'OT' },
  'Song of Solomon': { french: 'Cantique', testament: 'OT' },
  'Isaiah': { french: 'Ésaïe', testament: 'OT' },
  'Jeremiah': { french: 'Jérémie', testament: 'OT' },
  'Lamentations': { french: 'Lamentations', testament: 'OT' },
  'Ezekiel': { french: 'Ézéchiel', testament: 'OT' },
  'Daniel': { french: 'Daniel', testament: 'OT' },
  'Hosea': { french: 'Osée', testament: 'OT' },
  'Joel': { french: 'Joël', testament: 'OT' },
  'Amos': { french: 'Amos', testament: 'OT' },
  'Obadiah': { french: 'Abdias', testament: 'OT' },
  'Jonah': { french: 'Jonas', testament: 'OT' },
  'Micah': { french: 'Michée', testament: 'OT' },
  'Nahum': { french: 'Nahum', testament: 'OT' },
  'Habakkuk': { french: 'Habacuc', testament: 'OT' },
  'Zephaniah': { french: 'Sophonie', testament: 'OT' },
  'Haggai': { french: 'Aggée', testament: 'OT' },
  'Zechariah': { french: 'Zacharie', testament: 'OT' },
  'Malachi': { french: 'Malachie', testament: 'OT' },
  // New Testament (27 books)
  'Matthew': { french: 'Matthieu', testament: 'NT' },
  'Mark': { french: 'Marc', testament: 'NT' },
  'Luke': { french: 'Luc', testament: 'NT' },
  'John': { french: 'Jean', testament: 'NT' },
  'Acts': { french: 'Actes', testament: 'NT' },
  'Romans': { french: 'Romains', testament: 'NT' },
  '1 Corinthians': { french: '1 Corinthiens', testament: 'NT' },
  '2 Corinthians': { french: '2 Corinthiens', testament: 'NT' },
  'Galatians': { french: 'Galates', testament: 'NT' },
  'Ephesians': { french: 'Éphésiens', testament: 'NT' },
  'Philippians': { french: 'Philippiens', testament: 'NT' },
  'Colossians': { french: 'Colossiens', testament: 'NT' },
  '1 Thessalonians': { french: '1 Thessaloniciens', testament: 'NT' },
  '2 Thessalonians': { french: '2 Thessaloniciens', testament: 'NT' },
  '1 Timothy': { french: '1 Timothée', testament: 'NT' },
  '2 Timothy': { french: '2 Timothée', testament: 'NT' },
  'Titus': { french: 'Tite', testament: 'NT' },
  'Philemon': { french: 'Philémon', testament: 'NT' },
  'Hebrews': { french: 'Hébreux', testament: 'NT' },
  'James': { french: 'Jacques', testament: 'NT' },
  '1 Peter': { french: '1 Pierre', testament: 'NT' },
  '2 Peter': { french: '2 Pierre', testament: 'NT' },
  '1 John': { french: '1 Jean', testament: 'NT' },
  '2 John': { french: '2 Jean', testament: 'NT' },
  '3 John': { french: '3 Jean', testament: 'NT' },
  'Jude': { french: 'Jude', testament: 'NT' },
  'Revelation': { french: 'Apocalypse', testament: 'NT' },
};

// Canonical book order
const BOOK_ORDER = [
  // OT
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
  'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // NT
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

interface SourceVerse {
  [verseNum: string]: string;
}

interface SourceChapter {
  [chapterNum: string]: SourceVerse;
}

interface SourceBible {
  [bookName: string]: SourceChapter;
}

interface TargetVerse {
  ID?: number;
  Text: string;
}

interface TargetChapter {
  Verses: TargetVerse[];
}

interface TargetBook {
  Text: string;
  Chapters: TargetChapter[];
}

interface TargetTestament {
  Books: TargetBook[];
}

interface TargetBible {
  Abbreviation: string;
  Language: string;
  Copyright: string;
  Testaments: TargetTestament[];
}

function convertBible(): void {
  console.log('=== Converting World English Bible ===\n');

  // Read source file
  console.log('Reading source file...');
  const sourceData: SourceBible = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
  const sourceBooks = Object.keys(sourceData);
  console.log(`  Found ${sourceBooks.length} books in source`);

  // Check for missing books
  const missingBooks = BOOK_ORDER.filter(b => !sourceBooks.includes(b));
  if (missingBooks.length > 0) {
    console.warn(`  Warning: Missing books: ${missingBooks.join(', ')}`);
  }

  // Initialize output structure
  const output: TargetBible = {
    Abbreviation: 'WEB',
    Language: 'en',
    Copyright: 'Public Domain',
    Testaments: [
      { Books: [] }, // OT
      { Books: [] }  // NT
    ]
  };

  let totalVerses = 0;

  // Process books in canonical order
  console.log('\nConverting books...');
  for (const englishName of BOOK_ORDER) {
    const mapping = ENGLISH_TO_FRENCH_BOOKS[englishName];
    if (!mapping) {
      console.warn(`  No mapping for ${englishName}, skipping`);
      continue;
    }

    const sourceBook = sourceData[englishName];
    if (!sourceBook) {
      console.warn(`  ${englishName} not found in source, skipping`);
      continue;
    }

    const targetBook: TargetBook = {
      Text: mapping.french, // Use French name for DB compatibility
      Chapters: []
    };

    // Get chapter numbers and sort numerically
    const chapterNums = Object.keys(sourceBook)
      .map(n => parseInt(n, 10))
      .sort((a, b) => a - b);

    let bookVerseCount = 0;

    for (const chapterNum of chapterNums) {
      const sourceChapter = sourceBook[chapterNum.toString()];
      const targetChapter: TargetChapter = { Verses: [] };

      // Get verse numbers and sort numerically
      const verseNums = Object.keys(sourceChapter)
        .map(n => parseInt(n, 10))
        .sort((a, b) => a - b);

      for (const verseNum of verseNums) {
        const verseText = sourceChapter[verseNum.toString()];
        const targetVerse: TargetVerse = { Text: verseText };

        // Add ID for verses after the first (matching existing format)
        if (verseNum > 1) {
          targetVerse.ID = verseNum;
        }

        targetChapter.Verses.push(targetVerse);
        bookVerseCount++;
      }

      targetBook.Chapters.push(targetChapter);
    }

    // Add to appropriate testament
    const testamentIndex = mapping.testament === 'OT' ? 0 : 1;
    output.Testaments[testamentIndex].Books.push(targetBook);

    totalVerses += bookVerseCount;
    console.log(`  ${mapping.french} (${englishName}): ${chapterNums.length} chapters, ${bookVerseCount} verses`);
  }

  // Write output
  console.log('\nWriting output file...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Summary
  const otBooks = output.Testaments[0].Books.length;
  const ntBooks = output.Testaments[1].Books.length;
  console.log('\n=== Conversion Complete ===');
  console.log(`  OT Books: ${otBooks}`);
  console.log(`  NT Books: ${ntBooks}`);
  console.log(`  Total Verses: ${totalVerses}`);
  console.log(`  Output: ${OUTPUT_FILE}`);
}

convertBible();
