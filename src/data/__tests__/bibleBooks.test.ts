import { getBookByName, getBookById, bibleBooks } from '../bibleBooks';

describe('getBookByName', () => {
  it('resolves by Haitian Creole name (nameHt)', () => {
    const book = getBookByName('Jenèz');
    expect(book).toBeDefined();
    expect(book!.id).toBe(1);
  });

  it('resolves by French name (nameFr)', () => {
    const book = getBookByName('Genèse');
    expect(book).toBeDefined();
    expect(book!.id).toBe(1);
  });

  it('resolves by English name (nameEn)', () => {
    const book = getBookByName('Genesis');
    expect(book).toBeDefined();
    expect(book!.id).toBe(1);
  });

  it('resolves by abbreviation', () => {
    const book = getBookByName('Jen');
    expect(book).toBeDefined();
    expect(book!.id).toBe(1);
  });

  it('returns undefined for unknown name', () => {
    expect(getBookByName('FakeBook')).toBeUndefined();
  });

  it('returns object with all name fields for display resolution', () => {
    const book = getBookByName('Genèse');
    expect(book).toHaveProperty('nameHt', 'Jenèz');
    expect(book).toHaveProperty('nameFr', 'Genèse');
    expect(book).toHaveProperty('nameEn', 'Genesis');
  });

  it('produces correct localized display name for all 3 languages', () => {
    const book = getBookByName('Genèse')!;
    const names: Record<string, string> = {
      ht: book.nameHt,
      fr: book.nameFr,
      en: book.nameEn,
    };

    expect(names['ht']).toBe('Jenèz');
    expect(names['fr']).toBe('Genèse');
    expect(names['en']).toBe('Genesis');
  });
});
