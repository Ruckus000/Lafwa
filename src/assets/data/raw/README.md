# Lafwa Content Data

## Known Limitations

### Hymns: Identical FR/HT Content

**Issue:** cesperance.com serves identical content regardless of the `?lang=fr` or `?lang=ht` query parameter.

**Impact:** The `text_fr` and `text_ht` columns contain the same text.

**Decision:** Accepted for V1. The app will display hymn lyrics in French. The language toggle for hymns will not produce different content.

**Future:** If a true Kreyòl hymnal source is found, the data can be updated.

---

## Data Files

| File | Description |
|------|-------------|
| `hymn_index.json` | List of all hymn numbers, slugs, titles |
| `hymns_raw.json` | Raw scraped content (before processing) |
| `hymns_final.json` | Cleaned, validated hymns ready for DB |
| `validation_report.json` | Quality metrics from validation |
| `test_report.json` | Automated test results |
| `vod-map.json` | Verse of the Day mapping (MM-DD → verse ref) |
| `french_bible.json` | French Bible text (Louis Segond) |
| `haitian_bible.json` | Haitian Creole Bible text |

---

## Pipeline

```
discover_urls.ts → hymn_index.json
       ↓
scrape_content.ts → hymns_raw.json
       ↓
validate.ts → hymns_final.json + validation_report.json
       ↓
generate_db.ts → ../lafwa.db
```

---

## Scripts

```bash
# Run full test suite
npm run test:scraper

# Re-validate (filters boilerplate, recalculates scores)
npm run scraper:validate

# Regenerate database
npm run generate:db

# Verify database integrity
npm run verify:db
```
