import { Link, useNavigate } from "react-router-dom";
import { Search, Bell, MapPin, TrendingUp, Sparkles, ChevronRight, Users, Coins, Store, Megaphone, Crown, ShieldCheck, GraduationCap, UserPlus, Heart, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { categories } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/grow-logo.png";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const unread = useUnreadNotifications();
  const { t } = useLanguage();

  const { data: banners } = useQuery({
    queryKey: ["banners-active"],
    queryFn: async () => (await supabase.from("banners").select("*").eq("is_active", true).order("order").limit(5)).data ?? [],
  });

  const { data: recommended } = useQuery({
    queryKey: ["home-recommended"],
    queryFn: async () => (await supabase.from("groups").select("id,name,category,location,image_url").eq("status", "active").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  const { data: hot } = useQuery({
    queryKey: ["home-hot"],
    queryFn: async () => {
      const res = await supabase.from("groups").select("id,name,category,location,image_url,description").eq("status", "active").order("created_at", { ascending: false }).range(8, 12);
      return res.data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["home-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("interests,location").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: forYou } = useQuery({
    queryKey: ["home-for-you", user?.id, profile?.interests, profile?.location],
    enabled: !!user && !!profile,
    queryFn: async () => {
      const interests = profile?.interests ?? [];
      const loc = profile?.location ?? null;
      let q = supabase.from("groups").select("id,name,category,location,image_url,description").eq("status", "active").limit(8);
      if (interests.length > 0) q = q.in("category", interests as string[]);
      else if (loc) q = q.ilike("location", `%${loc}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: followingFeed } = useQuery({
    queryKey: ["home-following-feed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user!.id).limit(50);
      const ids = (f ?? []).map((r) => r.following_id);
      if (!ids.length) return [];
      const { data: groups } = await supabase.from("groups").select("id,name,category,image_url,owner_id,created_at").in("owner_id", ids).eq("status", "active").order("created_at", { ascending: false }).limit(6);
      return groups ?? [];
    },
  });

  const heroBanner = banners?.[0];

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-home", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const quickMenu = [
    { to: "/points", label: t.home.quickPoints, icon: Coins, color: "bg-amber-100 text-amber-700" },
    { to: "/stores", label: t.home.quickStores, icon: Store, color: "bg-emerald-100 text-emerald-700" },
    { to: "/recommendations", label: t.home.quickRecommend, icon: Sparkles, color: "bg-pink-100 text-pink-700" },
    { to: "/calendar", label: t.home.quickCalendar, icon: CalendarDays, color: "bg-indigo-100 text-indigo-700" },
    { to: "/ads", label: t.home.quickAds, icon: Megaphone, color: "bg-rose-100 text-rose-700" },
    { to: "/leaders", label: t.home.quickLeaders, icon: Crown, color: "bg-purple-100 text-purple-700" },
    { to: "/instructor/apply", label: t.home.quickInstructor, icon: GraduationCap, color: "bg-sky-100 text-sky-700" },
    ...(isAdmin ? [{ to: "/admin", label: t.home.quickAdmin, icon: ShieldCheck, color: "bg-slate-100 text-slate-700" }] : []),
  ];

  const getCatLabel = (id: string) =>
    t.categories[id as keyof typeof t.categories] ?? id;

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 gradient-hero pt-3 pb-3 px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="GROW" className="h-9 w-9 rounded-full shadow-soft" />
            <div>
              <p className="text-xs text-muted-foreground leading-none">{t.home.myLocation}</p>
              <p className="text-sm font-bold flex items-center gap-1 leading-tight mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                서울 마포구 연남동
              </p>
            </div>
          </div>
          <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-full hover:bg-card transition-smooth" aria-label="알림">
            <Bell className="h-5 w-5 text-foreground" />
            {!!unread && unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-[10px] text-accent-foreground font-bold flex items-center justify-center">{unread}</span>}
          </button>
        </div>

        <Link to="/search" className="flex items-center gap-2 bg-card rounded-2xl px-4 py-3 shadow-soft transition-smooth hover:shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t.home.searchPlaceholder}</span>
        </Link>
      </header>

      <section className="px-4 pt-5">
        {heroBanner ? (
          <a href={heroBanner.link_url ?? "#"} className="block rounded-2xl overflow-hidden shadow-glow relative">
            {heroBanner.image_url ? (
              <img src={heroBanner.image_url} alt={heroBanner.title} className="w-full aspect-[16/9] object-cover" />
            ) : (
              <div className="gradient-primary p-5 text-primary-foreground aspect-[16/9] flex flex-col justify-center">
                <Badge className="bg-white/20 text-white border-0 self-start mb-2">{heroBanner.type}</Badge>
                <h2 className="text-xl font-bold">{heroBanner.title}</h2>
                {heroBanner.description && <p className="text-sm text-white/90 mt-1.5 line-clamp-2">{heroBanner.description}</p>}
              </div>
            )}
          </a>
        ) : (
          <div className="gradient-primary rounded-2xl p-5 text-primary-foreground shadow-glow relative overflow-hidden">
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative">
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 mb-2">NEW</Badge>
              <h2 className="text-xl font-bold leading-tight">{t.home.heroTitle}</h2>
              <p className="text-sm text-white/90 mt-1.5">{t.home.heroSubtitle}</p>
            </div>
          </div>
        )}
      </section>

      <section className="px-4 pt-6">
        <div className="grid grid-cols-4 gap-3">
          {categories.slice(0, 8).map((c) => (
            <Link key={c.id} to="/groups" className="flex flex-col items-center gap-1.5 group">
              <div className="h-14 w-14 rounded-2xl bg-primary-soft flex items-center justify-center text-2xl transition-smooth group-hover:scale-105 group-hover:shadow-soft">{c.emoji}</div>
              <span className="text-xs font-medium text-foreground">{getCatLabel(c.id)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pt-6">
        <h3 className="text-xs font-bold text-muted-foreground mb-2">{t.home.quickMenu}</h3>
        <div className="grid grid-cols-5 gap-2">
          {quickMenu.map((m) => (
            <Link key={m.to} to={m.to} className="flex flex-col items-center gap-1 group">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-smooth group-hover:scale-105 ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-7">
        <div className="px-4 flex items-end justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-1.5"><Sparkles className="h-5 w-5 text-accent" />{t.home.recommended}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t.home.recommendedSub}</p>
          </div>
          <Link to="/groups" className="text-xs text-muted-foreground flex items-center">{t.home.seeAll} <ChevronRight className="h-3 w-3" /></Link>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {(recommended ?? []).map((g) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5">
              <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                {g.image_url ? <img src={g.image_url} alt={g.name} loading="lazy" className="h-full w-full object-cover" /> : <Users className="h-8 w-8 text-muted-foreground/30" />}
              </div>
              <div className="p-3">
                <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                <p className="text-sm font-bold mt-0.5 line-clamp-1">{g.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{g.location ?? ""}</p>
              </div>
            </Link>
          ))}
          {(!recommended || recommended.length === 0) && <p className="text-xs text-muted-foreground py-6">{t.home.noGroups}</p>}
        </div>
      </section>

      {user && forYou && forYou.length > 0 && (
        <section className="pt-7">
          <div className="px-4 flex items-end justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-1.5"><Heart className="h-5 w-5 text-accent" />For You</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t.home.forYouSub}</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {forYou.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="flex-shrink-0 w-44 bg-card rounded-2xl overflow-hidden shadow-soft hover:-translate-y-0.5 transition-smooth">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                  {g.image_url ? <img src={g.image_url} alt={g.name} loading="lazy" className="h-full w-full object-cover" /> : <Users className="h-8 w-8 text-muted-foreground/30" />}
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                  <p className="text-sm font-bold line-clamp-1 mt-0.5">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{g.location ?? ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user && followingFeed && followingFeed.length > 0 && (
        <section className="pt-7 px-4">
          <h3 className="text-lg font-bold flex items-center gap-1.5 mb-3"><UserPlus className="h-5 w-5 text-primary" />{t.home.followFeed}</h3>
          <div className="space-y-2">
            {followingFeed.map((g: any) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-soft hover:shadow-card transition-smooth">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                  {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                  <p className="text-sm font-bold truncate">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.home.followingNew}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-7">
        <div className="flex items-end justify-between mb-3">
          <h3 className="text-lg font-bold flex items-center gap-1.5"><TrendingUp className="h-5 w-5 text-accent" />{t.home.trending}</h3>
        </div>
        <div className="space-y-3">
          {(hot ?? []).map((g: any) => (
            <Link key={g.id} to={`/groups/${g.id}`} className="flex gap-3 bg-card rounded-2xl p-3 shadow-soft transition-smooth hover:shadow-card">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                {g.image_url ? <img src={g.image_url} alt={g.name} loading="lazy" className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-muted-foreground/30" />}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="bg-accent-soft text-[hsl(var(--chip-2-fg))] border-0 text-[10px] py-0">🔥 HOT</Badge>
                  <span className="text-[11px] text-muted-foreground">{g.category}</span>
                </div>
                <p className="text-sm font-bold mt-1 line-clamp-1">{g.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{g.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{g.location}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="h-6" />
    </MobileShell>
  );
};

export default Home;
