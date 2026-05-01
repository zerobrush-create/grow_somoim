import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const MentionInput = ({ value, onChange, placeholder, maxLength, className }: Props) => {
  const [suggestions, setSuggestions] = useState<{ id: string; nickname: string | null; name: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const m = value.match(/@([\p{L}\p{N}_]{1,20})$/u);
    if (m) { setQuery(m[1]); setOpen(true); } else { setOpen(false); }
  }, [value]);

  useEffect(() => {
    if (!open || !query) { setSuggestions([]); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase.from("profiles").select("id,nickname,name").ilike("nickname", `${query}%`).limit(5);
      if (!cancel) setSuggestions(data ?? []);
    })();
    return () => { cancel = true; };
  }, [query, open]);

  const pick = (nick: string) => {
    const replaced = value.replace(/@([\p{L}\p{N}_]{1,20})$/u, `@${nick} `);
    onChange(replaced);
    setOpen(false);
    ref.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-md p-1">
          {suggestions.map((s) => (
            <button key={s.id} type="button" onMouseDown={(e) => { e.preventDefault(); pick(s.nickname || s.name || ""); }} className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded">
              <span className="text-primary font-medium">@{s.nickname}</span>
              {s.name && <span className="text-muted-foreground ml-2 text-xs">{s.name}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
