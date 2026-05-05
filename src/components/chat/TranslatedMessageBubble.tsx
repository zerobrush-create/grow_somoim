import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

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
        {isTranslating ? "번역 중..." : translatedText ? "번역 숨기기" : "번역 보기"}
      </button>

      {translatedText && (
        <div
          className={cn(
            "max-w-full rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs text-foreground shadow-sm",
            mine ? "rounded-br-sm" : "rounded-bl-sm",
          )}
        >
          <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold text-primary">
            <span className="rounded bg-primary/10 px-1">AI</span>
            <span>번역</span>
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed">{translatedText}</p>
        </div>
      )}
    </div>
  );
};
