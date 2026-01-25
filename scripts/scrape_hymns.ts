import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SITEMAP_PATH = path.join(process.cwd(), 'sitemap.xml');
const OUTPUT_PATH = path.join(process.cwd(), 'src/assets/data/raw/hymns.json');
const CONCURRENCY = 5;

interface Hymn {
    number: number;
    title: string;
    lyrics: string;
    url: string;
}

async function parseSitemap(): Promise<string[]> {
    const xml = fs.readFileSync(SITEMAP_PATH, 'utf-8');
    const $ = cheerio.load(xml, { xmlMode: true });
    const urls: string[] = [];
    $('url > loc').each((i, el) => {
        urls.push($(el).text());
    });
    return urls;
}

function filterHymnUrls(urls: string[]): string[] {
    return urls.filter(url => {
        // Filter for likely hymn pages
        return url.includes('chant-desperance') || (/\/\d+-/.test(url) && !url.includes('flashcard'));
    });
}

// Helper to clean and extract lyrics
function extractLyrics($: any, contentDiv: any): string {
    contentDiv.find('script, style, .sharedaddy, .wpcnt, .jp-relatedposts, #jp-post-flair').remove();
    let lyrics = '';
    contentDiv.find('p, div, br').each((i: number, el: any) => {
        if (el.tagName === 'br') {
            lyrics += '\n';
        } else {
            const text = $(el).text().trim();
            // FILTER: content that looks like nav links or dates
            if (text && !text.match(/Previous Post|Next Post|Jul|Jan|Feb|Mar|Apr|May|Jun|Aug|Sep|Oct|Nov|Dec/i)) {
                lyrics += text + '\n';
            }
        }
    });
    return lyrics.trim();
}

async function scrapeHymn(url: string): Promise<Hymn | null> {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(data);

        // Extract Title
        let title = $('h1.entry-title, h2.entry-title').text().trim();
        if (!title) title = $('h1').first().text().trim();
        if (!title) title = $('title').text().split('|')[0].trim();

        // Extract Number
        let number = 0;
        // 1. Starts with number
        let numMatch = title.match(/^(\d+)/);
        // 2. Number followed by key terms (e.g. "Title - 63 Chandesperans")
        if (!numMatch) numMatch = title.match(/(\d+)\s*(?:Chan|Chants|CDF|CDK|Echo|Melodies)/i);
        // 3. Number in parens "Title (23)"
        if (!numMatch) numMatch = title.match(/\((\d+)\)/);

        if (numMatch) {
            number = parseInt(numMatch[1], 10);
        } else {
            // 4. Fallback to URL Slug
            const slug = url.split('/').filter(Boolean).pop() || '';
            const urlMatch = slug.match(/-(\d+)-/) || slug.match(/(\d+)-/) || slug.match(/-(\d+)/);
            // Try to find standalone number or number bounded by hyphens
            if (urlMatch) number = parseInt(urlMatch[1], 10);
        }

        if (number === 0) {
            // Try searching text for "No X"
            const text = $('body').text();
            const internalMatch = text.match(/No\s*\.?\s*(\d+)/i);
            if (internalMatch) number = parseInt(internalMatch[1], 10);
            else {
                // If we still can't find a number, we might just use a hash or skip
                // For now, let's skip only if we really can't find anything, but maybe we default to a large number?
                // Let's rely on strict number for now.
                console.log(`Skipping (no number): ${url} (Title: ${title})`);
                return null;
            }
        }

        // Selectors
        let contentDiv = $('.entry-content');
        if (contentDiv.length === 0) contentDiv = $('.post-content');
        if (contentDiv.length === 0) contentDiv = $('article');
        if (contentDiv.length === 0) contentDiv = $('.entry'); // Added .entry

        let lyrics = extractLyrics($, contentDiv);

        if (lyrics.length < 20) { // Lowered threshold
            console.log(`Skipping (too short): ${url}`);
            return null;
        }

        return { number, title, lyrics, url };

    } catch (error) {
        console.error(`Error scraping ${url}:`, (error as any).message);
        return null;
    }
}

async function discoverCategories(): Promise<string[]> {
    console.log('Discovering categories from homepage...');
    try {
        const { data } = await axios.get('https://chandesperansonline.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const $ = cheerio.load(data);
        const cats: Set<string> = new Set();
        $('.widget_categories a').each((_: number, el: any) => {
            const href = $(el).attr('href');
            if (href) cats.add(href);
        });
        return Array.from(cats);
    } catch (e) {
        console.error('Failed to discover categories:', (e as any).message);
        return [];
    }
}

async function crawlCategory(categoryUrl: string): Promise<string[]> {
    const hymnUrls: Set<string> = new Set();
    let nextUrl: string | null = categoryUrl;

    while (nextUrl) {
        console.log(`Crawling category page: ${nextUrl}`);
        try {
            const response: any = await axios.get(nextUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
            });
            const $: any = cheerio.load(response.data);

            // Extract post links (found h3 > a in inspection)
            $('h3 a, h2.entry-title a, h1.entry-title a').each((_: number, el: any) => {
                const href = $(el).attr('href');
                if (href) hymnUrls.add(href);
            });

            // Find next page link
            // nav-previous usually points to OLDER posts (which is what we want for pagination)
            const nextLink: any = $('div.nav-previous a').attr('href') || $('a.next.page-numbers').attr('href');
            nextUrl = nextLink ? nextLink : null;

            // Polite delay
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`Error crawling ${nextUrl}:`, (error as any).message);
            nextUrl = null;
        }
    }
    return Array.from(hymnUrls);
}

async function main() {
    console.log('Starting Auto-Discovery Crawler...');

    // 1. Discover Categories
    let catUrls = await discoverCategories();
    console.log(`Discovered ${catUrls.length} categories.`);

    // 2. Crawl Categories
    let allHymnUrls: string[] = [];
    for (const catUrl of catUrls) {
        const urls = await crawlCategory(catUrl);
        console.log(`Found ${urls.length} hymns in ${catUrl}`);
        allHymnUrls = allHymnUrls.concat(urls);
    }

    // Deduplicate
    allHymnUrls = [...new Set(allHymnUrls)];
    console.log(`Total unique hymn URLs found: ${allHymnUrls.length}`);

    // 3. Scrape Hymns
    const hymns: Hymn[] = [];
    for (let i = 0; i < allHymnUrls.length; i += CONCURRENCY) {
        const chunk = allHymnUrls.slice(i, i + CONCURRENCY);
        const promises = chunk.map(url => scrapeHymn(url));
        const results = await Promise.all(promises);

        results.forEach(h => {
            if (h) hymns.push(h);
        });

        console.log(`Processed ${Math.min(i + CONCURRENCY, allHymnUrls.length)}/${allHymnUrls.length}. Collected: ${hymns.length}`);

        // Polite delay
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Sort by number
    hymns.sort((a: any, b: any) => a.number - b.number);

    console.log(`Saving ${hymns.length} hymns to ${OUTPUT_PATH}...`);
    // Ensure directory exists
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(hymns, null, 2));
    console.log('Done!');
}

main();
