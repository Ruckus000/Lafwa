/**
 * Bible Data
 * Static data for Bible book listing
 */

export interface BibleBook {
  id: number;
  nameHt: string;
  nameFr: string;
  abbreviation: string;
  chapters: number;
  testament: 'OT' | 'NT';
}

export const bibleBooks: BibleBook[] = [
  // Old Testament
  { id: 1, nameHt: 'Jenèz', nameFr: 'Genèse', abbreviation: 'Jen', chapters: 50, testament: 'OT' },
  { id: 2, nameHt: 'Egzòd', nameFr: 'Exode', abbreviation: 'Egz', chapters: 40, testament: 'OT' },
  { id: 3, nameHt: 'Levitik', nameFr: 'Lévitique', abbreviation: 'Lev', chapters: 27, testament: 'OT' },
  { id: 4, nameHt: 'Nonb', nameFr: 'Nombres', abbreviation: 'Nonb', chapters: 36, testament: 'OT' },
  { id: 5, nameHt: 'Deteronòm', nameFr: 'Deutéronome', abbreviation: 'Det', chapters: 34, testament: 'OT' },
  { id: 6, nameHt: 'Jozye', nameFr: 'Josué', abbreviation: 'Joz', chapters: 24, testament: 'OT' },
  { id: 7, nameHt: 'Jij', nameFr: 'Juges', abbreviation: 'Jij', chapters: 21, testament: 'OT' },
  { id: 8, nameHt: 'Rit', nameFr: 'Ruth', abbreviation: 'Rit', chapters: 4, testament: 'OT' },
  { id: 9, nameHt: '1 Samyèl', nameFr: '1 Samuel', abbreviation: '1Sam', chapters: 31, testament: 'OT' },
  { id: 10, nameHt: '2 Samyèl', nameFr: '2 Samuel', abbreviation: '2Sam', chapters: 24, testament: 'OT' },
  { id: 11, nameHt: '1 Wa', nameFr: '1 Rois', abbreviation: '1Wa', chapters: 22, testament: 'OT' },
  { id: 12, nameHt: '2 Wa', nameFr: '2 Rois', abbreviation: '2Wa', chapters: 25, testament: 'OT' },
  { id: 13, nameHt: '1 Kwonik', nameFr: '1 Chroniques', abbreviation: '1Kwo', chapters: 29, testament: 'OT' },
  { id: 14, nameHt: '2 Kwonik', nameFr: '2 Chroniques', abbreviation: '2Kwo', chapters: 36, testament: 'OT' },
  { id: 15, nameHt: 'Esdras', nameFr: 'Esdras', abbreviation: 'Esd', chapters: 10, testament: 'OT' },
  { id: 16, nameHt: 'Neyemi', nameFr: 'Néhémie', abbreviation: 'Ney', chapters: 13, testament: 'OT' },
  { id: 17, nameHt: 'Estè', nameFr: 'Esther', abbreviation: 'Est', chapters: 10, testament: 'OT' },
  { id: 18, nameHt: 'Jòb', nameFr: 'Job', abbreviation: 'Jòb', chapters: 42, testament: 'OT' },
  { id: 19, nameHt: 'Sòm', nameFr: 'Psaumes', abbreviation: 'Sòm', chapters: 150, testament: 'OT' },
  { id: 20, nameHt: 'Pwovèb', nameFr: 'Proverbes', abbreviation: 'Pwo', chapters: 31, testament: 'OT' },
  { id: 21, nameHt: 'Eklezyas', nameFr: 'Ecclésiaste', abbreviation: 'Ekl', chapters: 12, testament: 'OT' },
  { id: 22, nameHt: 'Kantik', nameFr: 'Cantique', abbreviation: 'Kan', chapters: 8, testament: 'OT' },
  { id: 23, nameHt: 'Ezayi', nameFr: 'Ésaïe', abbreviation: 'Eza', chapters: 66, testament: 'OT' },
  { id: 24, nameHt: 'Jeremi', nameFr: 'Jérémie', abbreviation: 'Jer', chapters: 52, testament: 'OT' },
  { id: 25, nameHt: 'Lamantasyon', nameFr: 'Lamentations', abbreviation: 'Lam', chapters: 5, testament: 'OT' },
  { id: 26, nameHt: 'Ezekyèl', nameFr: 'Ézéchiel', abbreviation: 'Eze', chapters: 48, testament: 'OT' },
  { id: 27, nameHt: 'Danyèl', nameFr: 'Daniel', abbreviation: 'Dan', chapters: 12, testament: 'OT' },
  { id: 28, nameHt: 'Oze', nameFr: 'Osée', abbreviation: 'Oze', chapters: 14, testament: 'OT' },
  { id: 29, nameHt: 'Jowèl', nameFr: 'Joël', abbreviation: 'Jow', chapters: 3, testament: 'OT' },
  { id: 30, nameHt: 'Amòs', nameFr: 'Amos', abbreviation: 'Amo', chapters: 9, testament: 'OT' },
  { id: 31, nameHt: 'Abdyas', nameFr: 'Abdias', abbreviation: 'Abd', chapters: 1, testament: 'OT' },
  { id: 32, nameHt: 'Jonas', nameFr: 'Jonas', abbreviation: 'Jon', chapters: 4, testament: 'OT' },
  { id: 33, nameHt: 'Miche', nameFr: 'Michée', abbreviation: 'Mic', chapters: 7, testament: 'OT' },
  { id: 34, nameHt: 'Nawoum', nameFr: 'Nahum', abbreviation: 'Naw', chapters: 3, testament: 'OT' },
  { id: 35, nameHt: 'Abakouk', nameFr: 'Habacuc', abbreviation: 'Aba', chapters: 3, testament: 'OT' },
  { id: 36, nameHt: 'Sofoni', nameFr: 'Sophonie', abbreviation: 'Sof', chapters: 3, testament: 'OT' },
  { id: 37, nameHt: 'Aje', nameFr: 'Aggée', abbreviation: 'Aje', chapters: 2, testament: 'OT' },
  { id: 38, nameHt: 'Zakari', nameFr: 'Zacharie', abbreviation: 'Zak', chapters: 14, testament: 'OT' },
  { id: 39, nameHt: 'Malachi', nameFr: 'Malachie', abbreviation: 'Mal', chapters: 4, testament: 'OT' },
  
  // New Testament
  { id: 40, nameHt: 'Matye', nameFr: 'Matthieu', abbreviation: 'Mat', chapters: 28, testament: 'NT' },
  { id: 41, nameHt: 'Mak', nameFr: 'Marc', abbreviation: 'Mak', chapters: 16, testament: 'NT' },
  { id: 42, nameHt: 'Lik', nameFr: 'Luc', abbreviation: 'Lik', chapters: 24, testament: 'NT' },
  { id: 43, nameHt: 'Jan', nameFr: 'Jean', abbreviation: 'Jan', chapters: 21, testament: 'NT' },
  { id: 44, nameHt: 'Travay', nameFr: 'Actes', abbreviation: 'Tra', chapters: 28, testament: 'NT' },
  { id: 45, nameHt: 'Women', nameFr: 'Romains', abbreviation: 'Wom', chapters: 16, testament: 'NT' },
  { id: 46, nameHt: '1 Korent', nameFr: '1 Corinthiens', abbreviation: '1Kor', chapters: 16, testament: 'NT' },
  { id: 47, nameHt: '2 Korent', nameFr: '2 Corinthiens', abbreviation: '2Kor', chapters: 13, testament: 'NT' },
  { id: 48, nameHt: 'Galat', nameFr: 'Galates', abbreviation: 'Gal', chapters: 6, testament: 'NT' },
  { id: 49, nameHt: 'Efèz', nameFr: 'Éphésiens', abbreviation: 'Efè', chapters: 6, testament: 'NT' },
  { id: 50, nameHt: 'Filip', nameFr: 'Philippiens', abbreviation: 'Fil', chapters: 4, testament: 'NT' },
  { id: 51, nameHt: 'Kolòs', nameFr: 'Colossiens', abbreviation: 'Kol', chapters: 4, testament: 'NT' },
  { id: 52, nameHt: '1 Tesalonik', nameFr: '1 Thessaloniciens', abbreviation: '1Tes', chapters: 5, testament: 'NT' },
  { id: 53, nameHt: '2 Tesalonik', nameFr: '2 Thessaloniciens', abbreviation: '2Tes', chapters: 3, testament: 'NT' },
  { id: 54, nameHt: '1 Timote', nameFr: '1 Timothée', abbreviation: '1Tim', chapters: 6, testament: 'NT' },
  { id: 55, nameHt: '2 Timote', nameFr: '2 Timothée', abbreviation: '2Tim', chapters: 4, testament: 'NT' },
  { id: 56, nameHt: 'Tit', nameFr: 'Tite', abbreviation: 'Tit', chapters: 3, testament: 'NT' },
  { id: 57, nameHt: 'Filemon', nameFr: 'Philémon', abbreviation: 'Flm', chapters: 1, testament: 'NT' },
  { id: 58, nameHt: 'Ebre', nameFr: 'Hébreux', abbreviation: 'Ebr', chapters: 13, testament: 'NT' },
  { id: 59, nameHt: 'Jak', nameFr: 'Jacques', abbreviation: 'Jak', chapters: 5, testament: 'NT' },
  { id: 60, nameHt: '1 Pyè', nameFr: '1 Pierre', abbreviation: '1Pyè', chapters: 5, testament: 'NT' },
  { id: 61, nameHt: '2 Pyè', nameFr: '2 Pierre', abbreviation: '2Pyè', chapters: 3, testament: 'NT' },
  { id: 62, nameHt: '1 Jan', nameFr: '1 Jean', abbreviation: '1Jan', chapters: 5, testament: 'NT' },
  { id: 63, nameHt: '2 Jan', nameFr: '2 Jean', abbreviation: '2Jan', chapters: 1, testament: 'NT' },
  { id: 64, nameHt: '3 Jan', nameFr: '3 Jean', abbreviation: '3Jan', chapters: 1, testament: 'NT' },
  { id: 65, nameHt: 'Jid', nameFr: 'Jude', abbreviation: 'Jid', chapters: 1, testament: 'NT' },
  { id: 66, nameHt: 'Revelasyon', nameFr: 'Apocalypse', abbreviation: 'Rev', chapters: 22, testament: 'NT' },
];

export const getBooksByTestament = (testament: 'OT' | 'NT') => 
  bibleBooks.filter(book => book.testament === testament);

export const getBookByName = (name: string): BibleBook | undefined =>
  bibleBooks.find(b => b.nameHt === name || b.nameFr === name || b.abbreviation === name);

export const getBookById = (id: number): BibleBook | undefined =>
  bibleBooks.find(b => b.id === id);
