type ShareLinkInput = {
  title?: string;
  text?: string;
  url: string;
};

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

export const shareOrCopyLink = async ({ title, text, url }: ShareLinkInput) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, action: "shared" as const };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { ok: false, action: "cancelled" as const };
      }
    }
  }

  const copied = await copyTextToClipboard(url);
  return { ok: copied, action: copied ? ("copied" as const) : ("failed" as const) };
};
