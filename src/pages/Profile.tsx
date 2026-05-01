import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MapPin, Copy, ChevronRight, Settings, LogOut, Star, Users, GraduationCap, Coins, Gift, Bell, Shield, Edit, BookOpen, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const unread = useUnreadNotifications();

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
    return <MobileShell><div className="px-4 pt-10 text-center text-sm text-muted-foreground">불러오는 중...</div></MobileShell>;
  }
  if (!user) return <Navigate to="/login" replace />;

  const name = profile?.name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "회원";
  const referralCode = user.id.slice(0, 8).toUpperCase();
  const isAdmin = roles?.some((r) => r.role === "admin");
  const isInstructor = roles?.some((r) => r.role === "instructor");

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold">내 정보</h1>
        <div className="flex gap-1">
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
              <p className="text-[11px] text-muted-foreground">참여 모임</p>
            </div>
            <div className="text-center">
              <GraduationCap className="h-4 w-4 mx-auto text-primary" />
              <p className="text-lg font-bold mt-0.5">{classCount ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">수강 클래스</p>
            </div>
            <div className="text-center">
              <Coins className="h-4 w-4 mx-auto text-primary" />
              <p className="text-lg font-bold mt-0.5">{(pointsTotal ?? 0).toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">포인트</p>
            </div>
          </div>
        </div>
      </section>

      {profile?.interests && profile.interests.length > 0 && (
        <section className="px-4 pt-5">
          <h3 className="text-sm font-bold mb-2.5">관심사</h3>
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
                <p className="text-xs text-white/80">보유 포인트</p>
                <p className="text-2xl font-bold mt-0.5">{(pointsTotal ?? 0).toLocaleString()} P</p>
                <p className="text-[11px] text-white/70 mt-1">탭하여 내역 보기</p>
              </div>
              <Coins className="h-12 w-12 text-white/30" />
            </div>
          </div>
        </button>
      </section>

      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-3"><Gift className="h-4 w-4 text-accent" /><h3 className="text-sm font-bold">친구 초대</h3></div>
          <p className="text-xs text-muted-foreground mb-3">친구를 초대하면 포인트를 받을 수 있어요!</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-xl px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-center">{referralCode}</div>
            <button onClick={copyCode} className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground" aria-label="복사"><Copy className="h-4 w-4" /></button>
          </div>
          {copied && <p className="text-[11px] text-primary text-center mt-2 animate-fade-in">복사되었어요!</p>}
        </div>
      </section>

      {myGroups && myGroups.length > 0 && (
        <section className="pt-5">
          <div className="px-4 flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">참여 중인 모임</h3>
            <Link to="/groups" className="text-xs text-muted-foreground flex items-center">전체 <ChevronRight className="h-3 w-3" /></Link>
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
              <span className="text-sm font-medium flex-1 text-left">강사 신청</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => navigate("/admin")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-left">관리자 페이지</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <button onClick={() => navigate("/notifications")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">알림</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/bookmarks")} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">찜한 모임</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium flex-1 text-left">내가 쓴 리뷰</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </section>

      <section className="px-4 pt-4 pb-4">
        <Button variant="ghost" onClick={async () => { await signOut(); toast({ title: "로그아웃 되었어요" }); navigate("/login", { replace: true }); }} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />로그아웃
        </Button>
      </section>

      <div className="h-4" />
    </MobileShell>
  );
};

export default Profile;
