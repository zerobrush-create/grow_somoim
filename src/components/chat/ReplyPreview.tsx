import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReplyTarget } from "@/lib/chatMessage";

type ReplyPreviewProps = {
  reply: ReplyTarget;
  mine?: boolean;
  onCancel?: () => void;
  compact?: boolean;
};

export const ReplyPreview = ({ reply, mine, onCancel, compact }: ReplyPreviewProps) => (
  <div
    className={cn(
      "max-w-full rounded-xl border border-primary/10 bg-primary/5 px-3 py-2 text-left",
      mine ? "rounded-br-sm" : "rounded-bl-sm",
      compact && "rounded-lg bg-muted/80 px-2.5 py-2",
    )}
  >
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1 border-l-2 border-primary/50 pl-2">
        <p className="text-[10px] font-bold text-primary truncate">{reply.senderName}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{reply.body}</p>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="답글 취소"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  </div>
);
