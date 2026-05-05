import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MapPin, Copy, ChevronRight, Settings, LogOut, Star, Users, GraduationCap, Coins, Gift, Bell, Shield, Edit, BookOpen, Heart, Award, Sun, Moon, Trash2, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage, LANGUAGE_LABELS } from "@/contexts/LanguageContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Language } from "@/i18n/translations";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const unread = useUnreadNotifications();
  const { resolvedTheme, setTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: groupCount } = useQuery({
    queryKey: ["my-group-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("memberships").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "approved");
      return count ?? 0;
    },
  });

  const { data: classCount } = useQuery({
    queryKey: ["my-class-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("class_enrollments").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: pointsTotal } = useQuery({
    queryKey: ["points-total", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("points").select("amount").eq("user_id", user!.id);
      return (data ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user!.id)).data ?? [],
  });

  const { data: myGroups } = useQuery({
    queryKey: ["my-groups", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: ms } = await supabase.from("memberships").select("group_id").eq("user_id", user!.id).eq("status", "approved").limit(5);
      const ids = (ms ?? []).map((m) => m.group_id);
      if (!ids.length) return [];
      const { data: gs } = await supabase.from("groups").select("id,name,location,image_url").in("id", ids);
      return gs ?? [];
    },
  });

  if (loading) {
    return <MobileShell><div className="px-4 pt-10 text-center text-sm text-muted-foreground">{t.common.loading}</div></MobileShell>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const name = profile?.name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "회원";
  const referralCode = user.id.slice(0, 8).toUpperCase();
  const isAdmin = roles?.some((r) => r.role === "admin");
  const isInstructor = roles?.some((r) => r.role === "instructor");

  const referralLink = `${window.location.origin}/login?ref=${referralCode}&mode=signup`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteAccount = async () => {
    try {
      await supabase.from("profiles").delete().eq("id", user!.id);
      await signOut();
      toast({ title: "탈퇴 완료", description: "계정이 삭제되었어요. 이용해주셔서 감사합니다." });
      navigate("/login", { replace: true });
    } catch {
      toast({ title: "탈퇴 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
    }
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold">{t.profile.title}</h1>
        <div className="flex gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-smooth w-9 h-9 flex items-center justify-center text-base" aria-label="언어 변경">
                {LANGUAGE_LABELS[lang].flag}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {(Object.entries(LANGUAGE_LABELS) as [Language, { flag: string; label: string }][]).map(([code, { flag, label }]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLang(code)}
                  className={`gap-2 ${lang === code ? "font-semibold text-primary" : ""}`}
                >
                  <span className="text-base">{flag}</span>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="다크모드 토글">
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label={t.profile.adminPage}>
              <Shield className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-full hover:bg-muted transition-smooth" aria-label="알림">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-[10px] text-accent-foreground font-bold flex items-center justify-center">{unread}</span>}
          </button>
          <button onClick={() => navigate("/profile/edit")} className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="설정"><Settings className="h-5 w-5" /></button>
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={profile?.avatar_url || logo} alt={name} className="h-16 w-16 rounded-full object-cover shadow-soft" />
              {profile?.mbti && <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{profile.mbti}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{name}</h2>
                {isAdmin && <Badge className="bg-accent text-accent-foreground border-0">관리자</Badge>}
                {isInstructor && <Badge variant="outline">강사</Badge>}
              </div>
              {profile?.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {profile.location}</p>}
              {profile?.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{profile.bio}</p>}
            </div>
            <button onClick={() => navigate("/profile/edit")} className="p-2 rounded-full hover:bg-muted" aria-label="편집"><Edit className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <Users className="h-4 w-4 mx-auto text-primary" />
              <p className="text-lg font-bold mt-0.5">{groupCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t.profile.joinedGroups}</p>
            </div>
            <div className="text-center">
              <GraduationCap className="h-4 w-4 mx-auto text-primary" />
              <p className="text-lg font-bold mt-0.5">{classCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t.profile.enrolledClasses}</p>
            </div>
            <div className="text-center">
              <Coins className="h-4 w-4 mx-auto text-primary" />
              <p className="text-lg font-bold mt-0.5">{(pointsTotal ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{t.profile.points}</p>
            </div>
          </div>
        </div>
      </section>

      {profile?.interests && profile.interests.length > 0 && (
        <section className="px-4 pt-5">
          <h3 className="text-sm font-bold mb-2.5">{t.profile.interests}</h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => (
              <Badge key={i} variant="secondary" className="bg-primary-soft text-primary border-0 px-3 py-1 text-xs font-medium">{i}</Badge>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-5">
        <button onClick={() => navigate("/points")} className="w-full text-left">
          <div className="gradient-primary rounded-2xl p-4 text-primary-foreground relative overflow-hidden">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80">{t.profile.myPoints}</p>
                <p className="text-2xl font-bold mt-0.5">{(pointsTotal ?? 0).toLocaleString()} P</p>
                <p className="text-[11px] text-white/70 mt-1">{t.profile.tapForHistory}</p>
              </div>
              <Coins className="h-12 w-12 text-white/30" />
            </div>
          </div>
        </button>
      </section>

      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-3"><Gift className="h-4 w-4 text-accent" /><h3 className="text-sm font-bold">{t.profile.inviteFriends}</h3></div>
          <p className="text-xs text-muted-foreground mb-3">{t.profile.inviteDesc}</p>
          <div className="bg-muted rounded-xl px-3 py-2.5 mb-2">
            <p className="text-[10px] text-muted-foreground mb-1">{t.profile.myCode}</p>
            <p className="font-mono text-base font-bold tracking-widest text-primary">{referralCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/60 rounded-xl px-3 py-2 text-[11px] text-muted-foreground truncate">{referralLink}</div>
            <button onClick={copyCode} className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground flex-shrink-0" aria-label="링크 복사"><Copy className="h-4 w-4" /></button>
          </div>
          {copied && <p className="text-[11px] text-primary text-center mt-2 animate-fade-in">{t.profile.linkCopied}</p>}
        </div>
      </section>

      {myGroups && myGroups.length > 0 && (
        <section className="pt-5">
          <div className="px-4 flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">{t.profile.myGroups}</h3>
            <Link to="/groups" className="text-xs text-muted-foreground flex items-center">{t.profile.seeAll} <ChevronRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-border">
            {myGroups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-smooth">
                <img src={g.image_url || logo} alt={g.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{g.location}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden divide-y divide-border">
          {!isInstructor && (
            <button onClick={() => navigate("/instructor/apply")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-left">{t.profile.applyInstructor}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-left">{t.profile.adminPage}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={() => navigate("/notifications")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{t.profile.notifications}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/payment")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{t.profile.pointBarcode}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/bookmarks")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{t.profile.savedGroups}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/attendance")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Award className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{t.profile.attendance}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">{t.profile.myReviews}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      <section className="px-4 pt-4 pb-4 space-y-2">
        <Button variant="ghost" onClick={async () => { await signOut(); toast({ title: "로그아웃 되었어요" }); navigate("/login", { replace: true }); }} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />{t.profile.logout}
        </Button>
        <Button variant="ghost" onClick={() => setDeleteDialogOpen(true)} className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 text-xs">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />{t.profile.withdraw}
        </Button>
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.profile.withdrawTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.profile.withdrawDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t.profile.withdrawConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="h-4" />
    </MobileShell>
  );
};

export default Profile;
