jest.mock('expo-file-system', () => ({ File: jest.fn(), Directory: jest.fn(() => { throw new Error('no fs'); }), Paths: {} }));

import { getHadithSection, getSurah } from '../services/contentService';

describe('contentService input validation (deep-link params)', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async () => ({ ok: true, text: async () => JSON.stringify({ hadiths: [{ hadithnumber: 1, text: 'x' }] }) }));
  });

  it('rejects path traversal in hadith section', async () => {
    await expect(getHadithSection('bukhari', '../../../gh/evil/repo/x', 'bn')).rejects.toThrow('Invalid');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects unknown books', async () => {
    await expect(getHadithSection('evil', '1', 'bn')).rejects.toThrow('Invalid');
  });

  it('loads a valid section from the hadith CDN', async () => {
    const list = await getHadithSection('bukhari', '1', 'bn');
    expect(list).toHaveLength(1);
    expect(fetch.mock.calls[0][0]).toBe('https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-bukhari/sections/1.min.json');
  });

  it('rejects out-of-range surah numbers', async () => {
    await expect(getSurah('115', { arabicEdition: 'ara-quranindopak', lang: 'bn' })).rejects.toThrow('Invalid');
    await expect(getSurah('1/../../x', { arabicEdition: 'ara-quranindopak', lang: 'bn' })).rejects.toThrow('Invalid');
  });
});
