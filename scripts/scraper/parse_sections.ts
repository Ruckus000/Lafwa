import fs from 'fs';

const INPUT_FILE = 'src/assets/data/raw/hymns_raw.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_parsed.json';

interface ParsedHymn {
  number: number;
  title_fr?: string;
  title_ht?: string;
  category?: string;
  sections: ParsedSection[];
  quality_score: number;
  source_urls: string[];
}

interface ParsedSection {
  type: 'verse' | 'refrain' | 'bridge' | 'coda';
  number?: number;
  text_fr?: string;
  text_ht?: string;
  display_order: number;
}

// Section marker patterns
const VERSE_MARKERS = [
  /^(\d+)[\.\)\:]?\s*$/,           // "1." or "1)" or "1:" or just "1"
  /^(\d+)\s*[\.\)]/,               // "1. text..."
  /^Verset?\s*(\d+)/i,             // "Verse 1" or "Verset 1"
  /^Couplet\s*(\d+)/i,             // "Couplet 1"
];

const REFRAIN_MARKERS = [
  /^Refrain\s*:?$/i,
  /^Ref\.?\s*:?$/i,
  /^Kè\s*:?$/i,                    // Kreyol for "Chorus"
  /^Chorus\s*:?$/i,
  /^Rit\.?\s*:?$/i,
];

function parseContent(raw: string, language: 'fr' | 'ht' | 'unknown'): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  let currentSection: Partial<ParsedSection> | null = null;
  let currentLines: string[] = [];
  let displayOrder = 0;

  for (const line of lines) {
    // Check for verse marker
    let verseMatch: RegExpMatchArray | null = null;
    for (const pattern of VERSE_MARKERS) {
      verseMatch = line.match(pattern);
      if (verseMatch) break;
    }

    // Check for refrain marker
    const isRefrain = REFRAIN_MARKERS.some(p => p.test(line));

    if (verseMatch || isRefrain) {
      // Save previous section
      if (currentSection && currentLines.length > 0) {
        const text = currentLines.join('\n').trim();
        if (text.length > 10) { // Minimum content threshold
          sections.push({
            type: currentSection.type!,
            number: currentSection.number,
            display_order: displayOrder++,
            ...(language === 'ht' ? { text_ht: text } : { text_fr: text }),
          });
        }
      }

      // Start new section
      if (verseMatch) {
        currentSection = {
          type: 'verse',
          number: parseInt(verseMatch[1], 10),
        };
      } else {
        currentSection = {
          type: 'refrain',
        };
      }
      currentLines = [];

      // If line has more content after marker, add it
      let remainingContent = line;
      for (const pattern of VERSE_MARKERS) {
        remainingContent = remainingContent.replace(pattern, '');
      }
      for (const pattern of REFRAIN_MARKERS) {
        remainingContent = remainingContent.replace(pattern, '');
      }
      remainingContent = remainingContent.trim();
      if (remainingContent.length > 3) {
        currentLines.push(remainingContent);
      }
    } else if (currentSection) {
      // Skip obvious noise
      if (isNoiseLine(line)) continue;
      currentLines.push(line);
    } else {
      // No section started yet - might be intro or title repetition
      // Start implicit verse 1
      if (!isNoiseLine(line) && line.length > 20) {
        currentSection = { type: 'verse', number: 1 };
        currentLines.push(line);
      }
    }
  }

  // Don't forget last section
  if (currentSection && currentLines.length > 0) {
    const text = currentLines.join('\n').trim();
    if (text.length > 10) {
      sections.push({
        type: currentSection.type!,
        number: currentSection.number,
        display_order: displayOrder++,
        ...(language === 'ht' ? { text_ht: text } : { text_fr: text }),
      });
    }
  }

  return sections;
}

function isNoiseLine(line: string): boolean {
  const noisePatterns = [
    /^(bis|ter|\(bis\)|\(ter\))$/i,
    /^[\d\.\)\(]+$/,
    /^\*+$/,
    /^-+$/,
    /adoration et louange/i,
    /chant d'espérance/i,
    /chandesperans/i,
    /echo des elus/i,
  ];

  return (
    line.length < 3 ||
    noisePatterns.some(p => p.test(line.trim()))
  );
}

