import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = ["운동", "스터디", "취미", "맛집", "여행", "음악", "반려동물"];

const GroupEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ["group-edit", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    if (!group) return;
    setName(group.name ?? "");
    setCategory(group.category ?? "");
    setLocation(group.location ?? "");
    setDescription(group.description ?? "");
    setMaxMembers(group.max_members ? String(group.max_members) : "");
    setIsPrivate(!!group.is_private);
  }, [group]);

  const update = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("권한이 없습니다");
      if (name.trim().length < 2) throw new Error("이름은 2자 이상이어야 해요");
      const { error } = await supabase
        .from("groups")
        .update({
          name: name.trim(),
          category,
          location: location.trim() || null,
          description: description.trim() || null,
          max_members: maxMembers ? Number(maxMembers) : null,
          is_private: isPrivate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "수정되었어요" });
      qc.invalidateQueries({ queryKey: ["group", id] });
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate(`/groups/${id}`);
    },
    onError: (e: Error) => toast({ title: "수정 실패", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("invalid");
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "모임이 삭제되었어요" });
      qc.invalidateQueries({ queryKey: ["groups"] });
      navigate("/groups");
    },
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  if (!loading && !user) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background mx-auto max-w-md p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!group) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">모임을 찾을 수 없어요</div>;
  }

  if (user && group.owner_id !== user.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">모임 오너만 수정할 수 있어요</p>
        <Button onClick={() => navigate(`/groups/${id}`)}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-28">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold flex-1">모임 수정</h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>모임을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  삭제하면 모든 멤버, 게시글, 채팅이 함께 사라지며 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); update.mutate(); }}
          className="px-4 pt-4 space-y-5"
        >
          <div className="space-y-2">
            <Label htmlFor="name">모임 이름</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
          </div>

          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button type="button" key={c} onClick={() => setCategory(c)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-smooth",
                    category === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-secondary"
                  )}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loc">활동 지역</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={60} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max">정원</Label>
            <Input id="max" inputMode="numeric" value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value.replace(/[^0-9]/g, ""))} maxLength={4} placeholder="제한 없음" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">소개</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={500} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <Label htmlFor="private">비공개 모임</Label>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40 p-3">
            <Button type="submit" disabled={update.isPending}
              className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95">
              {update.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupEdit;