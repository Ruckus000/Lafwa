import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/assets/lafwa.db');
const SCHEMA_PATH = path.join(process.cwd(), 'src/db/schema.sql');
const DATA_DIR = path.join(process.cwd(), 'src/assets/data/raw');

// Ensure assets dir exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Delete existing DB
if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

function runSql(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function runSqlGetId(sql: string, params: any[] = []): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
}

function execSql(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

interface HymnSection {
    type: 'verse' | 'refrain';
    number: number | null;
    order: number;
    text_fr: string | null;
    text_ht: string | null;
}

interface ValidatedHymn {
    number: number;
    slug: string;
    title_fr: string | null;
    title_ht: string | null;
    sections: HymnSection[];
    quality_score: number;
}

async function main() {
    console.log('=== Database Generation ===\n');
    console.log('Creating database at', DB_PATH);

    // 1. Apply Schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    await execSql(schema);
    console.log('Schema applied.\n');

    // 2. Insert Bible (HT & FR)
    console.log('Inserting Bible Data...');
    const bibleSources = [
        { file: 'haitian_bible.json', version: 'ht' },
        { file: 'french_bible.json', version: 'fr' }
    ];

    const insertBible = db.prepare('INSERT OR IGNORE INTO bible_verses (book, chapter, verse, text, version) VALUES (?, ?, ?, ?, ?)');

    for (const source of bibleSources) {
        const filePath = path.join(DATA_DIR, source.file);
        if (fs.existsSync(filePath)) {
            console.log(`  Processing ${source.version.toUpperCase()} Bible...`);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            await runSql('BEGIN TRANSACTION');
            let count = 0;

            if (data.Testaments) {
                for (const testament of data.Testaments) {
                    if (testament.Books) {
                        for (const book of testament.Books) {
                            const bookName = book.Text;
                            if (book.Chapters) {
                                let chapterNum = 1;
                                for (const chapter of book.Chapters) {
                                    if (chapter.Verses) {
                                        let verseIndex = 1;
                                        for (const verse of chapter.Verses) {
                                            const verseNum = verse.ID || verseIndex;
                                            insertBible.run(bookName, chapterNum, verseNum, verse.Text, source.version);
                                            count++;
                                            verseIndex++;
                                        }
                                    }
                                    chapterNum++;
                                }
                            }
                        }
                    }
                }
            }

            await runSql('COMMIT');
            console.log(`  Inserted ${count} verses for ${source.version}`);
        } else {
            console.warn(`  Missing file: ${source.file}`);
        }
    }
    insertBible.finalize();

    // 3. Insert Hymns (new format with sections)
    console.log('\nInserting Hymns...');
    const hymnsPath = path.join(DATA_DIR, 'hymns_final.json');

    if (fs.existsSync(hymnsPath)) {
        const hymns: ValidatedHymn[] = JSON.parse(fs.readFileSync(hymnsPath, 'utf-8'));
        console.log(`  Found ${hymns.length} validated hymns`);

        await runSql('BEGIN TRANSACTION');

        let hymnCount = 0;
        let sectionCount = 0;

        for (const hymn of hymns) {
            // Insert hymn
            const hymnId = await runSqlGetId(
                'INSERT OR IGNORE INTO hymns (book, number, title_fr, title_ht) VALUES (?, ?, ?, ?)',
                ['chant-desperance', hymn.number, hymn.title_fr, hymn.title_ht]
            );

            if (hymnId > 0) {
                hymnCount++;

                // Insert sections
                if (hymn.sections && hymn.sections.length > 0) {
                    for (const section of hymn.sections) {
                        await runSql(
                            'INSERT INTO hymn_sections (hymn_id, section_type, section_number, display_order, text_fr, text_ht) VALUES (?, ?, ?, ?, ?, ?)',
                            [hymnId, section.type, section.number, section.order, section.text_fr, section.text_ht]
                        );
                        sectionCount++;
                    }
                }
            }
        }

        await runSql('COMMIT');
        console.log(`  Inserted ${hymnCount} hymns with ${sectionCount} sections`);
    } else {
        console.log('  No hymns_final.json found. Skipping hymns.');
    }

    // 4. Rebuild FTS indexes
    console.log('\nRebuilding FTS indexes...');
    try {
        await runSql("INSERT INTO bible_fts(bible_fts) VALUES('rebuild')");
        await runSql("INSERT INTO hymns_fts(hymns_fts) VALUES('rebuild')");
        await runSql("INSERT INTO sections_fts(sections_fts) VALUES('rebuild')");
        console.log('  FTS indexes rebuilt');
    } catch (err) {
        console.log('  FTS rebuild skipped (triggers handle sync)');
    }

    // 5. Summary
    console.log('\n=== Database Generation Complete ===');
    console.log(`Output: ${DB_PATH}`);

    // Get counts
    db.get('SELECT COUNT(*) as count FROM bible_verses', (err, row: any) => {
        if (!err && row) console.log(`  Bible verses: ${row.count}`);
    });
    db.get('SELECT COUNT(*) as count FROM hymns', (err, row: any) => {
        if (!err && row) console.log(`  Hymns: ${row.count}`);
    });
    db.get('SELECT COUNT(*) as count FROM hymn_sections', (err, row: any) => {
        if (!err && row) console.log(`  Hymn sections: ${row.count}`);
        db.close();
    });
}

main();
