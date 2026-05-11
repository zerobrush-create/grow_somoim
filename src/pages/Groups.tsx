import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, Users, Plus, X, Star, History } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { categories } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGroups, mapCategoryFilter } from "@/hooks/useGroups";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText } from "@/i18n/format";

const LOCATIONS = ["전체", "서울", "경기", "인천", "부산", "대구", "광주", "대전", "온라인"];
type SortKey = "recent" | "popular" | "rating";
const PAGE_SIZE = 12;

const Groups = () => {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("전체");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showHistory, setShowHistory] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const { data: groups, isLoading, error } = useGroups();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lang, t } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
  const myOnly = searchParams.get("mine") === "1";

  const SORTS: { id: SortKey; label: string }[] = [
    { id: "recent", label: t.groups.sortRecent },
    { id: "popular", label: t.groups.sortPopular },
    { id: "rating", label: t.groups.sortRating },
  ];

  const LOCATION_KEYS: Record<string, keyof typeof t.locations> = {
    "전체": "all", "서울": "seoul", "경기": "gyeonggi", "인천": "incheon",
    "부산": "busan", "대구": "daegu", "광주": "gwangju", "대전": "daejeon", "온라인": "online",
  };
  const getLocationLabel = (loc: string) => t.locations[LOCATION_KEYS[loc] ?? "all"] ?? loc;

  const { data: history } = useQuery({
    queryKey: ["search-history", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("search_history").select("id,query,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  const { data: myGroupIds = [] } = useQuery({
    queryKey: ["my-group-ids", user?.id, myOnly],
    enabled: !!user && myOnly,
    queryFn: async () => {
      const { data } = await supabase
        .from("memberships")
        .select("group_id")
        .eq("user_id", user!.id)
        .eq("status", "approved");
      return (data ?? []).map((m) => m.group_id);
    },
  });

  const saveQuery = useMutation({
    mutationFn: async (q: string) => {
      if (!user || !q.trim()) return;
      await supabase.from("search_history").insert({ user_id: user.id, query: q.trim() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-history", user?.id] }),
  });
  const removeHistory = useMutation({
    mutationFn: async (id: number) => { await supabase.from("search_history").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-history", user?.id] }),
  });

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) saveQuery.mutate(query);
    setShowHistory(false);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [active, query, region, sort]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE_SIZE);
    }, { rootMargin: "200px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filtered = (groups ?? []).filter((g) => {
    if (myOnly && !myGroupIds.includes(g.id)) return false;
    if (active !== "all" && g.category !== mapCategoryFilter(active)) return false;
    if (region !== "전체" && !(g.location ?? "").includes(region)) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = `${g.name} ${g.description ?? ""} ${g.category} ${g.location ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "popular") return b.members - a.members;
    if (sort === "rating") return b.rating - a.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const visibleGroups = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const getCatLabel = (id: string) =>
    t.categories[id as keyof typeof t.categories] ?? id;

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-bold flex-1">{myOnly ? t.profile.myGroups : t.nav.groups}</h1>
          <Link
            to="/groups/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-smooth hover:bg-primary/90"
            aria-label={t.groups.create}
          >
            <Plus className="h-4 w-4" />
            <span>{t.groups.create}</span>
          </Link>
        </div>
        <form onSubmit={onSearchSubmit} className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            placeholder={t.groups.searchPlaceholder}
            className="pl-9 pr-9 h-10 rounded-full bg-muted border-0"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={tr("지우기")}>
              <X className="h-4 w-4" />
            </button>
          )}
          {showHistory && history && history.length > 0 && (
            <div className="absolute z-40 left-0 right-0 top-12 bg-card rounded-2xl border border-border shadow-card p-2 space-y-1">
              <p className="text-[11px] text-muted-foreground px-2 py-1 flex items-center gap-1"><History className="h-3 w-3" />{t.groups.recentSearch}</p>
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-lg">
                  <button type="button" onMouseDown={() => { setQuery(h.query); setShowHistory(false); }} className="flex-1 text-left text-sm truncate">{h.query}</button>
                    <button type="button" onMouseDown={() => removeHistory.mutate(h.id)} className="text-muted-foreground" aria-label={tr("삭제")}><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </form>
        <div className="flex gap-2 mb-2">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-smooth",
                sort === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >{s.label}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 mb-2">
          {LOCATIONS.map((l) => (
            <button
              key={l}
              onClick={() => setRegion(l)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-smooth",
                region === l ? "bg-foreground text-background" : "bg-muted text-foreground"
              )}
            >
              {getLocationLabel(l)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-smooth",
                active === c.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-foreground hover:bg-secondary"
              )}
            >
              <span>{c.emoji}</span>
              <span>{getCatLabel(c.id)}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3 animate-fade-in">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 bg-card rounded-2xl shadow-soft">
                <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </>
        )}

        {error && (
          <div className="text-center py-16 text-destructive text-sm">
            {t.groups.loadError}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {t.groups.empty}
          </div>
        )}

        {visibleGroups.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="block bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="flex gap-3 p-3">
              <div className="h-24 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative flex items-center justify-center">
                {g.image_url ? (
                  <OptimizedImage src={g.image_url} alt={g.name} className="h-full w-full" />
                ) : (
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <Badge variant="secondary" className="bg-primary-soft text-primary border-0 text-[10px] py-0">
                  {tr(g.category)}
                </Badge>
                <p className="text-base font-bold mt-1 line-clamp-1">{tr(g.name)}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tr(g.description)}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  {g.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {tr(g.location)}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" /> {g.members}{t.groups.membersUnit}
                  </span>
                  {g.reviewCount > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-accent text-accent" /> {g.rating}
                      <span className="text-muted-foreground/70">({g.reviewCount})</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
        {hasMore && <div ref={sentinelRef} className="py-4 flex justify-center"><div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}
        <div className="h-4" />
      </div>
    </MobileShell>
  );
};

export default Groups;
