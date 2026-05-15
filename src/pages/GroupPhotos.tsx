import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

type Photo = { id: number; image_url: string; uploader_id: string; created_at: string };

const GroupPhotos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: group } = useQuery({
    queryKey: ["group-meta", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("groups").select("id,name,owner_id").eq("id", id!).maybeSingle()).data,
  });
  const { data: membership } = useQuery({
    queryKey: ["membership", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => (await supabase.from("memberships").select("status").eq("group_id", id!).eq("user_id", user!.id).maybeSingle()).data,
  });
  const isMember = membership?.status === "approved" || group?.owner_id === user?.id;
  const isOwner = group?.owner_id === user?.id;

  const { data: photos, isLoading } = useQuery({
    queryKey: ["group-photos", id],
    enabled: !!id,
    queryFn: async (): Promise<Photo[]> => {
      const { data, error } = await supabase
        .from("group_photos")
        .select("id,image_url,uploader_id,created_at")
        .eq("group_id", id!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!user || !id) throw new Error("로그인이 필요합니다");
      setUploading(true);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("group-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("group-images").getPublicUrl(path);
      const { error } = await supabase.from("group_photos").insert({
        group_id: id, uploader_id: user.id, image_url: pub.publicUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "사진이 업로드되었어요" }); qc.invalidateQueries({ queryKey: ["group-photos", id] }); },
    onError: (e: Error) => toast({ title: "업로드 실패", description: e.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const remove = useMutation({
    mutationFn: async (photoId: number) => {
      const { error } = await supabase.from("group_photos").delete().eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["group-photos", id] }),
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-24">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{group?.name ?? "사진첩"}</h1>
        </header>

        <div className="p-2">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-1"><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /></div>
          ) : photos && photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {photos.map((p) => (
                <div key={p.id} className="relative aspect-square group">
                  <img src={p.image_url} alt="모임 사진" loading="lazy" className="h-full w-full object-cover rounded-md" />
                  {(p.uploader_id === user?.id || isOwner) && (
                    <button onClick={() => remove.mutate(p.id)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth" aria-label="삭제">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">아직 사진이 없어요</div>
          )}
        </div>

        {isMember && (
          <>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.target.value = ""; }} />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading} className="fixed bottom-6 right-1/2 translate-x-[180px] h-14 w-14 rounded-full gradient-primary shadow-glow z-40" aria-label="업로드">
              <Plus className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupPhotos;
