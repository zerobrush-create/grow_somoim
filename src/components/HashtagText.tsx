import { Link } from "react-router-dom";
import { Fragment } from "react";

const HASHTAG_RE = /(#[\p{L}\p{N}_]+)/gu;

export const HashtagText = ({ text, className }: { text: string; className?: string }) => {
  if (!text) return null;
  const parts = text.split(HASHTAG_RE);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <Link key={i} to={`/tags/${encodeURIComponent(part.slice(1))}`} className="text-primary hover:underline">{part}</Link>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </span>
  );
};

export const extractHashtags = (text: string): string[] => {
  const matches = text.match(HASHTAG_RE) ?? [];
  return Array.from(new Set(matches.map((t) => t.slice(1).toLowerCase())));
};
