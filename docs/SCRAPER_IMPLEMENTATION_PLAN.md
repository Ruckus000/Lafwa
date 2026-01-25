# Chant d'Espérance Web Scraper Implementation Plan

## Problem Analysis

### Current Scraper Issues

| Issue | Example | Impact |
|-------|---------|--------|
| **Spam in results** | Entry #3 is "MP3 Lessons For Your iPad" | Garbage data in hymns table |
| **Duplicates** | #9, #19, #28, #45, #55 appear twice each | Presentation mode shows wrong content |
| **Boilerplate text** | "Welcome to Chandesperansonline.com!", PayPal buttons | Lyrics unreadable |
| **No structure** | "1", "Refrain" inline in flat text | Presentation mode impossible |
| **Missing hymns** | Only 29 entries, gaps everywhere | 96% incomplete |
| **Wrong discovery** | Category crawl finds blog posts | Non-hymn pages scraped |

### Root Cause

The current scraper uses **auto-discovery via WordPress categories**, which captures:
- Actual hymn pages ✓
- Blog posts about music ✗
- Product advertisements ✗
- Duplicate postings of same hymn ✗

---

## New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: URL Discovery                                      │
│  ├── Primary: Build index from known URL patterns            │
│  ├── Secondary: Crawl "Chant d'Espérance" category pages     │
│  └── Output: hymn_urls.json (number → URL mapping)           │
├─────────────────────────────────────────────────────────────┤
│  PHASE 2: Content Scraping                                   │
│  ├── Fetch each URL with retry logic                         │
│  ├── Extract: number, title, raw lyrics                      │
│  └── Output: hymns_raw.json                                  │
├─────────────────────────────────────────────────────────────┤
│  PHASE 3: Parsing & Cleaning                                 │
│  ├── Remove boilerplate (PayPal, Welcome, etc.)              │
│  ├── Parse sections (verse/refrain structure)                │
│  ├── Detect language (French vs Kreyòl)                      │
│  └── Output: hymns_parsed.json                               │
├─────────────────────────────────────────────────────────────┤
│  PHASE 4: Validation & Deduplication                         │
│  ├── Reject non-hymn content                                 │
│  ├── Merge duplicates (keep best quality)                    │
│  ├── Generate coverage report                                │
│  └── Output: hymns_final.json                                │
├─────────────────────────────────────────────────────────────┤
│  PHASE 5: Database Generation                                │
│  ├── Insert into hymns table                                 │
│  ├── Insert into hymn_sections table                         │
│  ├── Build FTS index                                         │
│  └── Output: content.db                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: URL Discovery

### Strategy: Pattern-Based Index Building

The site uses predictable URL patterns for hymns:

```typescript
// Observed patterns for actual hymn pages:
const HYMN_URL_PATTERNS = [
  // French hymns: "X-chant-desperance-francais-cdf-..."
  /\/(\d+)-chant-desperance-francais/i,
  /\/(\d+)-chant-d-esperance-francais/i,
  /\/(\d+)-cdf-/i,
  
  // Kreyòl hymns: "X-chandesperans-kreyol-cdk-..."
  /\/(\d+)-chandesperans-krey[oò]l/i,
  /\/(\d+)-cdk-/i,
  /\/(\d+)-chan-desperans/i,
  
  // Echo Des Elus (another hymnal)
  /\/(\d+)-echo-des-elus/i,
  
  // Generic numbered format
  /\/(\d+)-chant[s]?-d['\-]?espe/i,
];

// EXCLUSION patterns (blog posts, products):
const EXCLUDE_PATTERNS = [
  /mp3-lesson/i,
  /iphone|ipad|ipod/i,
  /download|subscribe/i,
  /paypal|buy-now|purchase/i,
  /flashcard/i,
  /a-cappella-interpretation/i,
  /brooklyn-youth-ministry/i,
];
```

### Implementation: `scripts/scraper/discover_urls.ts`

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const BASE_URL = 'https://chandesperansonline.com';
const OUTPUT_FILE = 'src/assets/data/raw/hymn_urls.json';

interface HymnUrlEntry {
  number: number;
  url: string;
  source: 'pattern' | 'category' | 'sitemap';
  language?: 'fr' | 'ht' | 'unknown';
}

