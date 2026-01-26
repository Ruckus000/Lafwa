# Lafwa Implementation Review Prompt

Use this prompt in a new Claude Code chat to perform a thorough code review.

---

## COMPREHENSIVE REVIEW PROMPT

```
Perform a comprehensive code review of the Lafwa app's Phase 0-2 implementation. Your job is to verify everything was done correctly and identify bugs, missing functionality, or architectural issues.

**Reference docs:** docs/Implementation_Summary.md, docs/Lafwa_UX_UI_Spec_v1.docx, docs/Lafwa_PRD_v1.docx

---

## PHASE 0: BUG FIXES

### 0.1 Highlights Persistence
**Files:** src/components/BibleReader.tsx, src/db/queries.ts

VERIFY:
1. Are addHighlight, removeHighlight, getHighlightForVerse imported in BibleReader.tsx?
2. In loadContent(), is getHighlightForVerse(v.id) called during verse enrichment? Show the code.
3. In handleHighlight(), is await addHighlight() called BEFORE setState? Show the code.
4. In handleRemoveHighlight(), is await removeHighlight() called BEFORE setState?
5. Is there try/catch error handling on database calls?
6. Do queries use parameterized ? placeholders (not string interpolation)?

### 0.2 Reading Position Memory
**Files:** src/components/BibleReader.tsx, src/stores/settingsStore.ts, app/(tabs)/index.tsx, app/(tabs)/bible.tsx

VERIFY:
1. Is there a useEffect in BibleReader calling setLastReadBible? Show it with dependency array.
2. Does bible.tsx read lastReadBible on initial mount and set the book/chapter?
3. Does Home (index.tsx) show "Continue Reading" card when lastReadBible exists?
4. Does tapping it navigate to correct book/chapter?

---

## PHASE 1: HYMN READER

### 1.1 Database Queries
**File:** src/db/queries.ts

VERIFY:
1. Are HymnWithSections, HymnSection, HymnListItem types exported?
2. Does getHymnWithSections join hymns + hymn_sections, ORDER BY display_order?
3. Does getAllHymns return id, number, title_fr, title_ht ordered by number?
4. All queries use ? placeholders?

### 1.2 HymnReader Component
**File:** src/components/HymnReader.tsx

VERIFY:
1. Loading state with ActivityIndicator?
2. Error state if hymn not found?
3. Section labels: "Vèsè 1", "Refren" (Ocean Blue)?
4. Refrain indented 8px?
5. Hymn number: 32px centered Ocean Blue?
6. Title: 24px semibold centered?
7. Respects fontSize and lineSpacing from settings?
8. Uses text_fr or text_ht based on language setting?
9. Favorite toggle heart icon?
10. Uses useTheme() colors for all 3 themes?

### 1.3 Presentation Mode
**File:** src/components/PresentationMode.tsx

VERIFY:
1. Background #000000, text #FFFFFF, font 32px, centered?
2. One section per screen?
3. Section label at top, progress dots at bottom?
4. Tap right/swipe left = next, tap left/swipe right = previous?
5. Swipe down = exit?
6. useKeepAwake() called?
7. Status bar hidden?
8. Handles edge cases (first section, last section, single section)?

### 1.4 Hymns Tab
**File:** app/(tabs)/hymns.tsx

VERIFY:
1. Calls getAllHymns() on mount?
2. Loading indicator while fetching?
3. Uses FlatList (not ScrollView+map)?
4. Number picker modal for quick jump?
5. Tapping hymn navigates to /hymn/[number]?

### 1.5 Hymn Detail Screen
**File:** app/hymn/[number].tsx

VERIFY:
1. Extracts number from useLocalSearchParams?
2. Validates number (not NaN, positive)?
3. Header: back, title, favorite toggle, presentation button?
4. HymnReader rendered with correct props?
5. Presentation mode button shows PresentationMode?
6. Share and copy functionality?
7. Records to reading_history?

---

## PHASE 2: READING POLISH

### 2.1 Sepia Theme
**Files:** src/stores/settingsStore.ts, src/theme/colors.ts, src/hooks/useTheme.ts, app/(tabs)/settings.tsx

VERIFY:
1. ThemeSetting type includes 'sepia'?
2. colors.ts has sepia object with bg: '#f5f0e1', text: '#5b4636'?
3. getThemeColors() handles sepia case?
4. useTheme hook handles sepia in resolvedTheme?
5. Settings has 3 theme options (Light/Sepia/Dark)?

### 2.2 Line Spacing
**Files:** src/stores/settingsStore.ts, src/components/BibleReader.tsx, src/components/HymnReader.tsx, app/(tabs)/settings.tsx

VERIFY:
1. LineSpacingSetting type: 'compact' | 'normal' | 'relaxed'?
2. lineSpacing in store with default 'normal'?
3. Multipliers: compact=1.4, normal=1.6, relaxed=1.8?
4. Applied in BibleReader verse text lineHeight?
5. Applied in HymnReader lyrics lineHeight?
6. Settings UI has control to change it?
7. Persists across app restarts?

### 2.3 Go-To-Verse Jump
**Files:** src/components/VerseJumpSheet.tsx, src/components/BibleReader.tsx

VERIFY:
1. VerseJumpSheet accepts visible, onClose, onSelectVerse, totalVerses props?
2. Grid of verse numbers with 44x44px tap targets?
3. Triggered by tapping chapter label/footer in BibleReader?
4. On selection, scrolls FlatList to verse index?
5. Has getItemLayout or onScrollToIndexFailed for scrollToIndex?
6. Haptic feedback on selection?
7. Sheet closes after selection?

---

## CROSS-CUTTING CHECKS

1. Run `npx tsc --noEmit` - any TypeScript errors?
2. All useEffect hooks have cleanup where needed?
3. No event listeners missing cleanup on unmount?
4. useKeepAwake scoped to PresentationMode only?
5. FlatLists have optimization props?
6. All features work offline?
7. All interactive elements have accessibilityLabel?

---

## OUTPUT FORMAT

For each section:
- **Status**: ✅ PASS, ⚠️ ISSUE, or ❌ FAIL
- **Evidence**: Relevant code snippet
- **Fix needed**: If ISSUE/FAIL, exact fix required

End with:
1. **Summary table** of all checks
2. **Critical issues** (must fix before ship)
3. **Warnings** (should fix but not blockers)
4. **Suggestions** (nice to have)

Be thorough. Miss nothing.
```
