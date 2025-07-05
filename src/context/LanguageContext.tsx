'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { en } from '@/locales/en';
import { tr } from '@/locales/tr';

const translations = {
  en,
  tr,
};

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
};

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
];

type Translations = typeof en;

type LanguageContextType = {
  language: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  languages: LanguageOption[];
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<LanguageOption>(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        return JSON.parse(savedLanguage);
      }
      // Try to use browser language if available
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = languages.find(lang => lang.code === browserLang);
      if (supportedLang) return supportedLang;
    }
    return languages[0]; // Default to English
  });

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language.code];
    
    for (const k of keys) {
      value = value[k];
      if (!value) return key;
    }
    
    return value;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLanguage', JSON.stringify(language));
      document.documentElement.lang = language.code;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, languages, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 