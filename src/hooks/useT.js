import { useAppStore } from '../store/useAppStore';
import { translations } from '../constants/translations';

export const useT = () => {
  const lang = useAppStore((s) => s.language);
  return { t: translations[lang] || translations.en, lang };
};
