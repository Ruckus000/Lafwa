/**
 * Lafwa Scraper Output Test Suite
 * 
 * Run: npx ts-node scripts/test_scraper_output.ts
 * 
 * This validates the scraped hymn data without manual intervention.
 * Exit code 0 = all critical tests pass
 * Exit code 1 = critical failures detected
 */

import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

// ============================================================================
// CONFIG
// ============================================================================

const PATHS = {
  hymnsIndex: 'src/assets/data/raw/hymn_index.json',
  hymnsRaw: 'src/assets/data/raw/hymns_raw.json',
  hymnsParsed: 'src/assets/data/raw/hymns_parsed.json',
  hymnsFinal: 'src/assets/data/raw/hymns_final.json',
  validationReport: 'src/assets/data/raw/validation_report.json',
  database: 'src/assets/lafwa.db',
};

const EXPECTATIONS = {
  minHymnCount: 300,           // Chant d'Espérance has ~336 hymns
  maxHymnCount: 400,
  minSectionsPerHymn: 1,
  maxSectionsPerHymn: 20,
  minAvgSections: 3,           // Most hymns have 3+ verses
};

// ============================================================================
// TYPES
// ============================================================================

interface HymnIndexEntry {
  number: number;
  slug: string;
  title: string;
}

interface HymnSection {
  type: 'verse' | 'refrain';
  number: number | null;
  order: number;
  text_fr: string | null;
  text_ht: string | null;
}

interface FinalHymn {
  number: number;
  slug: string;
  title_fr: string | null;
  title_ht: string | null;
  sections: HymnSection[];
  scraped_at: string;
  quality_score: number;
}

interface TestResult {
  name: string;
  category: 'critical' | 'warning' | 'info';
  passed: boolean;
  message: string;
  details?: any;
}

// ============================================================================
// TEST RUNNER
// ============================================================================

class TestRunner {
  private results: TestResult[] = [];

