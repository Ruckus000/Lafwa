import axios from 'axios';
import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://cesperance.com';
const BOOK_SLUG = 'chant-desperance';
const OUTPUT_FILE = 'src/assets/data/raw/hymn_index.json';

interface HymnIndexEntry {
  number: number;
  slug: string;
  title: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = 3): Promise<AxiosResponse<string>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Lafwa-HymnApp/1.0 (Personal hymn app for Haitian community)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout: 30000,
      }) as AxiosResponse<string>;
      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`  Retry ${attempt}/${retries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}

async function discoverHymns(): Promise<HymnIndexEntry[]> {
  console.log(`Fetching hymn index from ${BASE_URL}/book/${BOOK_SLUG}...\n`);

  const response = await fetchWithRetry(`${BASE_URL}/book/${BOOK_SLUG}`);
  const $ = cheerio.load(response.data);

  const hymns: HymnIndexEntry[] = [];

  // Find all hymn links - they follow pattern /book/chant-desperance/song/{slug}
  $('a[href*="/book/chant-desperance/song/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    // Extract slug from URL
    const slugMatch = href.match(/\/song\/([^/?]+)/);
    if (!slugMatch) return;
    const slug = slugMatch[1];

    // Get the title text from the link or its h3 child
    let titleText = $(el).find('h3').text().trim() || $(el).text().trim();
    if (!titleText) return;

    // Parse number and title from text like "0 Crions à Dieu" or "335 Je Viens, Seigneur"
    const numberMatch = titleText.match(/^(\d+)\s+(.+)$/);
    if (!numberMatch) {
      // Try alternate format without number prefix
      const altMatch = titleText.match(/^(.+)$/);
      if (altMatch) {
        // Try to extract number from slug
        const slugNumMatch = slug.match(/^(\d+)-/);
        if (slugNumMatch) {
          hymns.push({
            number: parseInt(slugNumMatch[1], 10),
            slug,
            title: altMatch[1].trim(),
          });
        }
      }
      return;
    }

    const number = parseInt(numberMatch[1], 10);
    const title = numberMatch[2].trim();

    // Avoid duplicates
    if (!hymns.some(h => h.number === number && h.slug === slug)) {
      hymns.push({ number, slug, title });
    }
  });

  // Sort by number
  hymns.sort((a, b) => a.number - b.number);

  return hymns;
}

async function main(): Promise<void> {
  console.log('=== Hymn URL Discovery (cesperance.com) ===\n');
  console.log('Target: Chant d\'Esperance hymnal only (V1 scope)\n');

  try {
    const hymns = await discoverHymns();

    // Save to file
    fs.mkdirSync('src/assets/data/raw', { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(hymns, null, 2));

    // Report
    console.log('\n=== Discovery Report ===');
    console.log(`Total hymns found: ${hymns.length}`);

    if (hymns.length > 0) {
      console.log(`Number range: ${hymns[0].number} - ${hymns[hymns.length - 1].number}`);

      // Check for gaps
      const numbers = new Set(hymns.map(h => h.number));
      const maxNum = Math.max(...numbers);
      const gaps: number[] = [];
      for (let i = 0; i <= maxNum; i++) {
        if (!numbers.has(i)) gaps.push(i);
      }
      if (gaps.length > 0 && gaps.length < 20) {
        console.log(`Missing numbers: ${gaps.join(', ')}`);
      } else if (gaps.length >= 20) {
        console.log(`Missing ${gaps.length} numbers (first 10: ${gaps.slice(0, 10).join(', ')}...)`);
      }
    }

    console.log(`\nOutput saved to: ${OUTPUT_FILE}`);

    // Show first few entries as sample
    console.log('\nSample entries:');
    hymns.slice(0, 5).forEach(h => {
      console.log(`  #${h.number}: "${h.title}" (${h.slug})`);
    });

  } catch (error) {
    console.error('Discovery failed:', (error as Error).message);
    process.exit(1);
  }
}

main();