const urlIndex: Map<number, HymnUrlEntry[]> = new Map();

// Step 1: Fetch sitemap and filter by pattern
async function discoverFromSitemap(): Promise<void> {
  console.log('📍 Discovering from sitemap...');
  
  const { data } = await axios.get(`${BASE_URL}/sitemap.xml`);
  const $ = cheerio.load(data, { xmlMode: true });
  
  $('url > loc').each((_, el) => {
    const url = $(el).text();
    
    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(p => p.test(url))) {
      return;
    }
    
    // Try to extract hymn number
    for (const pattern of HYMN_URL_PATTERNS) {
      const match = url.match(pattern);
      if (match) {
        const number = parseInt(match[1], 10);
        if (number >= 1 && number <= 1000) {
          addToIndex(number, url, 'pattern', detectLanguage(url));
        }
        break;
      }
    }
  });
}

// Step 2: Crawl category pages for hymns
async function discoverFromCategories(): Promise<void> {
  console.log('📍 Discovering from categories...');
  
  // Only crawl hymn-specific categories
  const hymnCategories = [
    '/category/chant-desperance-francais/',
    '/category/chant-desperance-creole/',
    '/category/echo-des-elus/',
    '/category/adoration-et-louange/',
  ];
  
  for (const category of hymnCategories) {
    await crawlCategoryPages(`${BASE_URL}${category}`);
  }
}

async function crawlCategoryPages(startUrl: string): Promise<void> {
  let currentUrl: string | null = startUrl;
  let pageCount = 0;
  const maxPages = 50; // Safety limit
  
  while (currentUrl && pageCount < maxPages) {
    console.log(`  Crawling: ${currentUrl}`);
    
    try {
      const { data } = await axios.get(currentUrl, {
        headers: { 'User-Agent': 'Lafwa-Scraper/1.0' },
        timeout: 10000,
      });
      
      const $ = cheerio.load(data);
      
      // Extract article links
      $('article a[href], h2.entry-title a, h3 a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !EXCLUDE_PATTERNS.some(p => p.test(href))) {
          tryAddUrl(href);
        }
      });
      
      // Find "next page" or "older posts" link
      currentUrl = $('a.next, .nav-previous a').attr('href') || null;
      pageCount++;
      
      // Polite delay
      await sleep(1000);
      
    } catch (error) {
      console.error(`  Error: ${(error as Error).message}`);
      currentUrl = null;
    }
  }
}

function tryAddUrl(url: string): void {
  for (const pattern of HYMN_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const number = parseInt(match[1], 10);
      if (number >= 1 && number <= 1000) {
        addToIndex(number, url, 'category', detectLanguage(url));
      }
      break;
    }
  }
}

function addToIndex(
  number: number, 
  url: string, 
  source: 'pattern' | 'category' | 'sitemap',
  language: 'fr' | 'ht' | 'unknown'
): void {
  if (!urlIndex.has(number)) {
    urlIndex.set(number, []);
  }
  
  const entries = urlIndex.get(number)!;
  
  // Don't add duplicates
  if (!entries.some(e => e.url === url)) {
    entries.push({ number, url, source, language });
  }
}

