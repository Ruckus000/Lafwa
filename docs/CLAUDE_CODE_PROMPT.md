# Claude Code Implementation Prompt for Lafwa

Copy and paste this prompt into Claude Code to begin implementation:

---

## PROMPT START

I need you to implement improvements to the Lafwa app based on the implementation plan in `docs/Implementation_Summary.md`. 

**IMPORTANT CONTEXT:**
- This is a React Native + Expo SDK 54 app for Haitian Christians
- Target device: Samsung A10 (2GB RAM), must stay under 50MB bundle
- Offline-first architecture using SQLite
- Follow existing patterns in the codebase (hooks, queries, stores)
- Read `docs/Lafwa_PRD_v1.docx` and `docs/Lafwa_UX_UI_Spec_v1.docx` for design specifications

**PHASE 0 - BUG FIXES (Do these first):**

### Task 0.1: Fix Highlights Persistence Bug

The highlights feature is broken. `handleHighlight` in `src/components/BibleReader.tsx` only updates React state - highlights disappear on refresh.

**Root cause:** 
- `addHighlight()` and `getHighlightForVerse()` exist in `src/db/queries.ts` but are never imported or called
- `loadContent()` doesn't check for existing highlights

**Fix required:**
1. Import `addHighlight`, `removeHighlight`, `getHighlightForVerse` from `../db/queries` in BibleReader.tsx
2. In `loadContent()`, during the verse enrichment loop, call `getHighlightForVerse(v.id)` and include in returned object
3. In `handleHighlight()`, call `await addHighlight(selectedVerse.id, color)` BEFORE updating state
4. In `handleRemoveHighlight()`, call `await removeHighlight(selectedVerse.id)` BEFORE updating state

**Test:** Highlight a verse → navigate away → return → highlight should persist

### Task 0.2: Wire Up Reading Position Memory

The settings store has `lastReadBible` and `setLastReadBible` but BibleReader never calls it.

**Fix required:**
1. In BibleReader.tsx, add a `useEffect` that calls `useSettingsStore.getState().setLastReadBible(book.nameFr, chapter)` when book or chapter changes
2. In `app/(tabs)/index.tsx` (Home screen), read `lastReadBible` from settings store
3. Add a "Continue Reading" card that links to the Bible tab with the stored book/chapter

---

**PHASE 1 - HYMN READER (Core feature):**

### Task 1.1: Add getHymnWithSections Query

Add to `src/db/queries.ts`:

```typescript
export interface HymnWithSections {
  id: number;
  number: number;
  title_fr: string | null;
  title_ht: string | null;
  sections: Array<{
    id: number;
    section_type: 'verse' | 'refrain';
    section_number: number | null;
    display_order: number;
    text_fr: string | null;
    text_ht: string | null;
  }>;
}

export async function getHymnWithSections(hymnNumber: number): Promise<HymnWithSections | null> {
  const db = await openDatabase();
  
  const hymn = await db.getFirstAsync<any>(
    'SELECT * FROM hymns WHERE number = ?',
    [hymnNumber]
  );
  
  if (!hymn) return null;
  
  const sections = await db.getAllAsync<any>(
    'SELECT * FROM hymn_sections WHERE hymn_id = ? ORDER BY display_order',
    [hymn.id]
  );
  
  return { ...hymn, sections };
}

export async function getAllHymns(): Promise<Array<{ id: number; number: number; title_fr: string; title_ht: string }>> {
  const db = await openDatabase();
  return await db.getAllAsync('SELECT id, number, title_fr, title_ht FROM hymns ORDER BY number');
}
```

### Task 1.2: Create HymnReader Component

Create `src/components/HymnReader.tsx` following the same patterns as BibleReader:
- Display hymn number (32px, centered, Ocean Blue)
- Display title (24px semibold, centered)
- Display sections with labels ("Vèsè 1", "Refren")
- Refrain sections indented 8px
- Same font size controls as Bible reader
- Favorite toggle in header

### Task 1.3: Create Presentation Mode

