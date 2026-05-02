import { createContext, useContext, useState, ReactNode } from "react";
import { Language, translations, Translations } from "@/i18n/translations";

type LanguageContextValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => (localStorage.getItem("grow_lang") as Language) ?? "ko");

  const setLang = (l: Language) => {
    localStorage.setItem("grow_lang", l);
    setLangState(l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
