import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MapPin, Copy, ChevronRight, Settings, LogOut, Star, Users, GraduationCap, Coins, Gift } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { userProfile, groups } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfileName(data?.name ?? null));
  }, [user]);

  if (loading) {
    return (
      <MobileShell>
        <div className="px-4 pt-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
      </MobileShell>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const { location, mbti, bio, interests, groupCount, classCount, points, referralCode } = userProfile;
  const name = profileName ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "회원";
  const myGroups = groups.slice(0, groupCount);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <MobileShell>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold">내 정보</h1>
        <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="설정">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Profile card */}
      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={logo} alt={name} className="h-16 w-16 rounded-full object-cover shadow-soft" />
              <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {mbti}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">{name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {location}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{bio}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x divide-border mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold mt-0.5">{groupCount}</p>
              <p className="text-[11px] text-muted-foreground">참여 모임</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <GraduationCap className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold mt-0.5">{classCount}</p>
              <p className="text-[11px] text-muted-foreground">수강 클래스</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Coins className="h-4 w-4" />
              </div>
              <p className="text-lg font-bold mt-0.5">{points.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">포인트</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interests */}
      <section className="px-4 pt-5">
        <h3 className="text-sm font-bold mb-2.5">관심사</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Badge key={interest} variant="secondary" className="bg-primary-soft text-primary border-0 px-3 py-1 text-xs font-medium">
              {interest}
            </Badge>
          ))}
        </div>
      </section>

      {/* Points */}
      <section className="px-4 pt-5">
        <div className="gradient-primary rounded-2xl p-4 text-primary-foreground relative overflow-hidden">
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute right-6 bottom-1 h-10 w-10 rounded-full bg-white/10" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">보유 포인트</p>
              <p className="text-2xl font-bold mt-0.5">{points.toLocaleString()} P</p>
              <p className="text-[11px] text-white/70 mt-1">가맹점에서 결제할 수 있어요</p>
            </div>
            <Coins className="h-12 w-12 text-white/30" />
          </div>
          <button className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-smooth">
            포인트 내역 보기
          </button>
        </div>
      </section>

      {/* Referral */}
      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold">친구 초대</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">친구를 초대하면 포인트를 받을 수 있어요!</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-xl px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-center">
              {referralCode}
            </div>
            <button
              onClick={copyCode}
              className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground"
              aria-label="복사"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-primary text-center mt-2 animate-fade-in">복사되었어요!</p>
          )}
        </div>
      </section>

      {/* My groups */}
      <section className="pt-5">
        <div className="px-4 flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">참여 중인 모임</h3>
          <Link to="/groups" className="text-xs text-muted-foreground flex items-center">
            전체 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-0 divide-y divide-border">
          {myGroups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-smooth"
            >
              <img src={g.image} alt={g.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{g.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{g.location} · 멤버 {g.members}명</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section className="px-4 pt-5">
        <div className="bg-card rounded-2xl shadow-soft overflow-hidden divide-y divide-border">
          {[
            { label: "내가 쓴 리뷰", icon: Star },
            { label: "설정", icon: Settings },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-smooth">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="px-4 pt-4 pb-4">
        <Button
          variant="ghost"
          onClick={async () => {
            await signOut();
            toast({ title: "로그아웃 되었어요" });
            navigate("/login", { replace: true });
          }}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </section>

      <div className="h-4" />
    </MobileShell>
  );
};

export default Profile;
