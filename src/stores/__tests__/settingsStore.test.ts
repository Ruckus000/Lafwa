import { useSettingsStore } from '../settingsStore';

const initialState = {
  fontSize: 'M' as const,
  theme: 'system' as const,
  lineSpacing: 'normal' as const,
  keepScreenAwake: false,
  language: 'ht' as const,
  bibleVersion: 'ht' as const,
  lastReadBible: null,
  lastReadHymn: null,
};

beforeEach(() => {
  useSettingsStore.setState(initialState);
});

describe('settingsStore', () => {
  it('has correct default state', () => {
    const state = useSettingsStore.getState();
    expect(state.language).toBe('ht');
    expect(state.bibleVersion).toBe('ht');
    expect(state.lastReadBible).toBeNull();
  });

  it('setLanguage syncs bibleVersion to the same value', () => {
    useSettingsStore.getState().setLanguage('fr');
    const state = useSettingsStore.getState();
    expect(state.language).toBe('fr');
    expect(state.bibleVersion).toBe('fr');
  });

  it('setLanguage to en syncs bibleVersion to en', () => {
    useSettingsStore.getState().setLanguage('en');
    const state = useSettingsStore.getState();
    expect(state.language).toBe('en');
    expect(state.bibleVersion).toBe('en');
  });

  it('setBibleVersion changes only bibleVersion, not language', () => {
    useSettingsStore.getState().setBibleVersion('en');
    const state = useSettingsStore.getState();
    expect(state.bibleVersion).toBe('en');
    expect(state.language).toBe('ht');
  });

  it('setLastReadBible stores book and chapter', () => {
    useSettingsStore.getState().setLastReadBible('Genèse', 5);
    const state = useSettingsStore.getState();
    expect(state.lastReadBible).toEqual({ book: 'Genèse', chapter: 5 });
  });

  it('setLanguage overrides a previous setBibleVersion', () => {
    useSettingsStore.getState().setBibleVersion('en');
    expect(useSettingsStore.getState().bibleVersion).toBe('en');

    useSettingsStore.getState().setLanguage('fr');
    const state = useSettingsStore.getState();
    expect(state.language).toBe('fr');
    expect(state.bibleVersion).toBe('fr');
  });
});
