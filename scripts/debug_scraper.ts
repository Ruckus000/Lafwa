import axios from 'axios';
import * as cheerio from 'cheerio';

const URL = 'https://chandesperansonline.com/2018/05/20/la-fwa-ban-nou-la-viktwa-63-chandesperans-kk/';

async function debug() {
    console.log(`Debugging ${URL}...`);
    const { data } = await axios.get(URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
    });
    const $ = cheerio.load(data);

    const title = $('h1.entry-title').text().trim() || $('h1').first().text().trim();
    console.log(`Title: "${title}"`);

    // Title regex check
    const numMatchStart = title.match(/^(\d+)/);
    console.log(`Title Match (Start):`, numMatchStart);

    const numMatchEnd = title.match(/(\d+)\s*$/); // Number at end?
    console.log(`Title Match (End):`, numMatchEnd);

    // URL Regex check
    const slug = URL.split('/').filter(Boolean).pop();
    console.log(`Slug: ${slug}`);
    const slugMatch = slug?.match(/(\d+)/);
    console.log(`Slug Match:`, slugMatch);

    // Content Check
    let contentDiv = $('.entry-content');
    if (contentDiv.length === 0) contentDiv = $('.post-content');
    if (contentDiv.length === 0) contentDiv = $('article');

    console.log(`Content Divs Found: ${contentDiv.length}`);
    const text = contentDiv.text().trim();
    console.log(`Content Length: ${text.length}`);
    console.log(`Sample: ${text.substring(0, 100)}`);
}

debug();
