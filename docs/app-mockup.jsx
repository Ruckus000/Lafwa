import React, { useState, useEffect } from 'react';
import { BookOpen, Music, Home, MoreHorizontal, Search, Bookmark, Heart, ChevronRight, ChevronLeft, Sun, Moon, Settings, Maximize2, Type, Copy, Share2, X, Clock, Highlighter, BookMarked, Sparkles } from 'lucide-react';

// Refined color system with better contrast and sophistication
const theme = {
  light: {
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F5',
    border: 'rgba(0,0,0,0.06)',
    borderStrong: 'rgba(0,0,0,0.1)',
    text: '#0A0A0A',
    textSecondary: '#525252',
    textTertiary: '#A3A3A3',
    accent: '#2563EB',
    accentLight: '#DBEAFE',
    accentSubtle: 'rgba(37, 99, 235, 0.08)',
    shadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
    shadowLg: '0 4px 24px rgba(0,0,0,0.08)',
    gradient: 'linear-gradient(135deg, #EFF6FF 0%, #FAFAFA 100%)',
  },
  dark: {
    bg: '#09090B',
    surface: '#18181B',
    surfaceHover: '#27272A',
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.1)',
    text: '#FAFAFA',
    textSecondary: '#A1A1AA',
    textTertiary: '#52525B',
    accent: '#3B82F6',
    accentLight: '#1E3A5F',
    accentSubtle: 'rgba(59, 130, 246, 0.15)',
    shadow: '0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.3)',
    shadowLg: '0 4px 24px rgba(0,0,0,0.4)',
    gradient: 'linear-gradient(135deg, #1E293B 0%, #09090B 100%)',
  }
};

const highlights = {
  yellow: { bg: '#FEF9C3', border: '#FDE047' },
  green: { bg: '#DCFCE7', border: '#86EFAC' },
  blue: { bg: '#DBEAFE', border: '#93C5FD' },
  pink: { bg: '#FCE7F3', border: '#F9A8D4' },
};

// Sample data
const bibleBooks = {
  OT: [
    { id: 1, name: 'Jenèz', chapters: 50 },
    { id: 2, name: 'Egzòd', chapters: 40 },
    { id: 3, name: 'Levitik', chapters: 27 },
    { id: 4, name: 'Nonb', chapters: 36 },
    { id: 5, name: 'Deteronòm', chapters: 34 },
  ],
  NT: [
    { id: 40, name: 'Matye', chapters: 28 },
    { id: 41, name: 'Mak', chapters: 16 },
    { id: 42, name: 'Lik', chapters: 24 },
    { id: 43, name: 'Jan', chapters: 21 },
    { id: 44, name: 'Travay', chapters: 28 },
    { id: 45, name: 'Women', chapters: 16 },
  ],
};

const sampleVerses = [
  { verse: 1, text: 'Nan konmansman an, Pawòl la te la. Pawòl la te avèk Bondye, Pawòl la te Bondye.' },
  { verse: 2, text: 'Depi nan konmansman, li te avèk Bondye.' },
  { verse: 3, text: 'Se ak Pawòl la Bondye fè tout bagay. Pa gen anyen ki te fèt san li.' },
  { verse: 4, text: 'Lavi a te nan li. Se lavi sa a ki te limyè pou tout moun.' },
  { verse: 5, text: 'Limyè a klere nan fènwa a, men fènwa a pa t resevwa li.' },
  { verse: 14, text: 'Pawòl la tounen moun. Li te vin viv nan mitan nou, li te gen tout bon bagay Bondye bay la, li te gen verite a nèt ale. Nou wè pouvwa li, se te pouvwa Bondye bay sèl Pitit li a.' },
];

