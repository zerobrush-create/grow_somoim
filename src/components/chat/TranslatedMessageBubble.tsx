import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";

const LABELS: Record<Language, { translating: string; show: string; hide: string; ai: string; translation: string }> = {
  ko: { translating: "번역 중...", show: "번역 보기", hide: "번역 숨기기", ai: "AI", translation: "번역" },
  en: { translating: "Translating...", show: "Translate", hide: "Hide translation", ai: "AI", translation: "Translation" },
  ja: { translating: "翻訳中...", show: "翻訳を見る", hide: "翻訳を隠す", ai: "AI", translation: "翻訳" },
  zh: { translating: "翻译中...", show: "查看翻译", hide: "隐藏翻译", ai: "AI", translation: "翻译" },
  ru: { translating: "Перевод...", show: "Перевести", hide: "Скрыть перевод", ai: "AI", translation: "Перевод" },
};

type TranslatedMessageBubbleProps = {
  mine: boolean;
  content: string;
  translatedText?: string;
  isTranslating: boolean;
  onTranslate: () => void;
};

export const TranslatedMessageBubble = ({
  mine,
  content,
  translatedText,
  isTranslating,
  onTranslate,
}: TranslatedMessageBubbleProps) => {
  const { lang } = useLanguage();
  const labels = LABELS[lang];

  return (
    <div className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words text-left",
          mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {content}
      </div>

      <button
        type="button"
        onClick={onTranslate}
        disabled={isTranslating}
        className={cn(
          "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10px] font-semibold transition-smooth",
          translatedText
            ? "bg-primary-soft text-primary"
            : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
          isTranslating && "cursor-wait opacity-80",
        )}
      >
        <Languages className="h-3 w-3" />
        {isTranslating ? labels.translating : translatedText ? labels.hide : labels.show}
      </button>

      {translatedText && (
        <div
          className={cn(
            "max-w-full rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-foreground shadow-sm",
            mine ? "rounded-br-sm" : "rounded-bl-sm",
          )}
        >
          <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
            <span className="rounded bg-primary/10 px-1">{labels.ai}</span>
            <span>{labels.translation}</span>
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{translatedText}</p>
        </div>
      )}
    </div>
  );
};
