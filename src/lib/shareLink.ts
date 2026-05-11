type ShareLinkInput = {
  title?: string;
  text?: string;
  url: string;
};

type ShareLinkResult =
  | { ok: true; action: "shared" | "copied" }
  | { ok: false; action: "cancelled" | "failed" };

export const copyTextToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the selection-based copy path below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
};

const isUserCancelledShare = (error: unknown) => {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes("abort") || message.includes("cancel");
};

export const shareOrCopyLink = async ({ title, text, url }: ShareLinkInput): Promise<ShareLinkResult> => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, action: "shared" as const };
    } catch (error) {
      if (isUserCancelledShare(error)) {
        return { ok: false, action: "cancelled" as const };
      }

      // Mobile in-app browsers can reject after handing off to an external app.
      // In that case the user has already seen the native share sheet, so avoid
      // a noisy clipboard fallback/error toast.
      return { ok: false, action: "cancelled" as const };
    }
  }

  const copied = await copyTextToClipboard(url);
  return { ok: copied, action: copied ? ("copied" as const) : ("failed" as const) };
};
