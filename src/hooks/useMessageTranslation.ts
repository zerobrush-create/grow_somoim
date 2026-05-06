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

const TRANSLATION_EMPTY_MESSAGE: Record<Language, string> = {
  ko: "선택한 언어와 같은 메시지이거나 번역할 수 없는 문장이에요.",
  en: "This message is already in your selected language or cannot be translated.",
  ja: "選択中の言語と同じメッセージか、翻訳できない文です。",
  zh: "这条消息可能已经是所选语言，或无法翻译。",
  ru: "Сообщение уже на выбранном языке или его не удалось перевести.",
};

const TRANSLATION_FAILED_MESSAGE: Record<Language, string> = {
  ko: "번역을 불러오지 못했어요. 다시 시도해 주세요.",
  en: "Could not load translation. Please try again.",
  ja: "翻訳を読み込めませんでした。もう一度お試しください。",
  zh: "无法加载翻译，请重试。",
  ru: "Не удалось загрузить перевод. Попробуйте ещё раз.",
};

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

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
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setLoading((prev) => new Set(prev).add(id));
    try {
      const result = await fetchTranslation(text, targetCode);
      if (result) {
        setTranslated((prev) => ({ ...prev, [id]: result }));
      } else {
        setErrors((prev) => ({ ...prev, [id]: TRANSLATION_EMPTY_MESSAGE[lang] }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [id]: TRANSLATION_FAILED_MESSAGE[lang] }));
    }
    pendingRef.current.delete(id);
    setLoading((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, [lang, translated, targetCode]);

  const autoTranslateMessages = useCallback(async (
    messages: Array<{ id: string | number; content: string; isIncoming: boolean }>,
  ) => {
    for (const m of messages) {
      if (!m.isIncoming) continue;
      if (m.content.startsWith("[img:")) continue;
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
  }, [errors, translated, targetCode]);

  return { translated, errors, loading, autoTranslate, setAutoTranslate, translate, autoTranslateMessages };
}