function detectLanguage(url: string): 'fr' | 'ht' | 'unknown' {
  if (/francais|français|cdf/i.test(url)) return 'fr';
  if (/kreyol|krey[oò]l|cdk|creole/i.test(url)) return 'ht';
  return 'unknown';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('🔍 Starting URL Discovery...\n');
  
  await discoverFromSitemap();
  await discoverFromCategories();
  
  // Convert to output format
  const output: Record<number, HymnUrlEntry[]> = {};
  for (const [num, entries] of urlIndex) {
    output[num] = entries;
  }
  
  // Save
  fs.mkdirSync('src/assets/data/raw', { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  
  // Report
  console.log('\n📊 Discovery Report:');
  console.log(`   Total hymn numbers found: ${urlIndex.size}`);
  console.log(`   Total URLs: ${[...urlIndex.values()].flat().length}`);
  
  // Show gaps
  const found = [...urlIndex.keys()].sort((a, b) => a - b);
  const missing: number[] = [];
  for (let i = 1; i <= 500; i++) {
    if (!urlIndex.has(i)) missing.push(i);
  }
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing numbers (1-500): ${missing.slice(0, 20).join(', ')}...`);
  }
}

main();
```

---

## Phase 2: Content Scraping

### Implementation: `scripts/scraper/scrape_content.ts`

```typescript
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const URL_INDEX = 'src/assets/data/raw/hymn_urls.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_raw.json';
const CHECKPOINT_FILE = 'src/assets/data/raw/.scrape_checkpoint.json';

interface RawHymn {
  number: number;
  urls_scraped: string[];
  variants: RawHymnVariant[];
}

interface RawHymnVariant {
  url: string;
  title: string;
  raw_content: string;
  language_hint: 'fr' | 'ht' | 'unknown';
  scraped_at: string;
}

// Boilerplate patterns to remove BEFORE parsing
const BOILERPLATE_PATTERNS = [
  /Welcome to Chandesperansonline\.com![^]*?Online\n?/gi,
  /View original post[^]*?words?/gi,
  /\*{3,}[^]*?Paypal[^]*?\*{3,}/gi,
  /Support our ChandesperansOnline Ministry[^]*/gi,
  /Buy Now From CCNow[^]*?Quantity/gi,
  /Disc ID:[^]*?Quantity/gi,
  /Favorite hymn![^]*?Haiti\./gi,
  /Purchase a PDF copy[^]*?account:/gi,
  /Sign up at http[^\n]*/gi,
  /http:\/\/[^\s]+/gi, // Remove URLs
  /\[.*?\]/g, // Remove WordPress shortcodes
];

async function scrapeHymn(urls: string[]): Promise<RawHymnVariant[]> {
  const variants: RawHymnVariant[] = [];
  
  for (const url of urls) {
    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Lafwa-Scraper/1.0' },
        timeout: 15000,
      });
      
      const $ = cheerio.load(data);
      
      // Extract title
      let title = $('h1.entry-title').text().trim();
      if (!title) title = $('h2.entry-title').text().trim();
      if (!title) title = $('title').text().split('|')[0].trim();
      
      // Extract content
      let contentDiv = $('.entry-content');
      if (contentDiv.length === 0) contentDiv = $('article');
      
      // Remove non-content elements
      contentDiv.find('script, style, .sharedaddy, .jp-relatedposts, iframe, img').remove();
      
      // Get text content
      let raw_content = contentDiv.text();
      
      // Apply boilerplate removal
      for (const pattern of BOILERPLATE_PATTERNS) {
        raw_content = raw_content.replace(pattern, '');
      }
      
      // Clean up whitespace
      raw_content = raw_content
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
      
      const language_hint = detectLanguageFromContent(raw_content, title);
      
      variants.push({
        url,
        title,
        raw_content,
        language_hint,
        scraped_at: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error(`  ❌ Failed to scrape ${url}: ${(error as Error).message}`);
    }
    
    // Polite delay
    await sleep(500);
  }
  
  return variants;
}

function detectLanguageFromContent(content: string, title: string): 'fr' | 'ht' | 'unknown' {
  const combined = `${title} ${content}`.toLowerCase();
  
  // Kreyòl indicators
  const kreyolWords = ['mwen', 'nou', 'pou', 'nan', 'li', 'yo', 'ak', 'se', 'pa', 'te'];
  const kreyolCount = kreyolWords.filter(w => combined.includes(` ${w} `)).length;
  
  // French indicators  
  const frenchWords = ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'que', 'qui'];
  const frenchCount = frenchWords.filter(w => combined.includes(` ${w} `)).length;
  
  if (kreyolCount > frenchCount + 2) return 'ht';
  if (frenchCount > kreyolCount + 2) return 'fr';
  
  // Fallback to title
  if (/krey[oò]l|cdk|kreyol/i.test(title)) return 'ht';
  if (/fran[cç]ais|cdf/i.test(title)) return 'fr';
  
  return 'unknown';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  console.log('🔄 Starting Content Scraping...\n');
  
  // Load URL index
  const urlIndex = JSON.parse(fs.readFileSync(URL_INDEX, 'utf-8'));
  const hymnNumbers = Object.keys(urlIndex).map(Number).sort((a, b) => a - b);
  
  // Load checkpoint if exists
  let checkpoint: Set<number> = new Set();
  let results: RawHymn[] = [];
  
  if (fs.existsSync(CHECKPOINT_FILE)) {
    const checkpointData = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf-8'));
    checkpoint = new Set(checkpointData.completed);
    results = checkpointData.results;
    console.log(`📌 Resuming from checkpoint (${checkpoint.size} already done)\n`);
  }
  
  let processed = 0;
  
  for (const num of hymnNumbers) {
    if (checkpoint.has(num)) continue;
    
    const urls = urlIndex[num].map((e: any) => e.url);
    console.log(`[${++processed}/${hymnNumbers.length}] Scraping hymn #${num} (${urls.length} URLs)`);
    
    const variants = await scrapeHymn(urls);
    
    if (variants.length > 0) {
      results.push({
        number: num,
        urls_scraped: urls,
        variants,
      });
    }
    
    checkpoint.add(num);
    
    // Save checkpoint every 10 hymns
    if (processed % 10 === 0) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({
        completed: [...checkpoint],
        results,
      }, null, 2));
      console.log('  💾 Checkpoint saved');
    }
  }
  
  // Final save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  if (fs.existsSync(CHECKPOINT_FILE)) {
    fs.unlinkSync(CHECKPOINT_FILE); // Remove checkpoint
  }
  
  console.log(`\n✅ Done! Scraped ${results.length} hymns to ${OUTPUT_FILE}`);
}