const hymns = [
  { id: 1, title: 'Bondye, Koute Lapriyè M', subtitle: 'Bondye, koute lapriyè mwen...', favorite: false },
  { id: 2, title: 'Jezi Renmen M', subtitle: 'Jezi renmen m, mwen konnen sa...', favorite: true },
  { id: 42, title: 'Bon Bèje A', subtitle: 'Senyè se bèje mwen, mwen p ap manke...', favorite: true },
  { id: 100, title: 'Glwa Pou Bondye', subtitle: 'Glwa pou Bondye nan syèl la...', favorite: false },
  { id: 150, title: 'Louwanj Pou Senyè', subtitle: 'Louwanj, louwanj pou Senyè a...', favorite: false },
  { id: 200, title: 'Nan Syèl La', subtitle: 'Nan syèl la gen yon bèl peyi...', favorite: true },
  { id: 250, title: 'Kris Se Sèl Chemen', subtitle: 'Kris se sèl chemen, verite...', favorite: false },
];

const hymnSections = [
  { type: 'verse', num: 1, text: 'Senyè se bèje mwen,\nMwen p ap manke anyen.\nLi fè m kouche nan zèb vèt,\nBò dlo ki kalm, li mennen m.' },
  { type: 'refrain', text: 'Li mennen m, li mennen m,\nNan chemen dwat yo.\nPou lonè non li,\nMwen p ap pè anyen.' },
  { type: 'verse', num: 2, text: 'Menm lè m ap mache\nNan fon lanmò a,\nMwen p ap pè malè,\nPaske ou la avè m.' },
  { type: 'verse', num: 3, text: 'Baton ou ak gòl ou\nBan m kouraj toujou.\nOu pare yon tab pou mwen\nDevan lènmi mwen yo.' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { text: 'Bonjou', emoji: '☀️' };
  if (h >= 12 && h < 18) return { text: 'Bon aprè-midi', emoji: '🌤' };
  if (h >= 18 && h < 22) return { text: 'Bonswa', emoji: '🌅' };
  return { text: 'Bòn nwit', emoji: '🌙' };
};

export default function LafwaMockup() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState('home');
  const [screen, setScreen] = useState('main');
  const [testament, setTestament] = useState('NT');
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [hymn, setHymn] = useState(null);
  const [presenting, setPresenting] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [lang, setLang] = useState('ht');
  const [fontSize, setFontSize] = useState(2);

  const t = dark ? theme.dark : theme.light;
  const fontSizes = [15, 17, 19, 21, 24];
  const greeting = getGreeting();

  // Presentation Mode
  if (presenting) {
    const section = hymnSections[slideIndex];
    return (
      <div className="w-full h-screen flex items-center justify-center bg-zinc-900 p-4">
        <div 
          className="relative w-full max-w-sm h-full max-h-[780px] rounded-[52px] overflow-hidden"
          style={{ background: '#000', boxShadow: 'inset 0 0 0 10px #1a1a1a' }}
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-50" />
          
          <div 
            className="w-full h-full flex flex-col items-center justify-center px-8 cursor-pointer select-none"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x > rect.width * 0.5) {
                setSlideIndex(Math.min(slideIndex + 1, hymnSections.length - 1));
              } else {
                setSlideIndex(Math.max(slideIndex - 1, 0));
              }
            }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setPresenting(false); }}
              className="absolute top-16 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} color="#fff" />
            </button>
            
            <span className="text-white/40 text-sm tracking-widest uppercase mb-6 font-medium">
              {section.type === 'refrain' ? 'Refren' : `Vèsè ${section.num}`}
            </span>
            
            <p className="text-white text-center text-2xl leading-relaxed whitespace-pre-line font-serif">
              {section.text}
            </p>
            
            <div className="absolute bottom-12 flex gap-2">
              {hymnSections.map((_, i) => (
                <div 
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: i === slideIndex ? 24 : 6,
                    backgroundColor: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.25)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Action Sheet for verse selection
  const ActionSheet = () => (
    <div 
      className="absolute bottom-20 left-4 right-4 rounded-2xl overflow-hidden z-50"
      style={{ 
        backgroundColor: t.surface, 
        boxShadow: t.shadowLg,
        border: `1px solid ${t.border}`
      }}
    >
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-8 h-1 rounded-full" style={{ backgroundColor: t.borderStrong }} />
      </div>
      <div className="flex px-2 pb-4">
        {[
          { icon: Highlighter, label: 'Sikle', color: highlights.yellow.bg },
          { icon: BookMarked, label: 'Makè' },
          { icon: Copy, label: 'Kopye' },
          { icon: Share2, label: 'Pataje' },
        ].map(({ icon: Icon, label, color }) => (
          <button 
            key={label}
            onClick={() => setSelectedVerse(null)}
            className="flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-colors hover:bg-black/5"
          >
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color || t.accentSubtle }}
            >
              <Icon size={18} color={color ? '#92400E' : t.accent} strokeWidth={2} />
            </div>
            <span className="text-xs font-medium" style={{ color: t.textSecondary }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Home Screen
  const HomeScreen = () => (
    <div className="flex-1 overflow-auto">
      <div className="px-6 pt-4 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: t.textTertiary }}>
              {greeting.emoji} {greeting.text}
            </p>
            <h1 className="text-[28px] font-bold tracking-tight font-serif" style={{ color: t.text }}>
              Lafwa
            </h1>
          </div>
          <button 
            onClick={() => setDark(!dark)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: t.surfaceHover }}
          >
            {dark ? <Sun size={18} color={t.textSecondary} /> : <Moon size={18} color={t.textSecondary} />}
          </button>
        </div>

        {/* Verse of the Day */}
        <div 
          className="rounded-3xl p-6 mb-8 relative overflow-hidden"
          style={{ 
            background: t.gradient,
            border: `1px solid ${t.border}`,
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} color={t.accent} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: t.accent }}>
              Vès Jounen An
            </span>
          </div>
          
          <p className="text-[22px] leading-relaxed mb-4 font-serif" style={{ color: t.text }}>
            "Pawòl la tounen moun. Li te vin viv nan mitan nou..."
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: t.textSecondary }}>
              Jan 1:14
            </span>
            <div className="flex gap-1">
              <button 
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: t.accentSubtle }}
              >
                <Bookmark size={16} color={t.accent} />
              </button>
              <button 
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: t.accentSubtle }}
              >
                <Share2 size={16} color={t.accent} />
              </button>
            </div>
          </div>
        </div>

        {/* Continue Reading */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: t.textTertiary }}>
            KONTINYE
          </h2>
          <button 
            onClick={() => { setTab('bible'); setBook(bibleBooks.NT[3]); setChapter(1); }}
            className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[0.99] active:scale-[0.97]"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadow }}
          >
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: t.accentSubtle }}
            >
              <BookOpen size={22} color={t.accent} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold mb-0.5" style={{ color: t.text }}>Jan 1</p>
              <p className="text-sm" style={{ color: t.textTertiary }}>Vèsè 14 · 2 minit pase</p>
            </div>
            <ChevronRight size={18} color={t.textTertiary} />
          </button>
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-semibold mb-4 tracking-wide" style={{ color: t.textTertiary }}>
          AKSYON RAPID
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: 'Bib la', desc: '66 liv', action: () => setTab('bible') },
            { icon: Music, label: 'Kantik', desc: '800+ chante', action: () => setTab('hymns') },
            { icon: Search, label: 'Chèche', desc: 'Bib & Kantik', action: () => setTab('more') },
            { icon: Heart, label: 'Favori', desc: '8 atik', action: () => setTab('more') },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-start p-5 rounded-2xl transition-all hover:scale-[0.98] active:scale-[0.95]"
              style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, boxShadow: t.shadow }}
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: t.accentSubtle }}
              >
                <Icon size={20} color={t.accent} />
              </div>
              <p className="font-semibold mb-0.5" style={{ color: t.text }}>{label}</p>
              <p className="text-xs" style={{ color: t.textTertiary }}>{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Book Picker
  const BookPicker = () => (
    <div className="flex-1 overflow-auto">
      <div 
        className="sticky top-0 z-10 px-6 pt-4 pb-4"
        style={{ backgroundColor: t.bg }}
      >
        <div className="flex items-center gap-4 mb-5">
          <button onClick={() => setScreen('main')} className="p-1">
            <ChevronLeft size={24} color={t.text} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: t.text }}>Chwazi Liv</h1>
        </div>
        
        <div 
          className="flex p-1 rounded-xl"
          style={{ backgroundColor: t.surfaceHover }}
        >
          {['Ansyen', 'Nouvo'].map((label, i) => (
            <button
              key={label}
              onClick={() => setTestament(i === 0 ? 'OT' : 'NT')}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ 
                backgroundColor: (i === 0 ? testament === 'OT' : testament === 'NT') ? t.surface : 'transparent',
                color: (i === 0 ? testament === 'OT' : testament === 'NT') ? t.text : t.textTertiary,
                boxShadow: (i === 0 ? testament === 'OT' : testament === 'NT') ? t.shadow : 'none'
              }}
            >
              {label} Testaman
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-6 pb-28 grid grid-cols-2 gap-3">
        {bibleBooks[testament].map((b) => (
          <button
            key={b.id}
            onClick={() => setBook(b)}
            className="p-4 rounded-2xl text-left transition-all hover:scale-[0.98] active:scale-[0.95]"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
          >
            <p className="font-semibold mb-1" style={{ color: t.text }}>{b.name}</p>
            <p className="text-xs" style={{ color: t.textTertiary }}>{b.chapters} chapit</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Chapter Picker
  const ChapterPicker = () => (
    <div className="flex-1 overflow-auto">
      <div 
        className="sticky top-0 z-10 px-6 pt-4 pb-4 flex items-center gap-4"
        style={{ backgroundColor: t.bg }}
      >
        <button onClick={() => setBook(null)} className="p-1">
          <ChevronLeft size={24} color={t.text} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: t.text }}>{book.name}</h1>
      </div>
      
      <div className="px-6 pb-28 grid grid-cols-5 gap-2">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
          <button
            key={c}
            onClick={() => setChapter(c)}
            className="aspect-square rounded-xl flex items-center justify-center font-semibold text-sm transition-all hover:scale-95 active:scale-90"
            style={{ 
              backgroundColor: c === 1 ? t.accent : t.surface,
              color: c === 1 ? '#fff' : t.text,
              border: c === 1 ? 'none' : `1px solid ${t.border}`
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );

  // Reading View
  const ReadingView = () => (
    <div className="flex-1 overflow-auto relative">
      <div 
        className="sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ backgroundColor: t.bg }}
      >
        <button onClick={() => setChapter(null)} className="p-2">
          <ChevronLeft size={22} color={t.text} />
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: t.surfaceHover }}>
          <span className="font-semibold text-sm" style={{ color: t.text }}>{book.name} {chapter}</span>
          <ChevronRight size={14} color={t.textTertiary} className="rotate-90" />
        </button>
        <button 
          onClick={() => setLang(lang === 'ht' ? 'fr' : 'ht')}
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: t.accentSubtle, color: t.accent }}
        >
          {lang.toUpperCase()}
        </button>
      </div>
      
      <div className="px-6 pt-2 pb-28">
        {sampleVerses.map((v) => (
          <p 
            key={v.verse}
            onClick={() => setSelectedVerse(selectedVerse === v.verse ? null : v.verse)}
            className="mb-1 py-2 px-2 -mx-2 rounded-lg transition-colors cursor-pointer"
            style={{ 
              fontSize: fontSizes[fontSize],
              lineHeight: 1.75,
              color: t.text,
              backgroundColor: selectedVerse === v.verse ? t.accentSubtle : 'transparent',
            }}
          >
            <sup 
              className="font-bold mr-1.5"
              style={{ fontSize: 11, color: t.accent }}
            >
              {v.verse}
            </sup>
            <span className="font-serif">{v.text}</span>
          </p>
        ))}
      </div>
      
      {selectedVerse && <ActionSheet />}
    </div>
  );

  // Bible Tab
  const BibleScreen = () => {
    if (chapter) return <ReadingView />;
    if (book) return <ChapterPicker />;
    return <BookPicker />;
  };

  // Hymn List
  const HymnList = () => (
    <div className="flex-1 overflow-auto">
      <div 
        className="sticky top-0 z-10 px-6 pt-4 pb-4"
        style={{ backgroundColor: t.bg }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold font-serif" style={{ color: t.text }}>Chant d'Espérance</h1>
          <button 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: t.surfaceHover }}
          >
            <Search size={18} color={t.textSecondary} />
          </button>
        </div>
        
        {/* Quick jump hint */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ backgroundColor: t.surfaceHover }}
        >
          <span className="text-2xl">🎹</span>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: t.text }}>Antre nimewo kantik la</p>
            <p className="text-xs" style={{ color: t.textTertiary }}>Tape nenpòt nimewo pou ale dirèk</p>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-28">
        {hymns.map((h, i) => (
          <button
            key={h.id}
            onClick={() => setHymn(h)}
            className="w-full flex items-center gap-4 py-4 transition-colors"
            style={{ borderBottom: i < hymns.length - 1 ? `1px solid ${t.border}` : 'none' }}
          >
            <div 
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
              style={{ backgroundColor: t.accent, color: '#fff' }}
            >
              {h.id}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold truncate mb-0.5" style={{ color: t.text }}>{h.title}</p>
              <p className="text-sm truncate" style={{ color: t.textTertiary }}>{h.subtitle}</p>
            </div>
            {h.favorite && <Heart size={16} color="#EF4444" fill="#EF4444" />}
            <ChevronRight size={16} color={t.textTertiary} />
          </button>
        ))}
      </div>
    </div>
  );

  // Hymn Detail
  const HymnDetail = () => (
    <div className="flex-1 overflow-auto">
      <div 
        className="sticky top-0 z-10 px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ backgroundColor: t.bg }}
      >
        <button onClick={() => setHymn(null)} className="p-2">
          <ChevronLeft size={22} color={t.text} />
        </button>
        <span className="font-bold" style={{ color: t.textSecondary }}>#{hymn.id}</span>
        <div className="flex gap-1">
          <button className="p-2">
            <Heart size={20} color="#EF4444" fill={hymn.favorite ? "#EF4444" : "none"} />
          </button>
          <button 
            onClick={() => { setPresenting(true); setSlideIndex(0); }}
            className="p-2"
          >
            <Maximize2 size={20} color={t.accent} />
          </button>
        </div>
      </div>
      
      <div className="px-6 pt-4 pb-28">
        <div className="text-center mb-10">
          <p 
            className="text-6xl font-bold mb-3 font-serif"
            style={{ color: t.accent }}
          >
            {hymn.id}
          </p>
          <h1 
            className="text-2xl font-bold font-serif"
            style={{ color: t.text }}
          >
            {hymn.title}
          </h1>
        </div>
        
        <div className="space-y-8">
          {hymnSections.map((section, idx) => (
            <div key={idx}>
              <p 
                className="text-xs font-bold tracking-wider mb-3"
                style={{ color: section.type === 'refrain' ? t.accent : t.textTertiary }}
              >
                {section.type === 'refrain' ? 'REFREN' : `VÈSÈ ${section.num}`}
              </p>
              <p 
                className="whitespace-pre-line font-serif"
                style={{ 
                  fontSize: fontSizes[fontSize],
                  lineHeight: 1.8,
                  color: t.text,
                  paddingLeft: section.type === 'refrain' ? 16 : 0,
                  borderLeft: section.type === 'refrain' ? `3px solid ${t.accent}` : 'none'
                }}
              >
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Hymns Tab
  const HymnsScreen = () => {
    if (hymn) return <HymnDetail />;
    return <HymnList />;
  };

  // More Tab
  const MoreScreen = () => (
    <div className="flex-1 overflow-auto px-6 pt-4 pb-28">
      <h1 className="text-xl font-bold mb-6" style={{ color: t.text }}>Plis</h1>
      
      {/* Search */}
      <button 
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl mb-8"
        style={{ backgroundColor: t.surfaceHover }}
      >
        <Search size={20} color={t.textTertiary} />
        <span style={{ color: t.textTertiary }}>Chèche nan Bib la ak Kantik yo...</span>
      </button>
      
      {/* Library */}
      <h2 className="text-sm font-semibold mb-3 tracking-wide" style={{ color: t.textTertiary }}>
        BIBLIYOTÈK
      </h2>
      <div 
        className="rounded-2xl overflow-hidden mb-8"
        style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
      >
        {[
          { icon: BookMarked, label: 'Makè', count: 12 },
          { icon: Highlighter, label: 'Sikle', count: 24 },
          { icon: Heart, label: 'Favori', count: 8 },
          { icon: Clock, label: 'Istwa', count: null },
        ].map(({ icon: Icon, label, count }, i, arr) => (
          <button
            key={label}
            className="w-full flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}
          >
            <Icon size={20} color={t.accent} />
            <span className="flex-1 text-left font-medium" style={{ color: t.text }}>{label}</span>
            {count && <span className="text-sm" style={{ color: t.textTertiary }}>{count}</span>}
            <ChevronRight size={16} color={t.textTertiary} />
          </button>
        ))}
      </div>
      
      {/* Settings */}
      <h2 className="text-sm font-semibold mb-3 tracking-wide" style={{ color: t.textTertiary }}>
        PARAMÈT
      </h2>
      <div 
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
      >
        {[
          { icon: Type, label: 'Gwosè Tèks', value: ['XS', 'S', 'M', 'L', 'XL'][fontSize] },
          { icon: dark ? Moon : Sun, label: 'Tèm', value: dark ? 'Fènwa' : 'Limyè', action: () => setDark(!dark) },
          { icon: Settings, label: 'Tout Paramèt', value: null },
        ].map(({ icon: Icon, label, value, action }, i, arr) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${t.border}` : 'none' }}
          >
            <Icon size={20} color={t.accent} />
            <span className="flex-1 text-left font-medium" style={{ color: t.text }}>{label}</span>
            {value && <span className="text-sm" style={{ color: t.textTertiary }}>{value}</span>}
            <ChevronRight size={16} color={t.textTertiary} />
          </button>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'home', icon: Home, label: 'Lakay' },
    { id: 'bible', icon: BookOpen, label: 'Bib la' },
    { id: 'hymns', icon: Music, label: 'Kantik' },
    { id: 'more', icon: MoreHorizontal, label: 'Plis' },
  ];

  return (
    <div className="w-full h-screen flex items-center justify-center bg-zinc-900 p-4">
      {/* Phone Frame */}
      <div 
        className="relative w-full max-w-sm h-full max-h-[780px] rounded-[52px] overflow-hidden"
        style={{ 
          backgroundColor: t.bg,
          boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Bezel */}
        <div 
          className="absolute inset-0 rounded-[52px] pointer-events-none z-50"
          style={{ boxShadow: 'inset 0 0 0 10px #1a1a1a' }}
        />
        
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-50" />
        
        {/* Screen */}
        <div className="w-full h-full flex flex-col pt-14">
          {tab === 'home' && <HomeScreen />}
          {tab === 'bible' && <BibleScreen />}
          {tab === 'hymns' && <HymnsScreen />}
          {tab === 'more' && <MoreScreen />}
          
          {/* Tab Bar */}
          <div 
            className="absolute bottom-0 left-0 right-0 flex items-end justify-around px-6 pb-9 pt-2"
            style={{ 
              background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
            }}
          >
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  setTab(id);
                  setBook(null);
                  setChapter(null);
                  setHymn(null);
                  setSelectedVerse(null);
                }}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{ 
                    backgroundColor: tab === id ? t.accentSubtle : 'transparent',
                    transform: tab === id ? 'scale(1)' : 'scale(0.95)'
                  }}
                >
                  <Icon 
                    size={22} 
                    color={tab === id ? t.accent : t.textTertiary}
                    strokeWidth={tab === id ? 2.25 : 1.75}
                  />
                </div>
                <span 
                  className="text-[10px] font-semibold transition-colors"
                  style={{ color: tab === id ? t.accent : t.textTertiary }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
