# Lafwa Project Standards

## Architecture

### Directory Structure
```
/app                    # Expo Router screens
  /(tabs)              # Tab-based navigation
  /library             # Library sub-screens
/src
  /components          # Reusable React components
  /hooks               # Custom React hooks
  /types               # TypeScript type definitions
  /utils               # Utility functions
  /data                # Static data (bibleBooks.ts)
  /db                  # Database queries
  /stores              # Zustand stores
  /assets              # Static assets
```

### Navigation Pattern

**Always use navigation helpers for deep linking:**

```typescript
import { navigateToBible, navigateToHymn } from '../src/utils/navigation';

// Bible navigation (validates book/chapter)
navigateToBible(router, { book: 'Jan', chapter: 3, verse: 16 });

// Hymn navigation (validates number range)
navigateToHymn(router, { number: 42 });
```

**Never construct navigation URLs manually:**
```typescript
// BAD - hardcoded, ignores data
router.push('/bible');

// GOOD - uses data for deep linking
navigateToBible(router, { book: item.book, chapter: item.chapter });
```

### Type Safety

- No `any` types in hooks or components
- Use type guards for discriminated unions
- Define interfaces in `/src/types/`

```typescript
// Type guard example
import { isBibleResult, isHymnResult } from '../types/search';

if (isBibleResult(item)) {
  // TypeScript knows item.data is BibleSearchResult
}
```

### State Management

- Zustand for global state (`/src/stores/`)
- React state for component-local state
- Custom hooks for data fetching (`/src/hooks/`)

### Multilingual Support

Use object syntax for inline translations:

```typescript
const label = { ht: 'Kreyòl', fr: 'Français', en: 'English' }[language];
```

## Database

- SQLite via expo-sqlite
- French book names for Bible queries (database uses French names)
- Parameterized queries only (no string interpolation)

## Testing Checklist

Before marking a navigation feature complete:

1. [ ] Tapping search result opens correct content
2. [ ] Tapping bookmark navigates to correct verse/hymn
3. [ ] Tapping favorite navigates to correct hymn
4. [ ] Tapping history item navigates to correct content
5. [ ] All quick actions on Home screen work
6. [ ] TypeScript reports no errors
7. [ ] Accessibility labels present on interactive elements
