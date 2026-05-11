import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const MYMEMORY_LANG: Record<Language, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh-CN",
  ru: "ru",
};

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
const hasHangul = (value: string) => /[가-힣]/.test(value);
const hasKana = (value: string) => /[\u3040-\u30ff]/.test(value);
const hasCjk = (value: string) => /[\u3400-\u9fff]/.test(value);
const hasCyrillic = (value: string) => /[\u0400-\u04ff]/.test(value);
const hasLatin = (value: string) => /[A-Za-z]/.test(value);

export const shouldOfferMessageTranslation = (text: string, lang: Language) => {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("[img:")) return false;
  if (lang === "ko") return !hasHangul(trimmed);
  if (lang === "ja") return !hasKana(trimmed);
  if (lang === "zh") return !(hasCjk(trimmed) && !hasHangul(trimmed) && !hasKana(trimmed));
  if (lang === "ru") return !hasCyrillic(trimmed);
  if (lang === "en") {
    return !(hasLatin(trimmed) && !hasHangul(trimmed) && !hasKana(trimmed) && !hasCjk(trimmed) && !hasCyrillic(trimmed));
  }
  return false;
};

async function fetchGoogleTranslation(text: string, targetLang: string): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Google translation failed");
  const json = await res.json();
  const translated = Array.isArray(json?.[0])
    ? json[0].map((part: unknown[]) => part?.[0]).filter(Boolean).join("")
    : "";
  return typeof translated === "string" ? translated.trim() : "";
}

async function fetchMyMemoryTranslation(text: string, targetLang: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("MyMemory translation failed");
  const json = await res.json();
  const translated: string = json?.responseData?.translatedText ?? "";
  if (/invalid source language|langpair|rfc3066|almost all languages|no content/i.test(translated)) return "";
  return translated.trim();
}

async function fetchTranslation(text: string, targetLang: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("[img:")) return "";

  const candidates = [
    () => fetchGoogleTranslation(trimmed, targetLang),
    () => fetchMyMemoryTranslation(trimmed, targetLang),
  ];

  for (const fetcher of candidates) {
    try {
      const translated = await fetcher();
      if (translated && normalize(translated) !== normalize(trimmed)) return translated;
    } catch {
      // Try the next translation provider.
    }
  }

  return "";
}

export function useMessageTranslation() {
  const { lang } = useLanguage();
  const targetCode = MYMEMORY_LANG[lang];

  const [translated, setTranslated] = useState<Record<string | number, string>>({});
  const [errors, setErrors] = useState<Record<string | number, string>>({});
  const [loading, setLoading] = useState<Set<string | number>>(new Set());
  const [autoTranslate, setAutoTranslate] = useState(false);
  const pendingRef = useRef<Set<string | number>>(new Set());

  useEffect(() => {
    setTranslated({});
    setErrors({});
    setLoading(new Set());
    pendingRef.current.clear();
  }, [targetCode]);

  const translate = useCallback(async (id: string | number, text: string) => {
    // toggle off if already translated
    if (translated[id]) {
      setTranslated((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    if (!shouldOfferMessageTranslation(text, lang)) {
      setTranslated((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setLoading((prev) => new Set(prev).add(id));
    try {
      const result = await fetchTranslation(text, targetCode);
      if (result) {
        setTranslated((prev) => ({ ...prev, [id]: result }));
      } else {
        setTranslated((prev) => { const n = { ...prev }; delete n[id]; return n; });
        setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
      }
    } catch {
      setTranslated((prev) => { const n = { ...prev }; delete n[id]; return n; });
      setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
    pendingRef.current.delete(id);
    setLoading((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [lang, translated, targetCode]);

  const autoTranslateMessages = useCallback(async (
    messages: Array<{ id: string | number; content: string; isIncoming: boolean }>,
  ) => {
    for (const m of messages) {
      if (!m.isIncoming) continue;
      if (!shouldOfferMessageTranslation(m.content, lang)) continue;
      if (translated[m.id] || errors[m.id] || pendingRef.current.has(m.id)) continue;
      pendingRef.current.add(m.id);
      setLoading((prev) => new Set(prev).add(m.id));
      try {
        const result = await fetchTranslation(m.content, targetCode);
        if (result) setTranslated((prev) => ({ ...prev, [m.id]: result }));
      } catch {
        // Automatic translation should stay quiet; manual tap can show the error.
      }
      pendingRef.current.delete(m.id);
      setLoading((prev) => { const n = new Set(prev); n.delete(m.id); return n; });
    }
  }, [errors, lang, translated, targetCode]);

  return { translated, errors, loading, autoTranslate, setAutoTranslate, translate, autoTranslateMessages };
}
