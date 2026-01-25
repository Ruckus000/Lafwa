import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'src/assets/lafwa.db');

async function checkTable(db: sqlite3.Database, tableName: string): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name=?",
            [tableName],
            (err, row: any) => {
                if (err) reject(err);
                resolve(row ? row.count : 0);
            }
        );
    });
}

async function getRowCount(db: sqlite3.Database, tableName: string): Promise<number> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT count(*) as count FROM ${tableName}`, (err, row: any) => {
            if (err) reject(err);
            resolve(row ? row.count : 0);
        });
    });
}

async function main() {
    console.log(`Verifying database at: ${DB_PATH}`);

    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found!');
        process.exit(1);
    }

    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

    try {
        // 1. Check bible_verses
        const bibleTableExists = await checkTable(db, 'bible_verses');
        if (!bibleTableExists) {
            console.error('❌ Table "bible_verses" is MISSING.');
            process.exit(1);
        } else {
            const count = await getRowCount(db, 'bible_verses');
            console.log(`✅ Table "bible_verses" exists. Row count: ${count}`);
            if (count === 0) {
                console.warn('⚠️ Table "bible_verses" is empty!');
            }
        }

        // 2. Check hymns
        const hymnsTableExists = await checkTable(db, 'hymns');
        if (!hymnsTableExists) {
            // Hymns might be optional depending on generation, but let's check
            console.warn('⚠️ Table "hymns" is MISSING.');
        } else {
            const count = await getRowCount(db, 'hymns');
            console.log(`✅ Table "hymns" exists. Row count: ${count}`);
        }

        console.log('\n🎉 Database integrity check PASSED.');

    } catch (e) {
        console.error('❌ Error verifying database:', e);
        process.exit(1);
    } finally {
        db.close();
    }
}

main();
