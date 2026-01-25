/**
 * Fix boilerplate in existing hymns data
 * 
 * Run: npx ts-node scripts/fix_boilerplate.ts
 * 
 * This removes the "Koleksyon chan ak kantik kretyen" boilerplate
 * from the first section of each hymn without re-scraping.
 */

import fs from 'fs';

const INPUT_FILE = 'src/assets/data/raw/hymns_final.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_final.json'; // Overwrite
const BACKUP_FILE = 'src/assets/data/raw/hymns_final.backup.json';

const BOILERPLATE_PATTERNS = [
  /koleksyon\s*chan/i,                    // Partial match  
  /collection\s+of\s+christian/i,
  /^chant\s*d[''']?esp/i,                 // Chant d'Esperance header
  /kantik\s+kretyen/i,                    // Christian hymns
];

function isBoilerplate(text: string | null): boolean {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return BOILERPLATE_PATTERNS.some(pattern => pattern.test(normalized));
}

interface HymnSection {
  type: 'verse' | 'refrain';
  number: number | null;
  order: number;
  text_fr: string | null;
  text_ht: string | null;
}

interface Hymn {
  number: number;
  slug: string;
  title_fr: string | null;
  title_ht: string | null;
  sections: HymnSection[];
  scraped_at: string;
  quality_score: number;
}

async function main(): Promise<void> {
  console.log('=== Boilerplate Removal Fix ===\n');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`Error: ${INPUT_FILE} not found`);
    process.exit(1);
  }

  // Backup first
  console.log(`Creating backup: ${BACKUP_FILE}`);
  fs.copyFileSync(INPUT_FILE, BACKUP_FILE);

  const hymns: Hymn[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`Loaded ${hymns.length} hymns\n`);

  let boilerplateRemoved = 0;
  let sectionsRemoved = 0;

  for (const hymn of hymns) {
    const originalCount = hymn.sections.length;

    // Filter out boilerplate sections
    hymn.sections = hymn.sections.filter(section => {
      const isFrBoilerplate = isBoilerplate(section.text_fr);
      const isHtBoilerplate = isBoilerplate(section.text_ht);

      // Remove if BOTH are boilerplate (or one is boilerplate and other is null/empty)
      if (isFrBoilerplate && (isHtBoilerplate || !section.text_ht)) {
        return false;
      }
      if (isHtBoilerplate && (isFrBoilerplate || !section.text_fr)) {
        return false;
      }

      return true;
    });

    // Reorder sections
    hymn.sections.forEach((s, i) => {
      s.order = i + 1;
    });

    const removed = originalCount - hymn.sections.length;
    if (removed > 0) {
      boilerplateRemoved++;
      sectionsRemoved += removed;
    }
  }

  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(hymns, null, 2));

  console.log('=== Results ===');
  console.log(`Hymns with boilerplate removed: ${boilerplateRemoved}`);
  console.log(`Total sections removed: ${sectionsRemoved}`);
  console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
  console.log(`Backup saved to: ${BACKUP_FILE}`);

  // Verify
  const after = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8')) as Hymn[];
  const stillHasBoilerplate = after.filter(h =>
    h.sections.some(s =>
      isBoilerplate(s.text_fr) || isBoilerplate(s.text_ht)
    )
  );

  if (stillHasBoilerplate.length > 0) {
    console.log(`\n⚠️ Warning: ${stillHasBoilerplate.length} hymns still have boilerplate`);
  } else {
    console.log('\n✅ All boilerplate removed successfully');
  }
}

main();
