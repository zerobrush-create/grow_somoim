import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateRuntimeText } from "@/i18n/runtimeTranslations";

const textOrigins = new WeakMap<Text, string>();
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;

const shouldSkip = (node: Node) => {
  const parent = node.parentElement;
  return !!parent?.closest("script, style, code, pre, textarea, [data-i18n-skip]");
};

const translateTextNode = (node: Text, lang: ReturnType<typeof useLanguage>["lang"]) => {
  if (shouldSkip(node)) return;
  const current = node.nodeValue ?? "";
  let original = textOrigins.get(node) ?? current;
  if (/[가-힣]/.test(current) && current !== original) {
    original = current;
  }
  if (!textOrigins.has(node) || original === current) textOrigins.set(node, original);
  const next = translateRuntimeText(original, lang);
  if (node.nodeValue !== next) node.nodeValue = next;
};

const translateElementAttrs = (el: Element, lang: ReturnType<typeof useLanguage>["lang"]) => {
  if (el.closest("script, style, code, pre, [data-i18n-skip]")) return;
  for (const attr of ATTRS) {
    const current = el.getAttribute(attr);
    if (!current) continue;
    const dataAttr = `data-i18n-original-${attr}`;
    let original = el.getAttribute(dataAttr) ?? current;
    if (/[가-힣]/.test(current) && current !== original) {
      original = current;
    }
    if (!el.hasAttribute(dataAttr) || original === current) el.setAttribute(dataAttr, original);
    const next = translateRuntimeText(original, lang);
    if (current !== next) el.setAttribute(attr, next);
  }
};

const translateTree = (root: ParentNode, lang: ReturnType<typeof useLanguage>["lang"]) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node as Text, lang);
    node = walker.nextNode();
  }

  if (root instanceof Element) translateElementAttrs(root, lang);
  root.querySelectorAll?.("*").forEach((el) => translateElementAttrs(el, lang));
};

export const RuntimeI18n = () => {
  const { lang } = useLanguage();

  useEffect(() => {
    translateTree(document.body, lang);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          translateTextNode(record.target as Text, lang);
        }
        if (record.type === "attributes" && record.target instanceof Element) {
          translateElementAttrs(record.target, lang);
        }
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, lang);
          if (node instanceof Element) translateTree(node, lang);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
};