function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\s*[-–:.]?\s*/i, '')  // Remove leading number
    .replace(/\s*[-–:]\s*\d+\s*(CDF|CDK|Chan|Chant)[^]*/i, '') // Remove trailing identifiers
    .replace(/\s*\(CDF\)|\(CDK\)/gi, '')
    .replace(/Chant [dD]'?[EÉ]spérance (Français|Kreyòl|Creole)\s*:?\s*/gi, '')
    .replace(/Chan[tD]esperans?\s*(Kreyòl|Français|Creole)?\s*:?\s*/gi, '')
    .trim();
}

function calculateQualityScore(hymn: ParsedHymn): number {
  let score = 0;

  // Has at least one title
  if (hymn.title_fr || hymn.title_ht) score += 20;

  // Has multiple sections
  score += Math.min(hymn.sections.length * 10, 40);

  // Has refrain
  if (hymn.sections.some(s => s.type === 'refrain')) score += 15;

  // Has ordered verses
  const verses = hymn.sections.filter(s => s.type === 'verse');
  if (verses.length > 0 && verses.every((v, i) => v.number === i + 1)) {
    score += 15;
  }

  // Content length
  const totalLength = hymn.sections
    .map(s => (s.text_fr?.length || 0) + (s.text_ht?.length || 0))
    .reduce((a, b) => a + b, 0);
  if (totalLength > 200) score += 10;

  return score;
}

async function main(): Promise<void> {
  console.log('Parsing hymn sections...\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Raw hymns not found at ${INPUT_FILE}`);
    console.error('Please run scrape_content.ts first.');
    process.exit(1);
  }

  const rawHymns = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const parsedHymns: ParsedHymn[] = [];

  for (const raw of rawHymns) {
    console.log(`Parsing hymn #${raw.number}...`);

    const hymn: ParsedHymn = {
      number: raw.number,
      sections: [],
      quality_score: 0,
      source_urls: raw.urls_scraped,
    };

    // Process each variant and merge
    for (const variant of raw.variants) {
      const title = cleanTitle(variant.title);
      const sections = parseContent(variant.raw_content, variant.language_hint);

      // Set title by language
      if (variant.language_hint === 'fr' && !hymn.title_fr) {
        hymn.title_fr = title;
      } else if (variant.language_hint === 'ht' && !hymn.title_ht) {
        hymn.title_ht = title;
      } else if (!hymn.title_fr && !hymn.title_ht) {
        hymn.title_fr = title; // Default to French
      }

      // Merge sections (keep best per language)
      for (const section of sections) {
        const existing = hymn.sections.find(
          s => s.type === section.type && s.number === section.number
        );

        if (existing) {
          // Merge text
          if (section.text_fr && !existing.text_fr) {
            existing.text_fr = section.text_fr;
          }
          if (section.text_ht && !existing.text_ht) {
            existing.text_ht = section.text_ht;
          }
        } else {
          hymn.sections.push(section);
        }
      }
    }

    // Re-order sections
    hymn.sections.sort((a, b) => {
      if (a.type === 'verse' && b.type === 'refrain') return -1;
      if (a.type === 'refrain' && b.type === 'verse') return 1;
      return (a.number || 0) - (b.number || 0);
    });

    // Reassign display_order
    hymn.sections.forEach((s, i) => s.display_order = i);

    // Calculate quality
    hymn.quality_score = calculateQualityScore(hymn);

    parsedHymns.push(hymn);
  }

  // Sort by number
  parsedHymns.sort((a, b) => a.number - b.number);

  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parsedHymns, null, 2));

  // Report
  console.log('\nParsing Report:');
  console.log(`   Total hymns: ${parsedHymns.length}`);
  console.log(`   High quality (>70): ${parsedHymns.filter(h => h.quality_score > 70).length}`);
  console.log(`   Medium quality (40-70): ${parsedHymns.filter(h => h.quality_score >= 40 && h.quality_score <= 70).length}`);
  console.log(`   Low quality (<40): ${parsedHymns.filter(h => h.quality_score < 40).length}`);
  console.log(`\n   Output saved to: ${OUTPUT_FILE}`);
}

main();