main();
```

---

## Phase 3: Parsing & Cleaning

### Implementation: `scripts/scraper/parse_sections.ts`

```typescript
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
  /^Kè\s*:?$/i,                    // Kreyòl for "Chorus"
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
      const remainingContent = line
        .replace(VERSE_MARKERS[0], '')
        .replace(REFRAIN_MARKERS[0], '')
        .trim();
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
  console.log('🔧 Parsing hymn sections...\n');
  
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
  console.log('\n📊 Parsing Report:');
  console.log(`   Total hymns: ${parsedHymns.length}`);
  console.log(`   High quality (>70): ${parsedHymns.filter(h => h.quality_score > 70).length}`);
  console.log(`   Medium quality (40-70): ${parsedHymns.filter(h => h.quality_score >= 40 && h.quality_score <= 70).length}`);
  console.log(`   Low quality (<40): ${parsedHymns.filter(h => h.quality_score < 40).length}`);
}

main();
```

---

## Phase 4: Validation & Deduplication

### Implementation: `scripts/scraper/validate.ts`

```typescript
import fs from 'fs';

const INPUT_FILE = 'src/assets/data/raw/hymns_parsed.json';
const OUTPUT_FILE = 'src/assets/data/raw/hymns_final.json';
const REPORT_FILE = 'src/assets/data/raw/validation_report.json';

function validateHymn(hymn: any): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // 1. Must have a valid number
  if (!hymn.number || hymn.number < 1 || hymn.number > 1000) {
    issues.push('Invalid hymn number');
  }
  
  // 2. Must have at least one title
  if (!hymn.title_fr && !hymn.title_ht) {
    issues.push('No title in any language');
  }
  
  // 3. Must have at least one section with content
  if (!hymn.sections || hymn.sections.length === 0) {
    issues.push('No sections');
  } else {
    const hasContent = hymn.sections.some(
      (s: any) => (s.text_fr?.length > 20) || (s.text_ht?.length > 20)
    );
    if (!hasContent) {
      issues.push('Sections have no substantial content');
    }
  }
  
  // 4. Title should not be spam
  const combinedTitle = `${hymn.title_fr || ''} ${hymn.title_ht || ''}`.toLowerCase();
  const spamKeywords = ['mp3', 'iphone', 'ipad', 'download', 'subscribe', 'lesson', 'paypal', 'buy'];
  if (spamKeywords.some(kw => combinedTitle.includes(kw))) {
    issues.push('Title contains spam keywords');
  }
  
  // 5. Quality score threshold
  if (hymn.quality_score < 30) {
    issues.push(`Quality score too low (${hymn.quality_score})`);
  }
  
  return { passed: issues.length === 0, issues };
}

