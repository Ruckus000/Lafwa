import axios from 'axios';
import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://cesperance.com';
const BOOK_SLUG = 'chant-desperance';
const INDEX_FILE = 'src/assets/data/raw/hymn_index.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_raw.json';
const CHECKPOINT_FILE = 'src/assets/data/raw/.scrape_checkpoint.json';
const ERRORS_FILE = 'src/assets/data/raw/scrape_errors.json';

const RATE_LIMIT_MS = 500;
const CHECKPOINT_INTERVAL = 50;

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

interface RawHymn {
  number: number;
  slug: string;
  title_fr: string | null;
  title_ht: string | null;
  sections: HymnSection[];
  scraped_at: string;
}

interface ScrapeError {
  number: number;
  slug: string;
  error: string;
  timestamp: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<AxiosResponse<string> | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Lafwa-HymnApp/1.0 (Personal hymn app for Haitian community)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'fr,ht;q=0.9',
        },
        timeout: 30000,
      }) as AxiosResponse<string>;
      return response;
    } catch (error) {
      const err = error as Error;
      if (attempt === retries) {
        console.error(`    Failed after ${retries} attempts: ${err.message}`);
        return null;
      }
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s exponential backoff
      console.log(`    Retry ${attempt}/${retries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  return null;
}

function parseTitle(html: string): string | null {
  const $ = cheerio.load(html);

  // Try h1 title
  let title = $('h1').first().text().trim();

  // Parse "NUMBER - TITLE | Book" format
  const match = title.match(/^\d+\s*[-–]\s*(.+?)(?:\s*\|.+)?$/);
  if (match) {
    return match[1].trim();
  }

  // Try title tag as fallback
  title = $('title').text().split('|')[0].trim();
  const titleMatch = title.match(/^\d+\s*[-–]\s*(.+)$/);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  return title || null;
}

function parseSections(html: string): Array<{ type: 'verse' | 'refrain'; number: number | null; text: string }> {
  const $ = cheerio.load(html);
  const sections: Array<{ type: 'verse' | 'refrain'; number: number | null; text: string }> = [];

  // Find the lyrics container
  const container = $('.lyrics-container').first();
  if (container.length === 0) {
    // Try alternate selectors
    const altContainer = $('div[class*="lyrics"]').first();
    if (altContainer.length === 0) return sections;
  }

  // Each section is wrapped in div.mb-6
  $('div.mb-6').each((_, sectionEl) => {
    const $section = $(sectionEl);

    // Get header (verse number or "Refrain")
    const header = $section.find('h3').first().text().trim();

    // Collect all lyrics lines
    const lines: string[] = [];
    $section.find('p').each((_, pEl) => {
      const line = $(pEl).text().trim();
      if (line) lines.push(line);
    });

    if (lines.length === 0) return;

    const text = lines.join('\n');

    // Determine section type
    if (/^refr/i.test(header) || /^chorus/i.test(header) || /^refrèn/i.test(header)) {
      sections.push({ type: 'refrain', number: null, text });
    } else {
      const verseNum = parseInt(header, 10);
      sections.push({
        type: 'verse',
        number: isNaN(verseNum) ? null : verseNum,
        text
      });
    }
  });

  return sections;
}

async function scrapeHymn(entry: HymnIndexEntry): Promise<RawHymn | null> {
  const baseUrl = `${BASE_URL}/book/${BOOK_SLUG}/song/${entry.slug}`;

  // Fetch French version
  console.log(`    Fetching French...`);
  const frResponse = await fetchWithRetry(`${baseUrl}?lang=fr`);
  await sleep(RATE_LIMIT_MS);

  // Fetch Kreyol version
  console.log(`    Fetching Kreyòl...`);
  const htResponse = await fetchWithRetry(`${baseUrl}?lang=ht`);
  await sleep(RATE_LIMIT_MS);

  if (!frResponse && !htResponse) {
    return null;
  }

  // Parse French
  let title_fr: string | null = null;
  let sectionsFr: Array<{ type: 'verse' | 'refrain'; number: number | null; text: string }> = [];

  if (frResponse) {
    title_fr = parseTitle(frResponse.data);
    sectionsFr = parseSections(frResponse.data);
  }

  // Parse Kreyol
  let title_ht: string | null = null;
  let sectionsHt: Array<{ type: 'verse' | 'refrain'; number: number | null; text: string }> = [];

  if (htResponse) {
    title_ht = parseTitle(htResponse.data);
    sectionsHt = parseSections(htResponse.data);
  }

  // Merge sections - use French as base structure
  const baseSections = sectionsFr.length > 0 ? sectionsFr : sectionsHt;
  const altSections = sectionsFr.length > 0 ? sectionsHt : [];

  const mergedSections: HymnSection[] = baseSections.map((section, i) => {
    const altSection = altSections[i];
    return {
      type: section.type,
      number: section.number,
      order: i + 1,
      text_fr: sectionsFr.length > 0 ? section.text : null,
      text_ht: sectionsFr.length > 0 ? (altSection?.text || null) : section.text,
    };
  });

  return {
    number: entry.number,
    slug: entry.slug,
    title_fr: title_fr || entry.title,
    title_ht,
    sections: mergedSections,
    scraped_at: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  console.log('=== Hymn Content Scraper (cesperance.com) ===\n');

  // Load index
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file not found at ${INDEX_FILE}`);
    console.error('Run discover_urls.ts first.');
    process.exit(1);
  }

  const index: HymnIndexEntry[] = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  console.log(`Loaded ${index.length} hymns from index\n`);

  // Load checkpoint if exists
  let results: RawHymn[] = [];
  let errors: ScrapeError[] = [];
  let startIndex = 0;

  if (fs.existsSync(CHECKPOINT_FILE)) {
    const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    results = checkpoint.results || [];
    errors = checkpoint.errors || [];
    startIndex = checkpoint.lastIndex + 1;
    console.log(`Resuming from checkpoint at hymn ${startIndex + 1}/${index.length}\n`);
  }

  // Load existing errors
  if (fs.existsSync(ERRORS_FILE)) {
    errors = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf-8'));
  }

  const total = index.length;

  for (let i = startIndex; i < index.length; i++) {
    const entry = index[i];
    console.log(`[${i + 1}/${total}] Scraping #${entry.number}: "${entry.title}"`);

    try {
      const hymn = await scrapeHymn(entry);

      if (hymn) {
        results.push(hymn);
        console.log(`    OK: ${hymn.sections.length} sections`);
      } else {
        errors.push({
          number: entry.number,
          slug: entry.slug,
          error: 'Both FR and HT fetches failed',
          timestamp: new Date().toISOString(),
        });
        console.log(`    FAILED: No content retrieved`);
      }
    } catch (error) {
      const err = error as Error;
      errors.push({
        number: entry.number,
        slug: entry.slug,
        error: err.message,
        timestamp: new Date().toISOString(),
      });
      console.log(`    ERROR: ${err.message}`);
    }

    // Save checkpoint periodically
    if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
        lastIndex: i,
        results,
        errors,
      }, null, 2));
      console.log(`\n  Checkpoint saved at ${i + 1}/${total}\n`);
    }
  }

  // Save final results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Save errors if any
  if (errors.length > 0) {
    fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2));
  }

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE);
  }

  // Report
  console.log('\n=== Scraping Complete ===');
  console.log(`Successful: ${results.length}/${total}`);
  console.log(`Failed: ${errors.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  if (errors.length > 0) {
    console.log(`\nErrors logged to: ${ERRORS_FILE}`);
    console.log('First 5 errors:');
    errors.slice(0, 5).forEach(e => {
      console.log(`  #${e.number}: ${e.error}`);
    });
  }
}

main();
