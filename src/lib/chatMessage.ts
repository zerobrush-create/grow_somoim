const REPLY_PREFIX = "__GROW_REPLY__";
export const MESSAGE_DELETE_WINDOW_MS = 5 * 60 * 1000;

export type ReplyTarget = {
  id: number;
  senderName: string;
  body: string;
};

export type ParsedChatMessage = {
  body: string;
  replyTo: ReplyTarget | null;
};

const truncate = (value: string, max = 80) => {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max - 1)}...` : compact;
};

export const parseChatMessageContent = (content: string): ParsedChatMessage => {
  if (!content.startsWith(REPLY_PREFIX)) return { body: content, replyTo: null };

  const lineBreakIndex = content.indexOf("\n");
  if (lineBreakIndex < 0) return { body: content, replyTo: null };

  try {
    const rawMeta = content.slice(REPLY_PREFIX.length, lineBreakIndex);
    const meta = JSON.parse(rawMeta) as Partial<ReplyTarget>;
    const body = content.slice(lineBreakIndex + 1);
    if (typeof meta.id !== "number" || typeof meta.senderName !== "string" || typeof meta.body !== "string") {
      return { body: content, replyTo: null };
    }
    return {
      body,
      replyTo: {
        id: meta.id,
        senderName: meta.senderName,
        body: meta.body,
      },
    };
  } catch {
    return { body: content, replyTo: null };
  }
};

export const getMessagePreview = (content: string) => {
  const { body } = parseChatMessageContent(content);
  if (body.startsWith("[img:")) return "이미지";
  return truncate(body || "메시지");
};

export const encodeReplyMessageContent = (body: string, replyTo: ReplyTarget | null) => {
  if (!replyTo) return body;
  const meta = JSON.stringify({
    id: replyTo.id,
    senderName: truncate(replyTo.senderName, 40),
    body: truncate(replyTo.body, 120),
  });
  return `${REPLY_PREFIX}${meta}\n${body}`;
};

export const canDeleteMessage = (createdAt: string, now = Date.now()) => {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created <= MESSAGE_DELETE_WINDOW_MS;
};
