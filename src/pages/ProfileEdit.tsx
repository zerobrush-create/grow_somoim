import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const INTEREST_OPTIONS = ["운동", "음악", "독서", "여행", "요리", "사진", "게임", "영화", "공부", "봉사", "재테크", "반려동물"];
const MBTI = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [mbti, setMbti] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-edit", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setMbti(profile.mbti ?? "");
    setInterests(profile.interests ?? []);
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      const { error } = await supabase.from("profiles").update({
        name, bio, location, mbti, interests, avatar_url: avatarUrl,
      }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "저장되었어요" }); qc.invalidateQueries({ queryKey: ["profile-edit", user?.id] }); navigate("/profile"); },
    onError: (e: Error) => toast({ title: "저장 실패", description: e.message, variant: "destructive" }),
  });

  const onUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(pub.publicUrl);
    } catch (e: any) {
      toast({ title: "업로드 실패", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleInterest = (i: string) => setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">프로필 편집</h1>
        </header>

        <div className="p-4 space-y-5">
          <div className="flex justify-center">
            <button onClick={() => fileRef.current?.click()} className="relative" disabled={uploading}>
              <div className="h-24 w-24 rounded-full bg-muted overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-muted-foreground">No Image</div>}
              </div>
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Camera className="h-4 w-4" /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
          </div>

          <div className="space-y-1.5"><Label htmlFor="name">이름</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="bio">자기소개</Label><Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
          <div className="space-y-1.5"><Label htmlFor="loc">지역</Label><Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="예: 서울 마포구" /></div>

          <div className="space-y-2">
            <Label>MBTI</Label>
            <div className="grid grid-cols-4 gap-2">
              {MBTI.map((m) => (
                <button key={m} type="button" onClick={() => setMbti(m === mbti ? "" : m)} className={`py-2 rounded-lg text-xs font-semibold transition-smooth ${m === mbti ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>관심사</Label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((i) => {
                const active = interests.includes(i);
                return (
                  <button key={i} type="button" onClick={() => toggleInterest(i)}>
                    <Badge variant={active ? "default" : "outline"} className={active ? "bg-primary text-primary-foreground" : ""}>{i}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full h-12 gradient-primary shadow-glow">
            {save.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;