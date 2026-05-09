import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Plus, BookOpen, Search, X, Star, History } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText } from "@/i18n/format";
import { normalizeClassCategory } from "@/lib/classCategories";

type SortKey = "recent" | "popular" | "rating";

const priceText = (value: unknown) => (value == null ? "" : String(value).trim());

const priceNumber = (value: unknown) => {
  const raw = priceText(value).replace(/[^\d.-]/g, "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const isFreePrice = (value: unknown) => {
  const raw = priceText(value).toLowerCase();
  if (!raw) return true;
  if (raw === "무료" || raw === "free") return true;
  const amount = priceNumber(raw);
  return amount === 0;
};

const formatClassPrice = (value: unknown, freeLabel: string, translate: (value?: string | null) => string) => {
  const raw = priceText(value);
  if (isFreePrice(raw)) return freeLabel;
  if (/[^\d,\s.-]/.test(raw)) return translate(raw);
  const amount = priceNumber(raw);
  return amount == null ? translate(raw) : `${amount.toLocaleString()}원`;
};

const Classes = () => {
  const [active, setActive] = useState("전체");
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("전체");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { lang, t } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);

  const CLASS_FILTERS = [
    { id: "전체", label: t.classes.catAll },
    { id: "공예", label: t.classes.catCraft },
    { id: "쿠킹", label: t.classes.catCooking },
    { id: "요가", label: t.classes.catYoga },
    { id: "사진", label: t.classes.catPhoto },
    { id: "독서", label: t.classes.catReading },
    { id: "아웃도어", label: t.classes.catOutdoor },
    { id: "운동", label: t.categories.exercise },
    { id: "음악", label: t.categories.music },
    { id: "미술", label: t.categories.art },
    { id: "언어", label: t.categories.language },
    { id: "IT", label: t.categories.tech },
    { id: "비즈니스", label: t.categories.business },
    { id: "재테크", label: t.categories.finance },
    { id: "댄스", label: t.categories.dance },
    { id: "명상", label: t.categories.meditation },
    { id: "글쓰기", label: t.categories.writing },
    { id: "영화", label: t.categories.movie },
    { id: "게임", label: t.categories.game },
    { id: "뷰티", label: t.categories.beauty },
    { id: "육아", label: t.categories.parenting },
    { id: "봉사", label: t.categories.volunteer },
    { id: "건강", label: t.categories.health },
    { id: "기타", label: t.classes.catOther },
  ];

  const PRICE_FILTERS = [
    { id: "전체", label: t.classes.priceAll },
    { id: "무료", label: t.classes.priceFree },
    { id: "유료", label: t.classes.pricePaid },
  ];

  const SORTS: { id: SortKey; label: string }[] = [
    { id: "recent", label: t.groups.sortRecent },
    { id: "popular", label: t.groups.sortPopular },
    { id: "rating", label: t.groups.sortRating },
  ];

  const { data: list, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      let q = supabase.from("classes").select("id,title,category,price,image_url,location,instructor_id").order("created_at", { ascending: false }).limit(60);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reviewAgg } = useQuery({
    queryKey: ["classes-review-agg"],
    queryFn: async () => {
      const { data } = await supabase.from("class_reviews").select("class_id,rating");
      const map: Record<number, { sum: number; count: number }> = {};
      (data ?? []).forEach((r) => {
        const k = r.class_id as number;
        map[k] = map[k] || { sum: 0, count: 0 };
        map[k].sum += r.rating; map[k].count += 1;
      });
      return map;
    },
  });

  const { data: enrollAgg } = useQuery({
    queryKey: ["classes-enroll-agg"],
    queryFn: async () => {
      const { data } = await supabase.from("class_enrollments").select("class_id").eq("status", "approved");
      const map: Record<number, number> = {};
      (data ?? []).forEach((r) => { map[r.class_id as number] = (map[r.class_id as number] ?? 0) + 1; });
      return map;
    },
  });

  const { data: history } = useQuery({
    queryKey: ["search-history-class", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("search_history").select("id,query").eq("user_id", user!.id).ilike("query", "cls:%").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });
  const saveQuery = useMutation({
    mutationFn: async (q: string) => { if (!user || !q.trim()) return; await supabase.from("search_history").insert({ user_id: user.id, query: `cls:${q.trim()}` }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-history-class", user?.id] }),
  });
  const removeHistory = useMutation({
    mutationFn: async (id: number) => { await supabase.from("search_history").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["search-history-class", user?.id] }),
  });

  const filtered = (list ?? []).filter((c) => {
    if (active !== "전체" && normalizeClassCategory(c.category, c.title) !== active) return false;
    const free = isFreePrice(c.price);
    if (price === "무료" && !free) return false;
    if (price === "유료" && free) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = [c.title, c.category, c.location].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "popular") return (enrollAgg?.[b.id] ?? 0) - (enrollAgg?.[a.id] ?? 0);
    if (sort === "rating") {
      const ra = reviewAgg?.[a.id] ? reviewAgg[a.id].sum / reviewAgg[a.id].count : 0;
      const rb = reviewAgg?.[b.id] ? reviewAgg[b.id].sum / reviewAgg[b.id].count : 0;
      return rb - ra;
    }
    return b.id - a.id;
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">{t.nav.classes}</h1>
          {user && (
            <Button size="sm" onClick={() => navigate("/classes/new")} className="gradient-primary h-8">
              <Plus className="h-4 w-4 mr-1" />{t.classes.create}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">{t.classes.subtitle}</p>
        <form onSubmit={(e) => { e.preventDefault(); if (query.trim()) saveQuery.mutate(query); setShowHistory(false); }} className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 150)}
            placeholder={t.classes.searchPlaceholder}
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
              {history.map((h) => {
                const text = h.query.replace(/^cls:/, "");
                return (
                  <div key={h.id} className="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-lg">
                    <button type="button" onMouseDown={() => { setQuery(text); setShowHistory(false); }} className="flex-1 text-left text-sm truncate">{text}</button>
                    <button type="button" onMouseDown={() => removeHistory.mutate(h.id)} className="text-muted-foreground" aria-label={tr("삭제")}><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </form>
        <div className="flex gap-2 mb-2">
          {PRICE_FILTERS.map((p) => (
            <button key={p.id} onClick={() => setPrice(p.id)} className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-smooth",
              price === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            )}>{p.label}</button>
          ))}
          <div className="ml-auto flex gap-1">
            {SORTS.map((s) => (
              <button key={s.id} onClick={() => setSort(s.id)} className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-smooth",
                sort === s.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
              )}>{s.label}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {CLASS_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setActive(f.id)} className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-smooth",
              active === f.id ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-secondary"
            )}>{f.label}</button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 grid grid-cols-2 gap-3 animate-fade-in">
        {isLoading ? (
          <><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /></>
        ) : filtered.length > 0 ? (
          filtered.map((c) => (
            <Link key={c.id} to={`/classes/${c.id}`} className="bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5">
              <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
                {c.image_url ? <img src={c.image_url} alt={c.title ?? t.nav.classes} loading="lazy" className="h-full w-full object-cover" /> : <BookOpen className="h-10 w-10 text-muted-foreground/30" />}
              </div>
              <div className="p-3">
                {c.category && <p className="text-[10px] font-semibold text-primary">{tr(c.category)}</p>}
                <p className="text-sm font-bold mt-0.5 line-clamp-2 leading-tight min-h-[2.5rem]">{tr(c.title)}</p>
                {reviewAgg?.[c.id] && (
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{(reviewAgg[c.id].sum / reviewAgg[c.id].count).toFixed(1)}</span>
                    <span>({reviewAgg[c.id].count})</span>
                  </p>
                )}
                {c.location && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {tr(c.location)}
                  </p>
                )}
                <p className="text-sm font-bold mt-1.5">{formatClassPrice(c.price, t.classes.free, tr)}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-2 text-center py-16 text-sm text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            {t.classes.empty}
          </div>
        )}
      </div>
      <div className="h-6" />
    </MobileShell>
  );
};

export default Classes;
