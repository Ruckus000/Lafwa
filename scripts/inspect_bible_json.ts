import fs from 'fs';
import path from 'path';

const FR_PATH = 'src/assets/data/raw/french_bible.json';

const data = JSON.parse(fs.readFileSync(FR_PATH, 'utf-8'));

console.log('Root Keys:', Object.keys(data));
if (data.Testaments) {
    console.log('Testaments count:', data.Testaments.length);
    const ot = data.Testaments[0];
    console.log('Testament 1 Keys:', Object.keys(ot));
    if (ot.Books) {
        console.log('Books count:', ot.Books.length);
        const book = ot.Books[0];
        console.log('First Book Keys:', Object.keys(book));
        console.log('First Book Sample:', JSON.stringify(book, (key, value) => {
            if (key === 'Chapters') return '[Array]';
            return value;
        }, 2));
    }
}
