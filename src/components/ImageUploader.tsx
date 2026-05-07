import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText } from "@/i18n/format";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket?: string;
  max?: number;
  className?: string;
}

export const ImageUploader = ({ value, onChange, bucket = "post-images", max = 5, className }: Props) => {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const tr = (value: string) => displayText(value, lang);

  const upload = async (files: FileList | null) => {
    if (!files || !user) return;
    if (value.length + files.length > max) {
      toast({ title: tr(`최대 ${max}장까지 업로드 가능해요`), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: `${file.name}: ${tr("5MB 이하만 가능해요")}`, variant: "destructive" });
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
      onChange([...value, ...newUrls]);
    } catch (e: any) {
      toast({ title: tr("업로드 실패"), description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div className={cn("space-y-2", className)}>
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url) => (
            <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => remove(url)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center" aria-label={tr("삭제")}>
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="w-full h-12 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:bg-muted transition-smooth">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? tr("업로드 중...") : `${tr("사진 추가")} (${value.length}/${max})`}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
    </div>
  );
};