Create `src/components/PresentationMode.tsx`:
- Full screen, black background (#000000), white text (#FFFFFF)
- 32px fixed font size, centered
- One section per screen
- Tap right/swipe left = next section
- Tap left/swipe right = previous section  
- Swipe down = exit
- Progress dots at bottom
- Use expo-keep-awake to prevent screen sleep

### Task 1.4: Update Hymns Tab

Replace placeholder data in `app/(tabs)/hymns.tsx`:
- Load real hymns from database using `getAllHymns()`
- Navigate to hymn detail on tap
- Implement HymnNumberPicker for quick jump

### Task 1.5: Create Hymn Detail Screen

Create `app/hymn/[number].tsx`:
- Header with back button, hymn number/title, favorite toggle, presentation mode button
- HymnReader component
- Action bar with share, copy

---

**PHASE 2 - READING POLISH:**

### Task 2.1: Add Sepia Theme

1. Add `'sepia'` to ThemeSetting type in `src/stores/settingsStore.ts`
2. Add sepia colors to `src/theme/colors.ts`:
   ```typescript
   sepia: {
     bg: '#f5f0e1',
     bgSecondary: '#ebe4d3',
     surface: '#f5f0e1',
     text: '#5b4636',
     textSecondary: '#7a6b5d',
     textTertiary: '#998b7d',
     border: '#d4cdc0',
   }
   ```
3. Update `getThemeColors()` to handle sepia
4. Add third option to theme selector in settings

### Task 2.2: Add Line Spacing Control

1. Add `lineSpacing: 'compact' | 'normal' | 'relaxed'` to settings store (default: 'normal')
2. Map to multipliers: compact=1.4, normal=1.6, relaxed=1.8
3. Apply in BibleReader and HymnReader
4. Add control to settings screen

### Task 2.3: Go-To-Verse Quick Jump

1. Create `src/components/VerseJumpSheet.tsx` (similar to ChapterPicker)
2. Trigger by tapping chapter label in Bible reader header
3. Show grid of verse numbers (44x44px tap targets)
4. On select, scroll FlatList to that verse index

---

**VERIFICATION CHECKLIST (for each task):**
- [ ] Works in light, dark, and sepia themes
- [ ] Works at all font sizes (XS–XL)  
- [ ] Works in Kreyòl and French
- [ ] Works 100% offline
- [ ] No TypeScript errors
- [ ] Follows existing code patterns
- [ ] Accessibility labels included

Start with Phase 0 tasks. After each task, verify it works before moving to the next.

## PROMPT END

---

## Alternative: Phase-by-Phase Prompts

If you prefer smaller chunks, use these individual prompts:

### Phase 0 Only:
```
Fix two bugs in the Lafwa app:

1. **Highlights don't persist**: In src/components/BibleReader.tsx, handleHighlight() only updates React state. Import and use addHighlight(), removeHighlight(), getHighlightForVerse() from src/db/queries.ts to persist to SQLite.

2. **Reading position not saved**: Add useEffect in BibleReader that calls useSettingsStore.getState().setLastReadBible(book.nameFr, chapter) when book/chapter changes.

Read docs/Implementation_Summary.md for details.
```

### Phase 1 Only:
```
Implement the Hymn Reader for Lafwa. The current hymns tab shows placeholder data.

Required:
1. Add getHymnWithSections() and getAllHymns() queries to src/db/queries.ts
2. Create src/components/HymnReader.tsx matching BibleReader patterns
3. Create src/components/PresentationMode.tsx (black bg, white text, section-by-section)
4. Update app/(tabs)/hymns.tsx to load real data
5. Create app/hymn/[number].tsx detail screen

Follow specs in docs/Lafwa_UX_UI_Spec_v1.docx section 3.3 (Hymnal).
```

### Phase 2 Only:
```
Add reading comfort features to Lafwa:

1. **Sepia theme**: Add third theme option with colors bg=#f5f0e1, text=#5b4636
2. **Line spacing**: Add setting (compact/normal/relaxed) mapped to 1.4/1.6/1.8 multipliers
3. **Go-to-verse**: Create VerseJumpSheet component, trigger from chapter label tap

Apply to both BibleReader and HymnReader components.
```
