/**
 * Debug: Find the hymn with remaining boilerplate
 */
import fs from 'fs';

const HYMNS_FILE = 'src/assets/data/raw/hymns_final.json';

const boilerplatePatterns = [
  /koleksyon\s*chan/i,
  /kantik\s+kretyen/i,
];

interface Section {
  text_fr: string | null;
  text_ht: string | null;
}

interface Hymn {
  number: number;
  title_fr: string;
  sections: Section[];
}

const hymns: Hymn[] = JSON.parse(fs.readFileSync(HYMNS_FILE, 'utf-8'));

const matches = hymns.filter(h =>
  h.sections.some(s =>
    boilerplatePatterns.some(p => p.test(s.text_fr || '') || p.test(s.text_ht || ''))
  )
);

console.log(`Found ${matches.length} hymns with boilerplate:\n`);

matches.forEach(h => {
  console.log(`Hymn #${h.number}: ${h.title_fr}`);
  h.sections.forEach((s, i) => {
    const fr = s.text_fr || '';
    const ht = s.text_ht || '';
    boilerplatePatterns.forEach(p => {
      if (p.test(fr)) console.log(`  Section ${i + 1} FR matches: "${fr.substring(0, 80)}..."`);
      if (p.test(ht)) console.log(`  Section ${i + 1} HT matches: "${ht.substring(0, 80)}..."`);
    });
  });
});
