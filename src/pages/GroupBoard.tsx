import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Plus, Pin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MentionInput } from "@/components/MentionInput";
import { ImageUploader } from "@/components/ImageUploader";
import { HashtagText } from "@/components/HashtagText";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText, formatDate, formatDateTime } from "@/i18n/format";

type BoardFilter = "notice" | "review" | "greeting";
type PostFilter = BoardFilter | "free";

type Post = {
  id: number;
  title: string;
  content: string;
  author_id: string;
  is_pinned: boolean;
  created_at: string;
};

const BOARD_FILTERS: { id: BoardFilter; label: string }[] = [
  { id: "notice", label: "공지" },
  { id: "review", label: "모임후기" },
  { id: "greeting", label: "가입인사" },
];

const getPostFilter = (post: Post): PostFilter => {
  const text = `${post.title} ${post.content}`.toLowerCase();
  if (post.is_pinned || /공지|필독|notice/.test(text)) return "notice";
  if (/모임후기|후기|리뷰|review/.test(text)) return "review";
  if (/가입인사|가입 인사|안녕하세요|반갑/.test(text)) return "greeting";
  return "free";
};

const isNewPost = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000;

const GroupBoard = ({ embedded = false, groupId }: { embedded?: boolean; groupId?: string } = {}) => {
  const params = useParams();
  const id = groupId ?? params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lang } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
  const [filter, setFilter] = useState<BoardFilter>("notice");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [openPostId, setOpenPostId] = useState<number | null>(null);

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
  const rootClassName = embedded ? "bg-background" : "min-h-screen bg-background";
  const shellClassName = embedded ? "w-full pb-5" : "mx-auto max-w-md pb-24";

  const { data: posts, isLoading } = useQuery({
    queryKey: ["board-posts", id],
    enabled: !!id,
    queryFn: async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from("board_posts")
        .select("id,title,content,author_id,is_pinned,created_at")
        .eq("group_id", id!)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.author_id)));
  const { data: authors } = useQuery({
    queryKey: ["board-authors", id, authorIds.join(",")],
    enabled: authorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,name,avatar_url,email").in("id", authorIds);
      return new Map((data ?? []).map((p) => [p.id as string, p]));
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error(tr("로그인이 필요합니다"));
      if (!title.trim() || !content.trim()) throw new Error(tr("제목과 내용을 입력해주세요"));
      const { data: post, error } = await supabase.from("board_posts").insert({
        group_id: id, author_id: user.id, title: title.trim(), content: content.trim(),
      }).select("id").single();
      if (error) throw error;
      if (post && images.length > 0) {
        await supabase.from("post_images").insert(images.map((url) => ({ post_id: post.id, post_type: "board", image_url: url, uploader_id: user.id })));
      }
    },
    onSuccess: () => {
      toast({ title: tr("게시글이 등록되었어요") });
      setOpen(false); setTitle(""); setContent(""); setImages([]);
      qc.invalidateQueries({ queryKey: ["board-posts", id] });
    },
    onError: (e: Error) => toast({ title: tr("등록 실패"), description: e.message, variant: "destructive" }),
  });

  const visiblePosts = (posts ?? []).filter((post) => getPostFilter(post) === filter);

  return (
    <div className={rootClassName}>
      <div className={shellClassName}>
        {!embedded && (
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={tr("뒤로")}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1 truncate">{tr(group?.name) || tr("게시판")}</h1>
        </header>
        )}

        <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide", embedded ? "px-0 pb-3" : "px-4 py-3")}>
          {BOARD_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-smooth",
                filter === item.id ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {tr(item.label)}
            </button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-4 space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          ) : visiblePosts.length > 0 ? (
            visiblePosts.map((p) => {
              const a = authors?.get(p.author_id);
              const postFilter = getPostFilter(p);
              const filterLabel = BOARD_FILTERS.find((item) => item.id === postFilter)?.label;
              return (
                <button key={p.id} onClick={() => setOpenPostId(p.id)} className="w-full text-left px-4 py-4 hover:bg-muted/40 transition-smooth">
                  <div className="flex items-center gap-2 mb-1.5">
                    {p.is_pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                    <span className="text-sm font-bold flex-1 truncate">{tr(p.title)}</span>
                    {isNewPost(p.created_at) && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-extrabold text-accent">
                        NEW
                      </span>
                    )}
                    {filterLabel && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{tr(filterLabel)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tr(p.content)}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                    <Avatar className="h-5 w-5"><AvatarImage src={a?.avatar_url ?? undefined} /><AvatarFallback>{(a?.name ?? "?").slice(0,1)}</AvatarFallback></Avatar>
                    <span>{a?.name ?? a?.email ?? "익명"}</span>
                    <span>·</span>
                    <span>{formatDate(p.created_at, lang)}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-20 text-sm text-muted-foreground">{tr("아직 게시글이 없어요")}</div>
          )}
        </div>

        {isMember && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className={cn("h-14 w-14 rounded-full gradient-primary shadow-glow z-40", embedded ? "fixed bottom-24 right-6" : "fixed bottom-6 right-1/2 translate-x-[180px]")} aria-label={tr("글쓰기")}>
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{tr("새 게시글")}</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                <Input placeholder={tr("제목")} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
                <Textarea placeholder={tr("내용 입력 (#태그 사용 가능)")} value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={2000} />
                <ImageUploader value={images} onChange={setImages} max={5} />
                <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full gradient-primary">
                  {create.isPending ? tr("등록 중...") : tr("등록")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {openPostId && (
          <PostDetail postId={openPostId} onClose={() => setOpenPostId(null)} canComment={!!isMember} userId={user?.id} />
        )}
      </div>
    </div>
  );
};

const PostDetail = ({ postId, onClose, canComment, userId }: { postId: number; onClose: () => void; canComment: boolean; userId?: string }) => {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const { lang } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
  const { data: post } = useQuery({
    queryKey: ["board-post", postId],
    queryFn: async () => (await supabase.from("board_posts").select("*").eq("id", postId).maybeSingle()).data,
  });
  const { data: postImgs } = useQuery({
    queryKey: ["board-post-images", postId],
    queryFn: async () => (await supabase.from("post_images").select("image_url").eq("post_id", postId).eq("post_type", "board")).data ?? [],
  });
  const { data: comments } = useQuery({
    queryKey: ["board-comments", postId],
    queryFn: async () => (await supabase.from("board_comments").select("*").eq("post_id", postId).order("created_at", { ascending: true })).data ?? [],
  });
  const { data: likes } = useQuery({
    queryKey: ["board-likes", postId],
    queryFn: async () => (await supabase.from("board_post_likes").select("user_id").eq("post_id", postId)).data ?? [],
  });
  const liked = !!likes?.some((l) => l.user_id === userId);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error(tr("로그인이 필요합니다"));
      if (liked) {
        await supabase.from("board_post_likes").delete().eq("post_id", postId).eq("user_id", userId);
      } else {
        await supabase.from("board_post_likes").insert({ post_id: postId, user_id: userId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-likes", postId] }),
    onError: (e: Error) => toast({ title: tr("오류"), description: e.message, variant: "destructive" }),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!userId || !text.trim()) return;
      const { error } = await supabase.from("board_comments").insert({ post_id: postId, author_id: userId, content: text.trim() });
      if (error) throw error;
      setText("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board-comments", postId] }),
    onError: (e: Error) => toast({ title: tr("오류"), description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="pr-6">{tr(post?.title) || "..."}</DialogTitle></DialogHeader>
        <HashtagText text={tr(post?.content) ?? ""} className="text-sm whitespace-pre-wrap text-foreground" />
        {postImgs && postImgs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {postImgs.map((img, i) => (
              <a key={i} href={img.image_url} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 border-t border-b border-border py-2 text-sm">
          <button onClick={() => toggleLike.mutate()} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
            <Heart className={cn("h-4 w-4", liked && "fill-accent text-accent")} /> {likes?.length ?? 0}
          </button>
          <span className="flex items-center gap-1.5 text-muted-foreground"><MessageCircle className="h-4 w-4" /> {comments?.length ?? 0}</span>
        </div>
        <div className="space-y-2">
          {comments?.map((c) => (
            <div key={c.id} className="text-sm bg-muted rounded-lg px-3 py-2">
              <p className="text-[11px] text-muted-foreground mb-0.5">{formatDateTime(c.created_at, lang)}</p>
              <HashtagText text={tr(c.content)} />
            </div>
          ))}
        </div>
        {canComment && (
          <form onSubmit={(e) => { e.preventDefault(); addComment.mutate(); }} className="flex gap-2 pt-2">
            <div className="flex-1"><MentionInput value={text} onChange={setText} placeholder={tr("댓글 작성... @로 멘션")} maxLength={500} /></div>
            <Button type="submit" disabled={addComment.isPending || !text.trim()}>{tr("등록")}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupBoard;
