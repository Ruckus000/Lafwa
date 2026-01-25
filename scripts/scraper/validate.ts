import fs from 'fs';

const INPUT_FILE = 'src/assets/data/raw/hymns_raw.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_final.json';
const REVIEW_FILE = 'src/assets/data/raw/validation_review.json';
const REJECTED_FILE = 'src/assets/data/raw/validation_rejected.json';
const REPORT_FILE = 'src/assets/data/raw/validation_report.json';

// Quality thresholds
const PASS_THRESHOLD = 60;  // Lowered from 70 - short hymns (1 verse) are still valid
const REVIEW_THRESHOLD = 40;

interface HymnSection {
  type: 'verse' | 'refrain';
  number: number | null;
  order: number;
  text_fr: string | null;
  text_ht: string | null;
}

interface RawHymn {
  number: number;
  slug: string;
  title_fr: string | null;
  title_ht: string | null;
  sections: HymnSection[];
  scraped_at: string;
}

interface ValidatedHymn extends RawHymn {
  quality_score: number;
}

interface ValidationResult {
  score: number;
  issues: string[];
}

// Boilerplate patterns to filter (site headers, not actual lyrics)
const BOILERPLATE_PATTERNS = [
  /koleksyon\s*chan/i,                    // Partial match
  /collection\s+of\s+christian/i,
  /^chant\s*d[''']?esp/i,                 // Chant d'Esperance header
  /kantik\s+kretyen/i,                    // Christian hymns
];

function isBoilerplate(text: string | null): boolean {
  if (!text) return false;
  return BOILERPLATE_PATTERNS.some(p => p.test(text.trim()));
}

/**
 * Calculate quality score for a hymn
 *
 * Scoring:
 * +30 pts: Has at least 1 section with real content
 * +15 pts: Has title
 * +15 pts: Has 3+ sections (typical hymn structure)
 * +10 pts: Has refrain detected
 * +10 pts: No empty sections
 * +10 pts: Content is bilingual (FR ≠ HT) - BONUS
 * +10 pts: Has numbered verses
 *
 * Max: 100 pts
 */
function calculateQualityScore(hymn: RawHymn): ValidationResult {
  let score = 0;
  const issues: string[] = [];

  // Filter out boilerplate for scoring
  const realSections = hymn.sections?.filter(s => {
    const textFr = s.text_fr || '';
    const textHt = s.text_ht || '';
    return !isBoilerplate(textFr) && !isBoilerplate(textHt);
  }) || [];

  // +30: Has at least 1 real section
  if (realSections.length > 0) {
    score += 30;
  } else {
    issues.push('No sections found (or only boilerplate)');
  }

  // +15: Has title
  if (hymn.title_fr || hymn.title_ht) {
    score += 15;
  } else {
    issues.push('No title');
  }

  // +15: Has 3+ sections (typical hymn)
  if (realSections.length >= 3) {
    score += 15;
  } else if (realSections.length >= 2) {
    score += 8;
  } else {
    issues.push(`Only ${realSections.length} section(s)`);
  }

  // +10: Has refrain
  if (realSections.some(s => s.type === 'refrain')) {
    score += 10;
  }

  // +10: No empty sections
  const emptyCount = realSections.filter(
    s => (!s.text_fr || s.text_fr.length < 10) && (!s.text_ht || s.text_ht.length < 10)
  ).length;
  if (emptyCount === 0 && realSections.length > 0) {
    score += 10;
  } else if (emptyCount > 0) {
    issues.push(`${emptyCount} empty/short section(s)`);
  }

  // +10: Has content in at least one language
  const hasContent = realSections.some(s => 
    (s.text_fr && s.text_fr.length > 20) || (s.text_ht && s.text_ht.length > 20)
  );
  if (hasContent) {
    score += 10;
  }

  // +10: Has numbered verses
  const numberedVerses = realSections.filter(s => s.type === 'verse' && s.number !== null);
  if (numberedVerses.length >= 2) {
    score += 10;
  }

  return { score, issues };
}

function filterBoilerplate(hymn: RawHymn): RawHymn {
  const filteredSections = hymn.sections.filter(s => {
    // Remove section if both FR and HT are boilerplate (or one is boilerplate and other is empty)
    const frIsBoilerplate = isBoilerplate(s.text_fr);
    const htIsBoilerplate = isBoilerplate(s.text_ht);
    
    if (frIsBoilerplate && (htIsBoilerplate || !s.text_ht)) return false;
    if (htIsBoilerplate && (frIsBoilerplate || !s.text_fr)) return false;
    
    return true;
  });

  // Reorder sections
  filteredSections.forEach((s, i) => s.order = i + 1);

  return { ...hymn, sections: filteredSections };
}

async function main(): Promise<void> {
  console.log('=== Hymn Validation ===\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Raw hymns not found at ${INPUT_FILE}`);
    console.error('Please run scrape_content.ts first.');
    process.exit(1);
  }

  const rawHymns: RawHymn[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  
  // Filter boilerplate from all hymns first
  const hymns = rawHymns.map(filterBoilerplate);
  console.log(`Loaded ${hymns.length} hymns for validation (boilerplate filtered)\n`);

  const passed: ValidatedHymn[] = [];
  const review: ValidatedHymn[] = [];
  const rejected: Array<ValidatedHymn & { issues: string[] }> = [];

  for (const hymn of hymns) {
    const result = calculateQualityScore(hymn);
    const validatedHymn: ValidatedHymn = { ...hymn, quality_score: result.score };

    if (result.score >= PASS_THRESHOLD) {
      passed.push(validatedHymn);
    } else if (result.score >= REVIEW_THRESHOLD) {
      review.push(validatedHymn);
      console.log(`  Review: #${hymn.number} (score: ${result.score}) - ${result.issues.join(', ')}`);
    } else {
      rejected.push({ ...validatedHymn, issues: result.issues });
      console.log(`  Rejected: #${hymn.number} (score: ${result.score}) - ${result.issues.join(', ')}`);
    }
  }

  // Sort all by number
  passed.sort((a, b) => a.number - b.number);
  review.sort((a, b) => a.number - b.number);
  rejected.sort((a, b) => a.number - b.number);

  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(passed, null, 2));

  if (review.length > 0) {
    fs.writeFileSync(REVIEW_FILE, JSON.stringify(review, null, 2));
  }

  if (rejected.length > 0) {
    fs.writeFileSync(REJECTED_FILE, JSON.stringify(rejected, null, 2));
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    thresholds: {
      pass: PASS_THRESHOLD,
      review: REVIEW_THRESHOLD,
    },
    total_input: hymns.length,
    passed_count: passed.length,
    review_count: review.length,
    rejected_count: rejected.length,
    coverage: {
      range_0_100: passed.filter(h => h.number >= 0 && h.number <= 100).length,
      range_101_200: passed.filter(h => h.number >= 101 && h.number <= 200).length,
      range_201_300: passed.filter(h => h.number >= 201 && h.number <= 300).length,
      range_301_335: passed.filter(h => h.number >= 301 && h.number <= 335).length,
    },
    quality_breakdown: {
      high_90_plus: passed.filter(h => h.quality_score >= 90).length,
      good_70_89: passed.filter(h => h.quality_score >= 70 && h.quality_score < 90).length,
    },
    review_numbers: review.map(h => h.number),
    rejected_numbers: rejected.map(h => h.number),
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n=== Validation Report ===');
  console.log(`Passed (≥${PASS_THRESHOLD}):  ${passed.length}`);
  console.log(`Review (${REVIEW_THRESHOLD}-${PASS_THRESHOLD - 1}): ${review.length}`);
  console.log(`Rejected (<${REVIEW_THRESHOLD}): ${rejected.length}`);

  console.log('\nCoverage (passed hymns):');
  console.log(`  0-100:   ${report.coverage.range_0_100}`);
  console.log(`  101-200: ${report.coverage.range_101_200}`);
  console.log(`  201-300: ${report.coverage.range_201_300}`);
  console.log(`  301-335: ${report.coverage.range_301_335}`);

  console.log('\nQuality breakdown (passed):');
  console.log(`  High (90+):  ${report.quality_breakdown.high_90_plus}`);
  console.log(`  Good (70-89): ${report.quality_breakdown.good_70_89}`);

  console.log('\nOutput files:');
  console.log(`  Passed:   ${OUTPUT_FILE}`);
  if (review.length > 0) {
    console.log(`  Review:   ${REVIEW_FILE}`);
  }
  if (rejected.length > 0) {
    console.log(`  Rejected: ${REJECTED_FILE}`);
  }
  console.log(`  Report:   ${REPORT_FILE}`);
}

main();
