import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const MapLink = ({ location, label, className }: { location: string; label?: string; className?: string }) => {
  const url = `https://map.kakao.com/?q=${encodeURIComponent(location)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn("inline-flex items-center gap-1 hover:underline", className)}
    >
      <MapPin className="h-3 w-3 shrink-0" />
      <span className="truncate">{label ?? location}</span>
      <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
    </a>
  );
};
