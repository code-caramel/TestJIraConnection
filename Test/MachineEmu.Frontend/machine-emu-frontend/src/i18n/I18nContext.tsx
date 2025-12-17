import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import en from './translations/en.json';
import de from './translations/de.json';
import it from './translations/it.json';
import sq from './translations/sq.json';

export type Language = 'en' | 'de' | 'it' | 'sq';

export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
];

type TranslationObject = typeof en;

const translations: Record<Language, TranslationObject> = {
  en,
  de,
  it,
  sq,
};

const STORAGE_KEY = 'machineEmulator_language';
const DEFAULT_LANGUAGE: Language = 'de';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return typeof result === 'string' ? result : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get saved language from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === 'en' || saved === 'de' || saved === 'it' || saved === 'sq')) {
      return saved as Language;
    }

    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'de' || browserLang === 'it' || browserLang === 'sq') {
      return browserLang as Language;
    }

    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    // First try current language
    const translation = getNestedValue(translations[language], key);
    if (translation) {
      return translation;
    }

    // Fallback to English
    if (language !== 'en') {
      const englishTranslation = getNestedValue(translations.en, key);
      if (englishTranslation) {
        return englishTranslation;
      }
    }

    // Return fallback or key itself
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nContext;
