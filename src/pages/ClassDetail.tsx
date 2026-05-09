import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Star, User, BookOpen, MessageCircle, Heart, Users, UserCheck, UserX, Trash2, Pencil } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/ReportDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText, formatDate } from "@/i18n/format";
import { fallbackUserName, firstText, fullName } from "@/lib/userIdentity";

type Tab = "intro" | "reviews";
type EnrollmentStatus = "pending" | "approved" | "rejected";

type StudentRow = {
  id: number;
  user_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
};

type StudentProfile = {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
};

const ClassDetail = () => {
  const { id } = useParams();
  const idNum = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lang, t } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
  const classStatusLabel = (value?: string | null) => {
    const status = (value ?? "").trim().toLowerCase();
    if (status === "pending") return t.classDetail.pending;
    if (status === "approved") return t.classDetail.approved;
    if (status === "rejected") return t.classDetail.rejected;
    if (status === "active") return t.groupDetail.active;
    return tr(value);
  };
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [studentsOpen, setStudentsOpen] = useState(false);

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
    queryFn: async () => (await supabase.from("class_enrollments").select("id,status").eq("class_id", idNum).eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: enrollCount } = useQuery({
    queryKey: ["class-enroll-count", idNum],
    enabled: !!idNum,
    queryFn: async () => (await supabase.from("class_enrollments").select("id", { count: "exact", head: true }).eq("class_id", idNum).eq("status", "approved")).count ?? 0,
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
      if (!user) throw new Error(t.classDetail.notFound);
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
  const enrollmentStatus = enrollment?.status as EnrollmentStatus | undefined;
  const approvedEnrollment = enrollmentStatus === "approved";
  const pendingEnrollment = enrollmentStatus === "pending";
  const rejectedEnrollment = enrollmentStatus === "rejected";
  const enrolled = approvedEnrollment;
  const avgRating = reviews && reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

  const { data: studentRows } = useQuery({
    queryKey: ["class-students", idNum, isInstructor],
    enabled: !!idNum && isInstructor,
    queryFn: async (): Promise<StudentRow[]> => {
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("id,user_id,status,enrolled_at")
        .eq("class_id", idNum)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as StudentRow[];
    },
  });

  const studentIds = Array.from(new Set((studentRows ?? []).map((row) => row.user_id).filter(Boolean)));
  const { data: studentProfiles } = useQuery({
    queryKey: ["class-student-profiles", studentIds.join(",")],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const [{ data: profiles }, { data: appUsers }] = await Promise.all([
        supabase.from("profiles").select("id,name,nickname,avatar_url,email").in("id", studentIds),
        supabase.from("users").select("id,nickname,email,first_name,last_name,profile_image_url").in("id", studentIds),
      ]);
      const map = new Map<string, StudentProfile>();
      (appUsers ?? []).forEach((u) => {
        const appFullName = fullName(u.first_name, u.last_name);
        map.set(u.id, {
          id: u.id,
          name: firstText(u.nickname, appFullName, u.email, fallbackUserName(u.id)),
          email: u.email ?? null,
          avatar_url: u.profile_image_url ?? null,
        });
      });
      (profiles ?? []).forEach((p) => {
        const existing = map.get(p.id);
        map.set(p.id, {
          id: p.id,
          name: firstText(p.nickname, existing?.name, p.name, p.email, existing?.email, fallbackUserName(p.id)),
          email: p.email ?? existing?.email ?? null,
          avatar_url: p.avatar_url ?? existing?.avatar_url ?? null,
        });
      });
      return map;
    },
  });

  const updateStudent = useMutation({
    mutationFn: async ({ rowId, status }: { rowId: number; status: EnrollmentStatus }) => {
      const { error } = await supabase.from("class_enrollments").update({ status }).eq("id", rowId);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast({ title: status === "approved" ? t.classDetail.approveSuccess : t.classDetail.rejectSuccess });
      qc.invalidateQueries({ queryKey: ["class-students", idNum] });
      qc.invalidateQueries({ queryKey: ["class-enroll-count", idNum] });
      qc.invalidateQueries({ queryKey: ["class-enroll", idNum] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeStudent = useMutation({
    mutationFn: async (rowId: number) => {
      const { error } = await supabase.from("class_enrollments").delete().eq("id", rowId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t.classDetail.removeSuccess });
      qc.invalidateQueries({ queryKey: ["class-students", idNum] });
      qc.invalidateQueries({ queryKey: ["class-enroll-count", idNum] });
      qc.invalidateQueries({ queryKey: ["class-enroll", idNum] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t.classDetail.notFound);
      if (approvedEnrollment || pendingEnrollment) {
        const { error } = await supabase.from("class_enrollments").delete().eq("class_id", idNum).eq("user_id", user.id);
        if (error) throw error;
      } else if (rejectedEnrollment) {
        const { error: deleteError } = await supabase.from("class_enrollments").delete().eq("class_id", idNum).eq("user_id", user.id);
        if (deleteError) throw deleteError;
        const { error } = await supabase.from("class_enrollments").insert({ class_id: idNum, user_id: user.id, status: "pending" });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("class_enrollments").insert({ class_id: idNum, user_id: user.id, status: "pending" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: approvedEnrollment || pendingEnrollment ? t.classDetail.cancelEnroll : t.classDetail.enrollSuccess });
      qc.invalidateQueries({ queryKey: ["class-enroll", idNum, user?.id] });
      qc.invalidateQueries({ queryKey: ["class-enroll-count", idNum] });
      qc.invalidateQueries({ queryKey: ["class-students", idNum] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t.classDetail.notFound);
      if (!reviewText.trim()) throw new Error(t.classDetail.reviewPlaceholder);
      const { error } = await supabase.from("class_reviews").insert({
        class_id: idNum, author_id: user.id, rating, content: reviewText.trim(),
      });
      if (error) throw error;
      setReviewText("");
    },
    onSuccess: () => { toast({ title: t.classDetail.submitReview }); qc.invalidateQueries({ queryKey: ["class-reviews", idNum] }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background"><div className="mx-auto max-w-md"><Skeleton className="aspect-[4/3] w-full" /></div></div>;
  }
  if (!cls) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">{t.classDetail.notFound}</p></div>;
  }

  const tabItems: { id: Tab; label: string }[] = [
    { id: "intro", label: t.classDetail.tabIntro },
    { id: "reviews", label: `${t.classDetail.tabReviews} ${reviews?.length ?? 0}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md bg-background relative pb-28">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
          {cls.image_url ? <img src={cls.image_url} alt={cls.title} className="h-full w-full object-cover" /> : <BookOpen className="h-16 w-16 text-muted-foreground/30" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          <button onClick={() => navigate(-1)} className="absolute top-3 left-3 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label={t.common.back}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => user ? toggleBookmark.mutate() : navigate("/login")} className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="bookmark">
            <Heart className={cn("h-5 w-5", bookmark && "fill-accent text-accent")} />
          </button>
          {isInstructor && (
            <button onClick={() => navigate(`/classes/${cls.id}/edit`)} className="absolute top-3 right-16 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label={t.classDetail.editClass}>
              <Pencil className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-4 pt-5">
          {cls.category && <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{tr(cls.category)}</Badge>}
          <h1 className="text-xl font-bold mt-2 leading-snug">{tr(cls.title)}</h1>
          {user && !isInstructor && (
            <div className="flex justify-end -mt-1">
              <ReportDialog targetType="class" targetId={String(cls.id)} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Avatar className="h-8 w-8"><AvatarImage src={instructor?.avatar_url ?? undefined} /><AvatarFallback><User className="h-4 w-4" /></AvatarFallback></Avatar>
            <div>
              <p className="text-xs text-muted-foreground">{t.classDetail.instructor}</p>
              <p className="text-sm font-semibold">{instructor?.name ?? instructor?.email ?? t.classDetail.instructor}</p>
            </div>
            {isInstructor && (
              <Button type="button" variant="outline" size="sm" className="ml-auto h-9 rounded-full" onClick={() => setStudentsOpen(true)}>
                <Users className="h-4 w-4 mr-1" />
                {t.classDetail.manageStudents}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {cls.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {tr(cls.location)}</span>}
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-bold text-foreground">{avgRating}</span>
              <span className="text-xs">({reviews?.length ?? 0})</span>
            </span>
          </div>
        </div>

        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 grid grid-cols-3 divide-x divide-primary/10">
          <div className="text-center"><p className="text-xs text-muted-foreground">{t.classDetail.fee}</p><p className="text-base font-bold text-primary mt-0.5">{tr(cls.price) || t.classDetail.free}</p></div>
          <div className="text-center"><p className="text-xs text-muted-foreground">{t.classDetail.students}</p><p className="text-base font-bold text-primary mt-0.5">{enrollCount}/{cls.max_students ?? "∞"}</p></div>
          <div className="text-center"><p className="text-xs text-muted-foreground">{t.classDetail.status}</p><p className="text-base font-bold text-primary mt-0.5">{classStatusLabel(cls.status)}</p></div>
        </div>

        <div className="flex border-b border-border mt-5">
          {tabItems.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
              "flex-1 py-3 text-sm font-semibold border-b-2 transition-smooth",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>{tab.label}</button>
          ))}
        </div>

        <div className="animate-fade-in">
          {activeTab === "intro" && (
            <div className="px-4 pt-5 pb-4 space-y-5">
              <section>
                <h2 className="text-base font-bold mb-2">{t.classDetail.intro}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(cls.description) || t.classDetail.noDescription}</p>
              </section>
              {cls.curriculum && (
                <section>
                  <h2 className="text-base font-bold mb-2">{t.classDetail.curriculum}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tr(cls.curriculum)}</p>
                </section>
              )}
              {cls.schedule && (
                <section>
                  <h2 className="text-base font-bold mb-2">{t.classDetail.schedule}</h2>
                  <p className="text-sm text-muted-foreground">{tr(cls.schedule)}</p>
                </section>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="pt-4 pb-4 px-4 space-y-4">
              {user && approvedEnrollment && !isInstructor && (
                <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} aria-label={`${s}`}>
                        <Star className={cn("h-5 w-5", s <= rating ? "fill-accent text-accent" : "text-muted")} />
                      </button>
                    ))}
                  </div>
                  <Textarea rows={3} placeholder={t.classDetail.reviewPlaceholder} value={reviewText} onChange={(e) => setReviewText(e.target.value)} maxLength={1000} />
                  <Button onClick={() => addReview.mutate()} disabled={addReview.isPending} className="w-full">
                    {addReview.isPending ? t.classDetail.submitting : t.classDetail.submitReview}
                  </Button>
                </div>
              )}
              {reviews && reviews.length > 0 ? reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-accent text-accent" : "text-muted")} />)}
                  </div>
                  <p className="text-sm">{tr(r.content)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(r.created_at, lang)}</p>
                </div>
              )) : (
                <div className="text-center py-12 text-sm text-muted-foreground">{t.classDetail.noReviews}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          {(approvedEnrollment || isInstructor) && (
            <Link to={`/classes/${cls.id}/chat`} className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center" aria-label="chat">
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          <Button onClick={() => user ? enroll.mutate() : navigate("/login")} disabled={enroll.isPending || isInstructor} className={cn(
            "flex-1 h-12 rounded-xl text-base font-bold border-0",
            (approvedEnrollment || pendingEnrollment || isInstructor) ? "bg-muted text-foreground" : "gradient-primary shadow-glow"
          )}>
            {isInstructor ? t.classDetail.myClass : approvedEnrollment ? t.classDetail.enrolled : pendingEnrollment ? t.classDetail.pending : t.classDetail.enroll}
          </Button>
        </div>
      </div>

      <Dialog open={studentsOpen} onOpenChange={setStudentsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.classDetail.manageStudents}</DialogTitle>
            <DialogDescription>{t.classDetail.manageStudentsDesc}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {studentRows && studentRows.length > 0 ? studentRows.map((row) => {
              const profile = studentProfiles?.get(row.user_id);
              const statusLabel = row.status === "approved" ? t.classDetail.approved : row.status === "rejected" ? t.classDetail.rejected : t.classDetail.pending;
              return (
                <div key={row.id} className="rounded-2xl border border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url ?? undefined} />
                      <AvatarFallback>{(profile?.name ?? fallbackUserName(row.user_id)).slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{profile?.name ?? fallbackUserName(row.user_id)}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email ?? row.user_id}</p>
                    </div>
                    <Badge variant={row.status === "approved" ? "default" : row.status === "rejected" ? "destructive" : "secondary"}>{statusLabel}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {row.status !== "approved" && (
                      <Button size="sm" onClick={() => updateStudent.mutate({ rowId: row.id, status: "approved" })} disabled={updateStudent.isPending}>
                        <UserCheck className="h-4 w-4 mr-1" />
                        {t.classDetail.approve}
                      </Button>
                    )}
                    {row.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => updateStudent.mutate({ rowId: row.id, status: "rejected" })} disabled={updateStudent.isPending}>
                        <UserX className="h-4 w-4 mr-1" />
                        {t.classDetail.reject}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeStudent.mutate(row.id)} disabled={removeStudent.isPending}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t.classDetail.remove}
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-sm text-muted-foreground">{t.classDetail.noStudents}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassDetail;
