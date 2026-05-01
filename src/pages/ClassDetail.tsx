import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, User, BookOpen, MessageCircle, Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/ReportDialog";

type Tab = "intro" | "reviews";

const ClassDetail = () => {
  const { id } = useParams();
  const idNum = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  const { data: cls, isLoading } = useQuery({
    queryKey: ["class", idNum],
    enabled: !!idNum,
    queryFn: async () => (await supabase.from("classes").select("*").eq("id", idNum).maybeSingle()).data,
  });

  const { data: instructor } = useQuery({
    queryKey: ["class-instructor", cls?.instructor_id],
    enabled: !!cls?.instructor_id,
    queryFn: async () => (await supabase.from("profiles").select("id,name,avatar_url,email").eq("id", cls!.instructor_id).maybeSingle()).data,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["class-enroll", idNum, user?.id],
    enabled: !!idNum && !!user,
    queryFn: async () => (await supabase.from("class_enrollments").select("id").eq("class_id", idNum).eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: enrollCount } = useQuery({
    queryKey: ["class-enroll-count", idNum],
    enabled: !!idNum,
    queryFn: async () => (await supabase.from("class_enrollments").select("id", { count: "exact", head: true }).eq("class_id", idNum)).count ?? 0,
  });

  const { data: reviews } = useQuery({
    queryKey: ["class-reviews", idNum],
    enabled: !!idNum,
    queryFn: async () => (await supabase.from("class_reviews").select("*").eq("class_id", idNum).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: bookmark } = useQuery({
    queryKey: ["bookmark-class", idNum, user?.id],
    enabled: !!idNum && !!user,
    queryFn: async () => (await supabase.from("bookmarks").select("id").eq("user_id", user!.id).eq("target_type", "class").eq("target_id", String(idNum)).maybeSingle()).data,
  });
  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (bookmark) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, target_type: "class", target_id: String(idNum) });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmark-class", idNum, user?.id] }),
  });

  const isInstructor = !!user && cls?.instructor_id === user.id;
  const enrolled = !!enrollment;
  const avgRating = reviews && reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (enrolled) {
        const { error } = await supabase.from("class_enrollments").delete().eq("class_id", idNum).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("class_enrollments").insert({ class_id: idNum, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: enrolled ? "수강 취소되었어요" : "수강 신청 완료" });
      qc.invalidateQueries({ queryKey: ["class-enroll", idNum, user?.id] });
      qc.invalidateQueries({ queryKey: ["class-enroll-count", idNum] });
    },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!reviewText.trim()) throw new Error("리뷰 내용을 입력해주세요");
      const { error } = await supabase.from("class_reviews").insert({
        class_id: idNum, author_id: user.id, rating, content: reviewText.trim(),
      });
      if (error) throw error;
      setReviewText("");
    },
    onSuccess: () => { toast({ title: "리뷰가 등록되었어요" }); qc.invalidateQueries({ queryKey: ["class-reviews", idNum] }); },
    onError: (e: Error) => toast({ title: "등록 실패", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background"><div className="mx-auto max-w-md"><Skeleton className="aspect-[4/3] w-full" /></div></div>;
  }
  if (!cls) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">존재하지 않는 클래스입니다</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md bg-background relative pb-28">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
          {cls.image_url ? <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover" /> : <BookOpen className="h-16 w-16 text-muted-foreground/30" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          <button onClick={() => navigate(-1)} className="absolute top-3 left-3 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => user ? toggleBookmark.mutate() : navigate("/login")} className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="찜">
            <Heart className={cn("h-5 w-5", bookmark && "fill-accent text-accent")} />
          </button>
        </div>

        <div className="px-4 pt-5">
          {cls.category && <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{cls.category}</Badge>}
          <h1 className="text-xl font-bold mt-2 leading-snug">{cls.title}</h1>
          {user && !isInstructor && (
            <div className="flex justify-end -mt-1">
              <ReportDialog targetType="class" targetId={String(cls.id)} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-8 w-8"><AvatarImage src={instructor?.avatar_url ?? undefined} /><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
            <div>
              <p className="text-xs text-muted-foreground">강사</p>
              <p className="text-sm font-semibold">{instructor?.name ?? instructor?.email ?? "강사"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {cls.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {cls.location}</span>}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-bold text-foreground">{avgRating}</span>
              <span className="text-xs">({reviews?.length ?? 0})</span>
            </span>
          </div>
        </div>

        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 grid grid-cols-3 divide-x divide-primary/10">
          <div className="text-center"><p className="text-xs text-muted-foreground">참가비</p><p className="text-base font-bold text-primary mt-0.5">{cls.price ?? "무료"}</p></div>
          <div className="text-center"><p className="text-xs text-muted-foreground">수강생</p><p className="text-base font-bold text-primary mt-0.5">{enrollCount}/{cls.max_students ?? "∞"}</p></div>
          <div className="text-center"><p className="text-xs text-muted-foreground">상태</p><p className="text-base font-bold text-primary mt-0.5">{cls.status}</p></div>
        </div>

        <div className="flex border-b border-border mt-5">
          {([["intro","클래스 소개"],["reviews",`리뷰 ${reviews?.length ?? 0}`]] as const).map(([t,label]) => (
            <button key={t} onClick={() => setActiveTab(t as Tab)} className={cn(
              "flex-1 py-3 text-sm font-semibold border-b-2 transition-smooth",
              activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>{label}</button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === "intro" && (
            <div className="px-4 pt-5 pb-4 space-y-5">
              <section>
                <h2 className="text-base font-bold mb-2">소개</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{cls.description || "소개가 등록되지 않았어요."}</p>
              </section>
              {cls.curriculum && (
                <section>
                  <h2 className="text-base font-bold mb-2">커리큘럼</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{cls.curriculum}</p>
                </section>
              )}
              {cls.schedule && (
                <section>
                  <h2 className="text-base font-bold mb-2">일정</h2>
                  <p className="text-sm text-muted-foreground">{cls.schedule}</p>
                </section>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="pt-4 pb-4 px-4 space-y-4">
              {user && enrolled && !isInstructor && (
                <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} aria-label={`${s}점`}>
                        <Star className={cn("h-5 w-5", s <= rating ? "fill-accent text-accent" : "text-muted")} />
                      </button>
                    ))}
                  </div>
                  <Textarea rows={3} placeholder="리뷰를 남겨주세요" value={reviewText} onChange={(e) => setReviewText(e.target.value)} maxLength={1000} />
                  <Button onClick={() => addReview.mutate()} disabled={addReview.isPending} className="w-full">{addReview.isPending ? "등록 중..." : "리뷰 등록"}</Button>
                </div>
              )}
              {reviews && reviews.length > 0 ? reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-accent text-accent" : "text-muted")} />)}
                  </div>
                  <p className="text-sm">{r.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString("ko-KR")}</p>
                </div>
              )) : (
                <div className="text-center py-12 text-sm text-muted-foreground">아직 리뷰가 없어요</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          {(enrolled || isInstructor) && (
            <Link to={`/classes/${cls.id}/chat`} className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center" aria-label="클래스 채팅">
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          <Button onClick={() => user ? enroll.mutate() : navigate("/login")} disabled={enroll.isPending || isInstructor} className={cn(
            "flex-1 h-12 rounded-xl text-base font-bold border-0",
            (enrolled || isInstructor) ? "bg-muted text-foreground" : "gradient-primary shadow-glow"
          )}>
            {isInstructor ? "✓ 내 클래스" : enrolled ? "✓ 수강 신청됨" : "수강 신청하기"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;
