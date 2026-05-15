import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type Announcement = { id: number; title: string; content: string; created_at: string };

const GroupAnnouncements = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: group } = useQuery({
    queryKey: ["group-meta", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("groups").select("id,name,owner_id").eq("id", id!).maybeSingle()).data,
  });
  const isOwner = !!user && group?.owner_id === user.id;

  const { data: items, isLoading } = useQuery({
    queryKey: ["announcements", id],
    enabled: !!id,
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements").select("id,title,content,created_at")
        .eq("group_id", id!).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("로그인이 필요합니다");
      if (!isOwner) throw new Error("공지는 모임장만 작성할 수 있어요");
      if (!title.trim() || !content.trim()) throw new Error("제목과 내용을 입력해주세요");
      const { error } = await supabase.from("announcements").insert({
        group_id: id, author_id: user.id, title: title.trim(), content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "공지가 등록되었어요" });
      setOpen(false); setTitle(""); setContent("");
      qc.invalidateQueries({ queryKey: ["announcements", id] });
    },
    onError: (e: Error) => toast({ title: "등록 실패", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (aid: number) => {
      if (!isOwner) throw new Error("공지는 모임장만 삭제할 수 있어요");
      const { error } = await supabase.from("announcements").delete().eq("id", aid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements", id] }),
    onError: (e: Error) => toast({ title: "삭제 실패", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-24">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{group?.name ?? "공지사항"}</h1>
        </header>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : items && items.length > 0 ? (
            items.map((a) => (
              <article key={a.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Bell className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold">{a.title}</h2>
                  </div>
                  {isOwner && (
                    <button onClick={() => remove.mutate(a.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="삭제">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{new Date(a.created_at).toLocaleString("ko-KR")}</p>
                <p className="text-sm whitespace-pre-wrap">{a.content}</p>
              </article>
            ))
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-30" />
              공지사항이 없어요
            </div>
          )}
        </div>

        {isOwner && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="fixed bottom-6 right-1/2 translate-x-[180px] h-14 w-14 rounded-full gradient-primary shadow-glow z-40" aria-label="공지 작성">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>새 공지</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                <Textarea placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={2000} />
                <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full gradient-primary">
                  {create.isPending ? "등록 중..." : "등록"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default GroupAnnouncements;
