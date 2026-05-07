import type { Language } from "./translations";
import { translateRuntimeText } from "./runtimeTranslations";

export const languageLocales: Record<Language, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-CN",
  ru: "ru-RU",
};

export const displayText = (value: string | null | undefined, lang: Language) =>
  value ? translateRuntimeText(value, lang) : "";

export const formatDate = (value: string | Date, lang: Language, options?: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleDateString(languageLocales[lang], options);

export const formatDateTime = (value: string | Date, lang: Language, options?: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleString(languageLocales[lang], options);

export const formatMonthTitle = (year: number, monthIndex: number, lang: Language) =>
  new Intl.DateTimeFormat(languageLocales[lang], { year: "numeric", month: "long" }).format(new Date(year, monthIndex, 1));

export const weekdayLabels = (lang: Language, format: "short" | "narrow" = "short") => {
  const base = new Date(2026, 1, 1); // Sunday
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(languageLocales[lang], { weekday: format }).format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + index))
  );
};
