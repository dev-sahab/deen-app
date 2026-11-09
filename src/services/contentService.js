import { File, Directory, Paths } from 'expo-file-system';

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