async function main(): Promise<void> {
  console.log('✅ Validating hymns...\n');
  
  const hymns = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  
  const valid: any[] = [];
  const rejected: any[] = [];
  const duplicateNumbers = new Map<number, any[]>();
  
  // First pass: validate and group by number
  for (const hymn of hymns) {
    const result = validateHymn(hymn);
    
    if (result.passed) {
      if (!duplicateNumbers.has(hymn.number)) {
        duplicateNumbers.set(hymn.number, []);
      }
      duplicateNumbers.get(hymn.number)!.push(hymn);
    } else {
      rejected.push({
        number: hymn.number,
        title: hymn.title_fr || hymn.title_ht,
        issues: result.issues,
      });
    }
  }
  
  // Second pass: deduplicate (keep highest quality)
  for (const [number, variants] of duplicateNumbers) {
    if (variants.length === 1) {
      valid.push(variants[0]);
    } else {
      // Sort by quality, keep best
      variants.sort((a, b) => b.quality_score - a.quality_score);
      const best = variants[0];
      
      // Try to merge bilingual content from others
      for (let i = 1; i < variants.length; i++) {
        const other = variants[i];
        if (!best.title_ht && other.title_ht) best.title_ht = other.title_ht;
        if (!best.title_fr && other.title_fr) best.title_fr = other.title_fr;
      }
      
      valid.push(best);
      console.log(`  ⚠️ Hymn #${number}: merged ${variants.length} variants`);
    }
  }
  
  // Sort by number
  valid.sort((a, b) => a.number - b.number);
  
  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(valid, null, 2));
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    total_input: hymns.length,
    valid_count: valid.length,
    rejected_count: rejected.length,
    rejected_details: rejected,
  };
  
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 Validation Report:');
  console.log(`   Valid hymns: ${valid.length}`);
  console.log(`   Rejected: ${rejected.length}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

main();
```

---

## Execution Order

```bash
# Step 1: Discover all hymn URLs
npx ts-node scripts/scraper/discover_urls.ts

# Step 2: Scrape content (resumable)
npx ts-node scripts/scraper/scrape_content.ts

# Step 3: Parse into structured sections
npx ts-node scripts/scraper/parse_sections.ts

# Step 4: Validate and deduplicate
npx ts-node scripts/scraper/validate.ts

# Step 5: Generate database (use existing generate_content_db.ts)
npx ts-node scripts/generate_content_db.ts
```

---

## Expected Output

After running the full pipeline:

```
📊 Final Report:
   Total hymns: 650+
   Coverage 1-100: 85%+
   Coverage 101-200: 70%+
   With French: 600+
   With Kreyòl: 150+
   Avg sections per hymn: 4-5
   Quality score >70: 80%+
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Site blocks scraper | Polite delays (1s), real User-Agent, checkpoint resume |
| Site structure changes | Pattern-based extraction, fallback selectors |
| Missing hymns | Report gaps, allow manual addition via JSON |
| Wrong verse/refrain detection | Quality scoring, manual review of low-score hymns |
| Content quality varies | Merge multiple sources, keep highest quality |

---

## Timeline

| Phase | Estimated Time |
|-------|----------------|
| URL Discovery | 2-3 hours (one-time) |
| Content Scraping | 4-6 hours (800+ URLs at 500ms each + failures) |
| Parsing | < 1 minute |
| Validation | < 1 minute |
| DB Generation | < 1 minute |
| **Total** | **~8 hours (mostly waiting)** |

---

## Files to Create

```
scripts/scraper/
├── discover_urls.ts           # Phase 1
├── scrape_content.ts          # Phase 2
├── parse_sections.ts          # Phase 3
├── validate.ts                # Phase 4
└── index.ts                   # Run all phases

src/assets/data/raw/
├── hymn_urls.json             # URL index
├── hymns_raw.json             # Raw scraped content
├── hymns_parsed.json          # Structured sections
├── hymns_final.json           # Validated & deduplicated
└── validation_report.json     # Coverage report
```
