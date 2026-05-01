import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Heart, MessageSquare, Trash2, Pin } from "lucide-react";
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

const ClassBoard = () => {
  const { id } = useParams();
  const classId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const { data: cls } = useQuery({
    queryKey: ["class-meta", classId],
    enabled: !!classId,
    queryFn: async () => (await supabase.from("classes").select("title,instructor_id").eq("id", classId).maybeSingle()).data,
  });
  const isInstructor = cls?.instructor_id === user?.id;

  const { data: posts, isLoading } = useQuery({
    queryKey: ["class-board", classId],
    enabled: !!classId,
    queryFn: async () => (await supabase.from("class_board_posts").select("*").eq("class_id", classId).order("is_pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: likes } = useQuery({
    queryKey: ["class-board-likes", classId],
    enabled: !!posts && posts.length > 0,
    queryFn: async () => (await supabase.from("class_board_post_likes").select("post_id,user_id").in("post_id", posts!.map((p) => p.id))).data ?? [],
  });

  const { data: comments } = useQuery({
    queryKey: ["class-comments", openId],
    enabled: !!openId,
    queryFn: async () => (await supabase.from("class_board_comments").select("*").eq("post_id", openId!).order("created_at")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!title.trim() || !content.trim()) throw new Error("제목과 내용을 입력하세요");
      const { error } = await supabase.from("class_board_posts").insert({ class_id: classId, author_id: user.id, title: title.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "등록되었어요" }); setOpen(false); setTitle(""); setContent(""); qc.invalidateQueries({ queryKey: ["class-board", classId] }); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ postId, pinned }: { postId: number; pinned: boolean }) => {
      const { error } = await supabase.from("class_board_posts").update({ is_pinned: !pinned }).eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-board", classId] }),
  });

  const remove = useMutation({
    mutationFn: async (postId: number) => { const { error } = await supabase.from("class_board_posts").delete().eq("id", postId); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-board", classId] }),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: number; liked: boolean }) => {
      if (!user) throw new Error("로그인");
      if (liked) await supabase.from("class_board_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      else await supabase.from("class_board_post_likes").insert({ post_id: postId, user_id: user.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class-board-likes", classId] }),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!user || !openId || !comment.trim()) return;
      const { error } = await supabase.from("class_board_comments").insert({ post_id: openId, author_id: user.id, content: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setComment(""); qc.invalidateQueries({ queryKey: ["class-comments", openId] }); },
  });

  const likeCount = (pid: number) => (likes ?? []).filter((l) => l.post_id === pid).length;
  const isLiked = (pid: number) => !!user && (likes ?? []).some((l) => l.post_id === pid && l.user_id === user.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1 truncate">{cls?.title ?? "클래스 게시판"}</h1>
          {user && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="icon" variant="ghost"><Plus className="h-5 w-5" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>새 게시글</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>제목</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
                  <div className="space-y-1.5"><Label>내용</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={2000} /></div>
                </div>
                <DialogFooter><Button onClick={() => create.mutate()} disabled={create.isPending}>등록</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </header>

        <div className="p-4 space-y-3">
          {isLoading ? <Skeleton className="h-24 w-full" /> : posts && posts.length > 0 ? posts.map((p) => (
            <div key={p.id} className={`bg-card rounded-xl p-4 border ${p.is_pinned ? "border-primary" : "border-border"}`}>
              <div className="flex items-start gap-2">
                {p.is_pinned && <Pin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                {isInstructor && <button onClick={() => togglePin.mutate({ postId: p.id, pinned: p.is_pinned })} className="p-1 text-muted-foreground hover:text-primary"><Pin className="h-4 w-4" /></button>}
                {(p.author_id === user?.id || isInstructor) && <button onClick={() => remove.mutate(p.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
              </div>
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{p.content}</p>
              <div className="flex gap-3 mt-3 text-xs">
                <button onClick={() => toggleLike.mutate({ postId: p.id, liked: isLiked(p.id) })} className={`inline-flex items-center gap-1 ${isLiked(p.id) ? "text-destructive" : "text-muted-foreground"}`}>
                  <Heart className={`h-3.5 w-3.5 ${isLiked(p.id) ? "fill-current" : ""}`} />{likeCount(p.id)}
                </button>
                <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="inline-flex items-center gap-1 text-muted-foreground"><MessageSquare className="h-3.5 w-3.5" />댓글</button>
              </div>
              {openId === p.id && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  {(comments ?? []).map((c) => <div key={c.id} className="text-xs bg-muted rounded-lg px-3 py-2"><p className="text-muted-foreground">{c.author_id.slice(0, 8)}</p><p className="mt-0.5">{c.content}</p></div>)}
                  {user && <div className="flex gap-2"><Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="댓글" maxLength={300} /><Button size="sm" onClick={() => addComment.mutate()}>등록</Button></div>}
                </div>
              )}
            </div>
          )) : <p className="text-center text-sm text-muted-foreground py-12">아직 게시글이 없어요</p>}
        </div>
      </div>
    </div>
  );
};

export default ClassBoard;