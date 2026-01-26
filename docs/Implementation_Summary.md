# Lafwa Implementation Plan - Executive Summary

## 🔴 Critical Issues to Fix First

Before implementing *any* UX review recommendations:

| Issue | Severity | Fix Time |
|-------|----------|----------|
| **Highlights don't persist** - only stored in React state, disappear on refresh | 🔴 Critical | 1 hour |
| **Reading position unused** - `setLastReadBible` exists but is never called | 🟡 Medium | 15 min |
| **Hymn Reader missing** - tab shows placeholder data, users can't read lyrics | 🔴 Critical | 1-2 weeks |

---

## Implementation Phases

### Phase 0: Bug Fixes (1-2 days)
- [ ] Wire up `addHighlight()` and `getHighlightForVerse()` in BibleReader
- [ ] Call `setLastReadBible()` when book/chapter changes
- [ ] Add "Continue Reading" card to Home tab

### Phase 1: Hymn Reader (1-2 weeks) 🎯 **LAUNCH BLOCKER**
- [ ] `HymnReader.tsx` - Full lyrics display with verse/refrain sections
- [ ] `HymnDetailScreen` - Header + reader + action bar
- [ ] `PresentationMode.tsx` - Black bg, white text, section-by-section
- [ ] `HymnNumberPicker` - Numeric keypad for quick jump
- [ ] `getHymnWithSections()` database query

### Phase 2: Reading Experience (1 week)
- [ ] Sepia theme (add third color scheme)
- [ ] Line spacing control (Compact / Normal / Relaxed)
- [ ] Go-to-verse quick jump
- [ ] Chapter progress indicator

### Phase 3: Study Features (1-2 weeks)
- [ ] Personal notes (requires `notes` table migration)
- [ ] Multi-verse selection
- [ ] *(Deferred)* Font family selection

### Phase 4: Deferred to V1.1
- Text drag-selection
- Cross-references
- Parallel view
- Audio playback
- Verse images

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0 - Bug Fixes | 1-2 days | Day 2 |
| 1 - Hymn Reader | 1-2 weeks | Week 2 |
| 2 - Reading Polish | 1 week | Week 3 |
| 3 - Study Features | 1-2 weeks | Week 5 |
| **Launch** | — | **Week 5-6** |

---

## Key Technical Notes

### Highlights Bug Fix (BibleReader.tsx)
```typescript
// Add these imports
import { addHighlight, removeHighlight, getHighlightForVerse } from '../db/queries';

// In loadContent(), add to enrichment:
const highlightColor = await getHighlightForVerse(v.id);
return { ...v, bookmarked, highlightColor };

// In handleHighlight(), add before state update:
await addHighlight(selectedVerse.id, color);
```

### Reading Position Fix
```typescript
// In BibleReader, add:
useEffect(() => {
  useSettingsStore.getState().setLastReadBible(book.nameFr, chapter);
}, [book.nameFr, chapter]);
```

### Sepia Theme Colors
```typescript
sepia: {
  bg: '#f5f0e1',
  text: '#5b4636',
  textSecondary: '#7a6b5d',
  border: '#d4cdc0',
}
```

### Notes Table Schema
```sql
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  verse_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(verse_id)
);
```

---

## Verification Checklist (Every Feature)

- [ ] Works in light, dark, and sepia themes
- [ ] Works at all font sizes (XS–XL)
- [ ] Works in Kreyòl and French
- [ ] Works 100% offline
- [ ] Tested on Samsung A10 or equivalent
- [ ] Haptic feedback appropriate
- [ ] Accessibility labels included
- [ ] Performance < 200ms load time
