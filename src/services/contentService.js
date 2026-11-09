import { File, Directory, Paths } from 'expo-file-system';
import hadithBooks from '../data/hadithBooks.json';

const QURAN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';
const HADITH = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
// Fallback mirror recommended by the API author
const QURAN_FALLBACK = 'https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions';
const HADITH_FALLBACK = 'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions';

const memory = new Map();

const cacheFile = (key) => {
  try {
    const dir = new Directory(Paths.document, 'content-cache');
    if (!dir.exists) dir.create({ intermediates: true });
    return new File(dir, `${key.replace(/[^a-z0-9-_]/gi, '_')}.json`);
  } catch {
    return null; // web / unsupported
  }
};

/** Fetch JSON with in-memory + on-disk cache so content works offline after first read. */
const getJson = async (key, urls) => {
  if (memory.has(key)) return memory.get(key);
  const file = cacheFile(key);
  if (file?.exists) {
    try {
      const data = JSON.parse(await file.text());
      memory.set(key, data);
      return data;
    } catch {}
  }
  let lastErr;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const data = JSON.parse(text);
      memory.set(key, data);
      if (file) {
        try {
          await Promise.resolve(file.write(text));
        } catch {}
      }
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Network error');
};

export const QURAN_TRANSLATIONS = { bn: 'ben-abubakrzakaria', en: 'eng-mustafakhattaba' };
export const ARABIC_EDITIONS = {
  'ara-quranindopak': 'IndoPak',
  'ara-quranuthmanihaf': 'Uthmani (Hafs)',
};

const quranUrls = (edition, chapter) => [
  `${QURAN}/${edition}/${chapter}.min.json`,
  `${QURAN_FALLBACK}/${edition}/${chapter}.json`,
];

/** Returns [{ verse, arabic, translation }] for a surah. */
export const getSurah = async (chapter, { arabicEdition, lang, withTranslation = true }) => {
  // Values can arrive from deep links: only allow known surah numbers and editions in URLs.
  chapter = Number(chapter);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 114) throw new Error('Invalid surah');
  if (!ARABIC_EDITIONS[arabicEdition]) arabicEdition = 'ara-quranindopak';
  const tr = QURAN_TRANSLATIONS[lang] || QURAN_TRANSLATIONS.en;
  const [ar, trans] = await Promise.all([
    getJson(`q-${arabicEdition}-${chapter}`, quranUrls(arabicEdition, chapter)),
    withTranslation ? getJson(`q-${tr}-${chapter}`, quranUrls(tr, chapter)) : null,
  ]);
  return ar.chapter.map((v, i) => ({
    verse: v.verse,
    arabic: v.text,
    translation: trans?.chapter?.[i]?.text || '',
  }));
};

/** Hadiths of one book section, in Bangla or English. */
export const getHadithSection = async (book, section, lang) => {
  // book/section come from route params (deep links). Allow only bundled book ids and their
  // section numbers so a crafted link can't load arbitrary JSON under a trusted book title.
  const info = hadithBooks.find((b) => b.id === book);
  section = Number(section);
  if (!info || !info.sections.some((s) => s.n === section)) throw new Error('Invalid hadith section');
  const edition = (lang === 'bn' ? 'ben-' : 'eng-') + book;
  const data = await getJson(`h-${edition}-${section}`, [
    `${HADITH}/${edition}/sections/${section}.min.json`,
    `${HADITH_FALLBACK}/${edition}/sections/${section}.json`,
  ]);
  return data.hadiths.filter((h) => h.text && h.text.trim());
};

/** A deterministic "hadith of the day" from An-Nawawi's 40. */
export const getDailyHadith = async (lang) => {
  const list = await getHadithSection('nawawi', 1, lang);
  if (!list.length) return null;
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return list[dayIndex % list.length];
};
