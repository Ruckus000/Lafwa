import fs from 'fs';

const INPUT_FILE = 'src/assets/data/raw/hymns_raw.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_final.json';
const REVIEW_FILE = 'src/assets/data/raw/validation_review.json';
const REJECTED_FILE = 'src/assets/data/raw/validation_rejected.json';
const REPORT_FILE = 'src/assets/data/raw/validation_report.json';

// Quality thresholds
const PASS_THRESHOLD = 70;
const REVIEW_THRESHOLD = 50;

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

/**
 * Calculate quality score for a hymn
 *
 * Scoring:
 * +40 pts: Has at least 1 section
 * +20 pts: Has title in both languages
 * +20 pts: Has content in both languages
 * +10 pts: Section count matches between FR/HT
 * +10 pts: No empty sections
 */
function calculateQualityScore(hymn: RawHymn): ValidationResult {
  let score = 0;
  const issues: string[] = [];

  // +40: Has at least 1 section
  if (hymn.sections && hymn.sections.length > 0) {
    score += 40;
  } else {
    issues.push('No sections found');
  }

  // +20: Has title in both languages
  if (hymn.title_fr && hymn.title_ht) {
    score += 20;
  } else if (hymn.title_fr || hymn.title_ht) {
    score += 10; // Partial credit
    issues.push(`Missing ${!hymn.title_fr ? 'French' : 'Kreyol'} title`);
  } else {
    issues.push('No title in any language');
  }

  // +20: Has content in both languages
  if (hymn.sections && hymn.sections.length > 0) {
    const hasFrContent = hymn.sections.some(s => s.text_fr && s.text_fr.length > 10);
    const hasHtContent = hymn.sections.some(s => s.text_ht && s.text_ht.length > 10);

    if (hasFrContent && hasHtContent) {
      score += 20;
    } else if (hasFrContent || hasHtContent) {
      score += 10; // Partial credit
      issues.push(`Missing ${!hasFrContent ? 'French' : 'Kreyol'} content`);
    } else {
      issues.push('No substantial content in any language');
    }
  }

  // +10: Section count matches (both languages have same structure)
  if (hymn.sections && hymn.sections.length > 0) {
    const frSections = hymn.sections.filter(s => s.text_fr && s.text_fr.length > 0).length;
    const htSections = hymn.sections.filter(s => s.text_ht && s.text_ht.length > 0).length;

    if (frSections > 0 && htSections > 0 && frSections === htSections) {
      score += 10;
    } else if (frSections > 0 && htSections > 0) {
      issues.push(`Section count mismatch: FR=${frSections}, HT=${htSections}`);
    }
  }

  // +10: No empty sections
  if (hymn.sections && hymn.sections.length > 0) {
    const emptyCount = hymn.sections.filter(
      s => (!s.text_fr || s.text_fr.length < 5) && (!s.text_ht || s.text_ht.length < 5)
    ).length;

    if (emptyCount === 0) {
      score += 10;
    } else {
      issues.push(`${emptyCount} empty section(s)`);
    }
  }

  return { score, issues };
}

async function main(): Promise<void> {
  console.log('=== Hymn Validation ===\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: Raw hymns not found at ${INPUT_FILE}`);
    console.error('Please run scrape_content.ts first.');
    process.exit(1);
  }

  const hymns: RawHymn[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${hymns.length} hymns for validation\n`);

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
