import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, MessageSquare } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const LeaderBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["leader-posts"],
    queryFn: async () => (await supabase.from("leader_posts").select("*").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: comments } = useQuery({
    queryKey: ["leader-comments", openId],
    enabled: !!openId,
    queryFn: async () => (await supabase.from("leader_comments").select("*").eq("post_id", openId!).order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!title.trim() || !content.trim()) throw new Error("제목과 내용을 입력하세요");
      const { error } = await supabase.from("leader_posts").insert({ author_id: user.id, title: title.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "게시글이 등록되었어요" }); setOpen(false); setTitle(""); setContent(""); qc.invalidateQueries({ queryKey: ["leader-posts"] }); },
    onError: (e: Error) => toast({ title: "등록 실패", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("leader_posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leader-posts"] }),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !openId) return;
      if (!comment.trim()) return;
      const { error } = await supabase.from("leader_comments").insert({ post_id: openId, author_id: user.id, content: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setComment(""); qc.invalidateQueries({ queryKey: ["leader-comments", openId] }); },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">리더 게시판</h1>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>새 게시글</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>제목</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
                  <div className="space-y-1.5"><Label>내용</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={2000} /></div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "등록 중..." : "등록"}</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </header>

        <div className="p-4 space-y-3">
          {isLoading ? <Skeleton className="h-24 w-full" /> : posts && posts.length > 0 ? posts.map((p) => (
            <div key={p.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                {p.author_id === user?.id && (
                  <button onClick={() => remove.mutate(p.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line line-clamp-4">{p.content}</p>
              <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="mt-3 text-xs text-primary inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />댓글</button>
              {openId === p.id && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {(comments ?? []).map((c) => (
                    <div key={c.id} className="text-xs bg-muted rounded-lg px-3 py-2"><p className="text-muted-foreground">{c.author_id.slice(0, 8)}</p><p className="mt-0.5">{c.content}</p></div>
                  ))}
                  {user && (
                    <div className="flex gap-2">
                      <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="댓글" maxLength={300} />
                      <Button size="sm" onClick={() => addComment.mutate()} disabled={!comment.trim()}>등록</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )) : <p className="text-center text-sm text-muted-foreground py-12">아직 게시글이 없어요</p>}
        </div>
      </div>
    </div>
  );
};

export default LeaderBoard;