-- Core Tables
CREATE TABLE IF NOT EXISTS bible_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    version TEXT NOT NULL, -- 'ht' or 'fr'
    UNIQUE(book, chapter, verse, version)
);

CREATE TABLE IF NOT EXISTS hymns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book TEXT NOT NULL DEFAULT 'chant-desperance',
    number INTEGER NOT NULL,
    title_fr TEXT,
    title_ht TEXT,
    UNIQUE(book, number)
);

CREATE TABLE IF NOT EXISTS hymn_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hymn_id INTEGER NOT NULL,
    section_type TEXT NOT NULL,  -- 'verse', 'refrain'
    section_number INTEGER,       -- 1, 2, 3... for verses, NULL for refrain
    display_order INTEGER NOT NULL,
    text_fr TEXT,
    text_ht TEXT,
    FOREIGN KEY (hymn_id) REFERENCES hymns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hymn_sections_hymn_id ON hymn_sections(hymn_id);
CREATE INDEX IF NOT EXISTS idx_hymns_book ON hymns(book);
CREATE INDEX IF NOT EXISTS idx_hymns_number ON hymns(number);

-- FTS5 Virtual Tables for Search
-- Using default unicode61 tokenizer for better accent handling

CREATE VIRTUAL TABLE IF NOT EXISTS bible_fts USING fts5(
    text,
    content='bible_verses',
    content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS hymns_fts USING fts5(
    title_fr,
    title_ht,
    content='hymns',
    content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS sections_fts USING fts5(
    text_fr,
    text_ht,
    content='hymn_sections',
    content_rowid='id'
);

-- Triggers for Bible FTS Sync
CREATE TRIGGER IF NOT EXISTS bible_ai AFTER INSERT ON bible_verses BEGIN
  INSERT INTO bible_fts(rowid, text) VALUES (new.id, new.text);
END;
CREATE TRIGGER IF NOT EXISTS bible_ad AFTER DELETE ON bible_verses BEGIN
  INSERT INTO bible_fts(bible_fts, rowid, text) VALUES('delete', old.id, old.text);
END;
CREATE TRIGGER IF NOT EXISTS bible_au AFTER UPDATE ON bible_verses BEGIN
  INSERT INTO bible_fts(bible_fts, rowid, text) VALUES('delete', old.id, old.text);
  INSERT INTO bible_fts(rowid, text) VALUES (new.id, new.text);
END;

-- Triggers for Hymns FTS Sync
CREATE TRIGGER IF NOT EXISTS hymns_ai AFTER INSERT ON hymns BEGIN
  INSERT INTO hymns_fts(rowid, title_fr, title_ht) VALUES (new.id, new.title_fr, new.title_ht);
END;
CREATE TRIGGER IF NOT EXISTS hymns_ad AFTER DELETE ON hymns BEGIN
  INSERT INTO hymns_fts(hymns_fts, rowid, title_fr, title_ht) VALUES('delete', old.id, old.title_fr, old.title_ht);
END;
CREATE TRIGGER IF NOT EXISTS hymns_au AFTER UPDATE ON hymns BEGIN
  INSERT INTO hymns_fts(hymns_fts, rowid, title_fr, title_ht) VALUES('delete', old.id, old.title_fr, old.title_ht);
  INSERT INTO hymns_fts(rowid, title_fr, title_ht) VALUES (new.id, new.title_fr, new.title_ht);
END;

-- Triggers for Sections FTS Sync
CREATE TRIGGER IF NOT EXISTS sections_ai AFTER INSERT ON hymn_sections BEGIN
  INSERT INTO sections_fts(rowid, text_fr, text_ht) VALUES (new.id, new.text_fr, new.text_ht);
END;
CREATE TRIGGER IF NOT EXISTS sections_ad AFTER DELETE ON hymn_sections BEGIN
  INSERT INTO sections_fts(sections_fts, rowid, text_fr, text_ht) VALUES('delete', old.id, old.text_fr, old.text_ht);
END;
CREATE TRIGGER IF NOT EXISTS sections_au AFTER UPDATE ON hymn_sections BEGIN
  INSERT INTO sections_fts(sections_fts, rowid, text_fr, text_ht) VALUES('delete', old.id, old.text_fr, old.text_ht);
  INSERT INTO sections_fts(rowid, text_fr, text_ht) VALUES (new.id, new.text_fr, new.text_ht);
END;

CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'bible' or 'hymn'
    reference_id INTEGER NOT NULL, -- bible_verse.id or hymns.id
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, reference_id)
);
