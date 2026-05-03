import { useCallback, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const MYMEMORY_LANG: Record<Language, string> = {
  ko: "ko",
  en: "en",
  ja: "ja",
  zh: "zh-CN",
  ru: "ru",
};

async function fetchTranslation(text: string, targetLang: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Translation failed");
  const json = await res.json();
  const translated: string = json?.responseData?.translatedText ?? "";
  if (!translated || translated.toLowerCase() === text.toLowerCase()) return "";
  return translated;
}

export function useMessageTranslation() {
  const { lang } = useLanguage();
  const targetCode = MYMEMORY_LANG[lang];

  const [translated, setTranslated] = useState<Record<string | number, string>>({});
  const [loading, setLoading] = useState<Set<string | number>>(new Set());
  const [autoTranslate, setAutoTranslate] = useState(false);
  const pendingRef = useRef<Set<string | number>>(new Set());

  const translate = useCallback(async (id: string | number, text: string) => {
    // toggle off if already translated
    if (translated[id]) {
      setTranslated((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setLoading((prev) => new Set(prev).add(id));
    try {
      const result = await fetchTranslation(text, targetCode);
      if (result) setTranslated((prev) => ({ ...prev, [id]: result }));
    } catch {}
    pendingRef.current.delete(id);
    setLoading((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [translated, targetCode]);

  const autoTranslateMessages = useCallback(async (
    messages: Array<{ id: string | number; content: string; isIncoming: boolean }>,
  ) => {
    for (const m of messages) {
      if (!m.isIncoming) continue;
      if (m.content.startsWith("[img:")) continue;
      if (translated[m.id] || pendingRef.current.has(m.id)) continue;
      pendingRef.current.add(m.id);
      setLoading((prev) => new Set(prev).add(m.id));
      try {
        const result = await fetchTranslation(m.content, targetCode);
        if (result) setTranslated((prev) => ({ ...prev, [m.id]: result }));
      } catch {}
      pendingRef.current.delete(m.id);
      setLoading((prev) => { const n = new Set(prev); n.delete(m.id); return n; });
    }
  }, [translated, targetCode]);

  return { translated, loading, autoTranslate, setAutoTranslate, translate, autoTranslateMessages };
}
