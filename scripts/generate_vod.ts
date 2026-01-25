import fs from 'fs';
import path from 'path';

const OUTPUT = path.join(process.cwd(), 'src/assets/data/vod-map.json');

const books = ['Jenèz', 'Egzòd', 'Levitik', 'Nonb', 'Deteronòm', 'Jozye', 'Jij', 'Rit', '1 Samyèl', '2 Samyèl', '1 Wa', '2 Wa', 'Ezayi', 'Jeremi', 'Ezekyèl', 'Danyèl', 'Oze', 'Jowèl', 'Amòs', 'Abdias', 'Jonas', 'Miche', 'Nayoum', 'Abakik', 'Sofoni', 'Aje', 'Zakari', 'Malachi', 'Matye', 'Mak', 'Lik', 'Jan', 'Travay', 'Romen', '1 Korent', '2 Korent', 'Galat', 'Efezyen', 'Filip', 'Kolosyen', '1 Tesalonik', '2 Tesalonik', '1 Timote', '2 Timote', 'Tit', 'Filemon', 'Ebre', 'Jak', '1 Pyè', '2 Pyè', '1 Jan', '2 Jan', '3 Jan', 'Jid', 'Apokalips'];

function generateVod() {
    const vods = [];
    const date = new Date(2025, 0, 1); // Jan 1 2025

    for (let i = 0; i < 366; i++) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${month}-${day}`;

        // Pick random verse for now
        const book = books[i % books.length];
        const chapter = 1;
        const verse = 1 + (i % 20);

        vods.push({
            date: dateKey,
            book,
            chapter,
            verse
        });

        date.setDate(date.getDate() + 1);
    }

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(vods, null, 2));
    console.log(`Generated ${vods.length} VoD entries at ${OUTPUT}`);
}

generateVod();