  add(result: TestResult): void {
    this.results.push(result);
    const icon = result.passed ? '✅' : (result.category === 'critical' ? '❌' : '⚠️');
    console.log(`${icon} [${result.category.toUpperCase()}] ${result.name}`);
    if (!result.passed) {
      console.log(`   ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 500)}`);
      }
    }
  }

  summarize(): { passed: boolean; criticalFailures: number; warnings: number } {
    const criticalFailures = this.results.filter(r => !r.passed && r.category === 'critical').length;
    const warnings = this.results.filter(r => !r.passed && r.category === 'warning').length;
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;

    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Critical failures: ${criticalFailures}`);
    console.log(`Warnings: ${warnings}`);
    console.log('='.repeat(60));

    return {
      passed: criticalFailures === 0,
      criticalFailures,
      warnings,
    };
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

// ============================================================================
// FILE EXISTENCE TESTS
// ============================================================================

function testFileExistence(runner: TestRunner): void {
  console.log('\n--- File Existence Tests ---\n');

  for (const [name, filepath] of Object.entries(PATHS)) {
    const exists = fs.existsSync(filepath);
    runner.add({
      name: `File exists: ${name}`,
      category: 'critical',
      passed: exists,
      message: exists ? '' : `Missing file: ${filepath}`,
    });
  }
}

// ============================================================================
// DATA COMPLETENESS TESTS
// ============================================================================

function testDataCompleteness(runner: TestRunner, hymns: FinalHymn[]): void {
  console.log('\n--- Data Completeness Tests ---\n');

  // Hymn count
  const hymnCount = hymns.length;
  runner.add({
    name: 'Hymn count within expected range',
    category: 'critical',
    passed: hymnCount >= EXPECTATIONS.minHymnCount && hymnCount <= EXPECTATIONS.maxHymnCount,
    message: `Found ${hymnCount} hymns, expected ${EXPECTATIONS.minHymnCount}-${EXPECTATIONS.maxHymnCount}`,
    details: { actual: hymnCount },
  });

  // Check for gaps in numbering
  const numbers = hymns.map(h => h.number).sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 0; i < numbers[numbers.length - 1]; i++) {
    if (!numbers.includes(i)) {
      gaps.push(i);
    }
  }
  runner.add({
    name: 'No gaps in hymn numbering',
    category: 'warning',
    passed: gaps.length === 0,
    message: `Found ${gaps.length} gaps in numbering`,
    details: { gaps: gaps.slice(0, 10), totalGaps: gaps.length },
  });

  // Check for duplicate numbers
  const duplicates = numbers.filter((num, i) => numbers.indexOf(num) !== i);
  runner.add({
    name: 'No duplicate hymn numbers',
    category: 'critical',
    passed: duplicates.length === 0,
    message: `Found ${duplicates.length} duplicate numbers`,
    details: { duplicates: duplicates.slice(0, 10) },
  });
}

// ============================================================================
// DATA QUALITY TESTS
// ============================================================================

function testDataQuality(runner: TestRunner, hymns: FinalHymn[]): void {
  console.log('\n--- Data Quality Tests ---\n');

  // Empty titles
  const emptyTitles = hymns.filter(h => !h.title_fr && !h.title_ht);
  runner.add({
    name: 'All hymns have at least one title',
    category: 'critical',
    passed: emptyTitles.length === 0,
    message: `${emptyTitles.length} hymns missing both titles`,
    details: { hymnNumbers: emptyTitles.map(h => h.number).slice(0, 10) },
  });

  // Empty sections
  const emptySections = hymns.filter(h => h.sections.length === 0);
  runner.add({
    name: 'All hymns have at least one section',
    category: 'critical',
    passed: emptySections.length === 0,
    message: `${emptySections.length} hymns have no sections`,
    details: { hymnNumbers: emptySections.map(h => h.number).slice(0, 10) },
  });

  // Average sections per hymn
  const avgSections = hymns.reduce((sum, h) => sum + h.sections.length, 0) / hymns.length;
  runner.add({
    name: 'Average sections per hymn is reasonable',
    category: 'warning',
    passed: avgSections >= EXPECTATIONS.minAvgSections,
    message: `Average ${avgSections.toFixed(1)} sections, expected >= ${EXPECTATIONS.minAvgSections}`,
    details: { averageSections: avgSections.toFixed(2) },
  });

  // Sections with empty text
  let emptySectionTexts = 0;
  hymns.forEach(h => {
    h.sections.forEach(s => {
      if (!s.text_fr && !s.text_ht) emptySectionTexts++;
    });
  });
  runner.add({
    name: 'All sections have at least one language text',
    category: 'critical',
    passed: emptySectionTexts === 0,
    message: `${emptySectionTexts} sections have no text in either language`,
  });

  // Boilerplate detection (should be 0% after validate.ts filters it)
  const boilerplatePatterns = [
    /koleksyon\s*chan/i,
    /kantik\s+kretyen/i,
  ];
  const hymnsWithBoilerplate = hymns.filter(h =>
    h.sections.some(s =>
      boilerplatePatterns.some(p => p.test(s.text_fr || '') || p.test(s.text_ht || ''))
    )
  );
  const boilerplateRatio = hymnsWithBoilerplate.length / hymns.length;
  runner.add({
    name: 'No boilerplate text in hymns',
    category: boilerplateRatio > 0.01 ? 'critical' : 'warning',  // Only critical if >1%
    passed: boilerplateRatio === 0,
    message: boilerplateRatio === 0 
      ? 'All boilerplate filtered successfully'
      : `${(boilerplateRatio * 100).toFixed(1)}% of hymns still contain boilerplate (${hymnsWithBoilerplate.length} hymns)`,
    details: boilerplateRatio > 0 ? { 
      hymnsWithBoilerplate: hymnsWithBoilerplate.length,
      hymnNumbers: hymnsWithBoilerplate.map(h => h.number).slice(0, 5),
    } : undefined,
  });

  // Quality score distribution
  const qualityScores = hymns.map(h => h.quality_score);
  const avgScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  const minScore = Math.min(...qualityScores);
  const maxScore = Math.max(...qualityScores);
  const allSameScore = minScore === maxScore;
  runner.add({
    name: 'Quality scores have variance',
    category: 'warning',
    passed: !allSameScore,
    message: allSameScore
      ? `All hymns have identical score (${minScore}). Validation may be too lenient.`
      : `Score range: ${minScore}-${maxScore}, avg: ${avgScore.toFixed(1)}`,
  });
}

// ============================================================================
// BILINGUAL TESTS
// ============================================================================

function testBilingual(runner: TestRunner, hymns: FinalHymn[]): void {
  console.log('\n--- Bilingual Content Tests (Known Limitation) ---\n');

  // Document the known limitation
  runner.add({
    name: 'Bilingual status documented',
    category: 'info',
    passed: true,
    message: 'KNOWN LIMITATION: cesperance.com serves identical FR/HT content. App will display same text for both languages.',
  });

  // Verify content exists in at least one language
  const hymnsWithContent = hymns.filter(h =>
    h.sections.some(s => (s.text_fr && s.text_fr.length > 20) || (s.text_ht && s.text_ht.length > 20))
  );
  runner.add({
    name: 'All hymns have content in at least one language',
    category: 'critical',
    passed: hymnsWithContent.length === hymns.length,
    message: `${hymnsWithContent.length}/${hymns.length} hymns have content`,
  });
}

// ============================================================================
// STRUCTURE TESTS
// ============================================================================

function testStructure(runner: TestRunner, hymns: FinalHymn[]): void {
  console.log('\n--- Structure Tests ---\n');

  // Section ordering
  const badOrdering = hymns.filter(h => {
    const orders = h.sections.map(s => s.order);
    for (let i = 1; i < orders.length; i++) {
      if (orders[i] <= orders[i - 1]) return true;
    }
    return false;
  });
  runner.add({
    name: 'Section ordering is sequential',
    category: 'warning',
    passed: badOrdering.length === 0,
    message: `${badOrdering.length} hymns have non-sequential section ordering`,
    details: { hymnNumbers: badOrdering.map(h => h.number).slice(0, 10) },
  });

  // Section types valid
  let invalidTypes = 0;
  hymns.forEach(h => {
    h.sections.forEach(s => {
      if (s.type !== 'verse' && s.type !== 'refrain') invalidTypes++;
    });
  });
  runner.add({
    name: 'All section types are valid (verse/refrain)',
    category: 'critical',
    passed: invalidTypes === 0,
    message: `${invalidTypes} sections have invalid types`,
  });

  // Refrain presence
  const hymnsWithRefrain = hymns.filter(h => h.sections.some(s => s.type === 'refrain'));
  const refrainRatio = hymnsWithRefrain.length / hymns.length;
  runner.add({
    name: 'Refrain detection rate',
    category: 'info',
    passed: true,
    message: `${(refrainRatio * 100).toFixed(1)}% of hymns have a refrain`,
    details: { hymnsWithRefrain: hymnsWithRefrain.length },
  });

  // Verse numbering
  const hymnsWithNumberedVerses = hymns.filter(h =>
    h.sections.some(s => s.type === 'verse' && s.number !== null)
  );
  const numberedRatio = hymnsWithNumberedVerses.length / hymns.length;
  runner.add({
    name: 'Verse numbering rate',
    category: 'info',
    passed: numberedRatio > 0.5,
    message: `${(numberedRatio * 100).toFixed(1)}% of hymns have numbered verses`,
  });
}

// ============================================================================
// ENCODING TESTS
// ============================================================================

function testEncoding(runner: TestRunner, hymns: FinalHymn[]): void {
  console.log('\n--- Encoding Tests ---\n');

  // Check for common encoding issues
  const encodingPatterns = [
    { pattern: /Ã©/g, issue: 'Mojibake for é' },
    { pattern: /Ã¨/g, issue: 'Mojibake for è' },
    { pattern: /Ã /g, issue: 'Mojibake for à' },
    { pattern: /â€™/g, issue: 'Mojibake for apostrophe' },
    { pattern: /â€"/g, issue: 'Mojibake for dash' },
    { pattern: /\uFFFD/g, issue: 'Replacement character' },
  ];

  const encodingIssues: Array<{ hymn: number; issue: string; sample: string }> = [];

  hymns.forEach(h => {
    const allText = [
      h.title_fr,
      h.title_ht,
      ...h.sections.map(s => s.text_fr),
      ...h.sections.map(s => s.text_ht),
    ].filter(Boolean).join(' ');

    encodingPatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(allText)) {
        const match = allText.match(pattern);
        encodingIssues.push({
          hymn: h.number,
          issue,
          sample: allText.substring(
            Math.max(0, allText.indexOf(match![0]) - 10),
            allText.indexOf(match![0]) + 20
          ),
        });
      }
    });
  });

  runner.add({
    name: 'No encoding issues (mojibake)',
    category: 'critical',
    passed: encodingIssues.length === 0,
    message: `Found ${encodingIssues.length} encoding issues`,
    details: { issues: encodingIssues.slice(0, 5) },
  });

  // Check for proper Kreyòl characters
  const kreyolChars = ['è', 'ò', 'à', 'é', 'ê', 'ô'];
  const hasKreyolChars = hymns.some(h => {
    const allText = [h.title_ht, ...h.sections.map(s => s.text_ht)].filter(Boolean).join('');
    return kreyolChars.some(char => allText.includes(char));
  });
  runner.add({
    name: 'Kreyòl accent characters present',
    category: 'info',
    passed: hasKreyolChars,
    message: hasKreyolChars ? 'Found Kreyòl accent characters' : 'No Kreyòl accent characters found',
  });
}

// ============================================================================
// DATABASE TESTS
// ============================================================================

async function testDatabase(runner: TestRunner): Promise<void> {
  console.log('\n--- Database Tests ---\n');

  if (!fs.existsSync(PATHS.database)) {
    runner.add({
      name: 'Database file exists',
      category: 'critical',
      passed: false,
      message: 'Database file not found',
    });
    return;
  }

  const db = new sqlite3.Database(PATHS.database, sqlite3.OPEN_READONLY);

  const query = (sql: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // Table existence
    const tables = await query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    const tableNames = tables.map((t: any) => t.name);

    const requiredTables = ['hymns', 'hymn_sections', 'bible_verses', 'bookmarks'];
    for (const table of requiredTables) {
      runner.add({
        name: `Table exists: ${table}`,
        category: 'critical',
        passed: tableNames.includes(table),
        message: tableNames.includes(table) ? '' : `Missing table: ${table}`,
      });
    }

    // FTS tables
    const ftsTables = ['bible_fts', 'hymns_fts', 'sections_fts'];
    for (const table of ftsTables) {
      runner.add({
        name: `FTS table exists: ${table}`,
        category: 'critical',
        passed: tableNames.includes(table),
        message: tableNames.includes(table) ? '' : `Missing FTS table: ${table}`,
      });
    }

    // Row counts
    const hymnCount = await query('SELECT COUNT(*) as count FROM hymns');
    runner.add({
      name: 'Hymns table has data',
      category: 'critical',
      passed: hymnCount[0].count > 0,
      message: `Hymns table has ${hymnCount[0].count} rows`,
    });

    const sectionCount = await query('SELECT COUNT(*) as count FROM hymn_sections');
    runner.add({
      name: 'Hymn sections table has data',
      category: 'critical',
      passed: sectionCount[0].count > 0,
      message: `Hymn sections table has ${sectionCount[0].count} rows`,
    });

    // FTS sync check
    const hymnsFtsCount = await query('SELECT COUNT(*) as count FROM hymns_fts');
    runner.add({
      name: 'Hymns FTS is synced',
      category: 'critical',
      passed: hymnsFtsCount[0].count === hymnCount[0].count,
      message: `FTS has ${hymnsFtsCount[0].count} rows, hymns has ${hymnCount[0].count}`,
    });

    // FTS search test
    const searchResult = await query("SELECT * FROM hymns_fts WHERE hymns_fts MATCH 'Dieu' LIMIT 5");
    runner.add({
      name: 'FTS search works (query: "Dieu")',
      category: 'critical',
      passed: searchResult.length > 0,
      message: searchResult.length > 0
        ? `Found ${searchResult.length} results`
        : 'No results for basic search',
    });

    // Accent search test
    const accentResult = await query("SELECT * FROM sections_fts WHERE sections_fts MATCH 'Jésus' LIMIT 5");
    runner.add({
      name: 'FTS accent search works (query: "Jésus")',
      category: 'warning',
      passed: accentResult.length > 0,
      message: accentResult.length > 0
        ? `Found ${accentResult.length} results`
        : 'No results - accent handling may need normalization',
    });

    // Foreign key integrity
    const orphanSections = await query(`
      SELECT COUNT(*) as count FROM hymn_sections 
      WHERE hymn_id NOT IN (SELECT id FROM hymns)
    `);
    runner.add({
      name: 'No orphan hymn sections',
      category: 'critical',
      passed: orphanSections[0].count === 0,
      message: `Found ${orphanSections[0].count} orphan sections`,
    });

  } catch (error) {
    runner.add({
      name: 'Database query execution',
      category: 'critical',
      passed: false,
      message: `Database error: ${(error as Error).message}`,
    });
  } finally {
    db.close();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('LAFWA SCRAPER OUTPUT TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const runner = new TestRunner();

  // 1. File existence
  testFileExistence(runner);

  // 2. Load data
  if (!fs.existsSync(PATHS.hymnsFinal)) {
    console.error('\nCannot continue: hymns_final.json not found');
    process.exit(1);
  }

  const hymns: FinalHymn[] = JSON.parse(fs.readFileSync(PATHS.hymnsFinal, 'utf-8'));

  // 3. Run test categories
  testDataCompleteness(runner, hymns);
  testDataQuality(runner, hymns);
  testBilingual(runner, hymns);
  testStructure(runner, hymns);
  testEncoding(runner, hymns);
  await testDatabase(runner);

  // 4. Summary
  const summary = runner.summarize();

  // 5. Write report
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    results: runner.getResults(),
  };

  const reportPath = 'src/assets/data/raw/test_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // 6. Exit code
  process.exit(summary.passed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
