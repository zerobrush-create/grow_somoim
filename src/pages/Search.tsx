import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Users, GraduationCap, User as UserIcon, Hash, X, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Tab = "all" | "groups" | "classes" | "users" | "tags";
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "groups", label: "모임" },
  { id: "classes", label: "클래스" },
  { id: "users", label: "유저" },
  { id: "tags", label: "태그" },
];

const useDebounced = <T,>(value: T, delay = 250) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
};

const Search = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "all");
  const debounced = useDebounced(q.trim(), 250);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced) next.set("q", debounced);
    if (tab !== "all") next.set("tab", tab);
    setParams(next, { replace: true });
  }, [debounced, tab, setParams]);

  // Save search history (debounced, only when typed enough)
  useEffect(() => {
    if (!user || debounced.length < 2) return;
    supabase.from("search_history").insert({ user_id: user.id, query: debounced }).then(() => {});
  }, [debounced, user]);

  const { data: history } = useQuery({
    queryKey: ["search-history", user?.id],
    enabled: !!user && !debounced,
    queryFn: async () => {
      const { data } = await supabase.from("search_history").select("query,created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(8);
      const seen = new Set<string>();
      return (data ?? []).filter((h) => { if (seen.has(h.query)) return false; seen.add(h.query); return true; });
    },
  });

  const enabled = debounced.length >= 1;
  const like = `%${debounced}%`;

  const { data: groups } = useQuery({
    queryKey: ["search-groups", debounced],
    enabled: enabled && (tab === "all" || tab === "groups"),
    queryFn: async () => (await supabase.from("groups").select("id,name,category,location,image_url").or(`name.ilike.${like},description.ilike.${like},location.ilike.${like},category.ilike.${like}`).eq("status", "active").limit(20)).data ?? [],
  });

  const { data: classes } = useQuery({
    queryKey: ["search-classes", debounced],
    enabled: enabled && (tab === "all" || tab === "classes"),
    queryFn: async () => (await supabase.from("classes").select("id,title,category,location,image_url,price").or(`title.ilike.${like},description.ilike.${like},location.ilike.${like},category.ilike.${like}`).limit(20)).data ?? [],
  });

  const { data: users } = useQuery({
    queryKey: ["search-users", debounced],
    enabled: enabled && (tab === "all" || tab === "users"),
    queryFn: async () => (await supabase.from("profiles").select("id,name,nickname,avatar_url,location").or(`name.ilike.${like},nickname.ilike.${like},bio.ilike.${like}`).limit(20)).data ?? [],
  });

  const { data: tags } = useQuery({
    queryKey: ["search-tags", debounced],
    enabled: enabled && (tab === "all" || tab === "tags"),
    queryFn: async () => {
      const { data } = await supabase.from("group_tags").select("tag,group_id").ilike("tag", like).limit(60);
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => counts.set(r.tag, (counts.get(r.tag) ?? 0) + 1));
      return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([tag, count]) => ({ tag, count }));
    },
  });

  const empty = enabled && !groups?.length && !classes?.length && !users?.length && !tags?.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로"><ArrowLeft className="h-5 w-5" /></button>
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="모임, 클래스, 유저, #태그" className="pl-9 pr-9 h-10 rounded-full" />
              {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center" aria-label="지우기"><X className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-smooth", tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{t.label}</button>
            ))}
          </div>
        </header>

        {!enabled && (
          <div className="p-4 space-y-4">
            {history && history.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-muted-foreground mb-2">최근 검색</h3>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button key={h.query} onClick={() => setQ(h.query)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-xs">
                      <Clock className="h-3 w-3" />{h.query}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <p className="text-center text-xs text-muted-foreground pt-8">검색어를 입력해 주세요</p>
          </div>
        )}

        {empty && <p className="text-center text-sm text-muted-foreground py-16">"{debounced}"에 대한 결과가 없어요</p>}

        <div className="px-4 py-3 space-y-5">
          {(tab === "all" || tab === "groups") && groups && groups.length > 0 && (
            <section>
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2"><Users className="h-4 w-4 text-primary" />모임 {groups.length}</h3>
              <div className="space-y-2">
                {groups.map((g) => (
                  <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 bg-card rounded-xl p-2 border border-border hover:shadow-soft transition-smooth">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                      <p className="text-sm font-bold truncate">{g.name}</p>
                      {g.location && <p className="text-[11px] text-muted-foreground truncate">{g.location}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "classes") && classes && classes.length > 0 && (
            <section>
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2"><GraduationCap className="h-4 w-4 text-primary" />클래스 {classes.length}</h3>
              <div className="space-y-2">
                {classes.map((c) => (
                  <Link key={c.id} to={`/classes/${c.id}`} className="flex items-center gap-3 bg-card rounded-xl p-2 border border-border">
                    <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {c.image_url ? <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" /> : <GraduationCap className="h-5 w-5 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary font-semibold">{c.category}</p>
                      <p className="text-sm font-bold truncate">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">{c.price ?? "무료"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "users") && users && users.length > 0 && (
            <section>
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2"><UserIcon className="h-4 w-4 text-primary" />유저 {users.length}</h3>
              <div className="space-y-2">
                {users.map((u) => (
                  <Link key={u.id} to={`/users/${u.id}`} className="flex items-center gap-3 bg-card rounded-xl p-2 border border-border">
                    <Avatar className="h-10 w-10"><AvatarImage src={u.avatar_url ?? undefined} /><AvatarFallback>{(u.name ?? u.nickname ?? "U").charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{u.name ?? u.nickname ?? "회원"}</p>
                      {u.location && <p className="text-[11px] text-muted-foreground truncate">{u.location}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(tab === "all" || tab === "tags") && tags && tags.length > 0 && (
            <section>
              <h3 className="text-sm font-bold flex items-center gap-1.5 mb-2"><Hash className="h-4 w-4 text-primary" />태그 {tags.length}</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link key={t.tag} to={`/tags/${encodeURIComponent(t.tag)}`}>
                    <Badge variant="secondary" className="bg-primary-soft text-primary border-0 hover:bg-primary-soft/70">#{t.tag} <span className="ml-1 text-[10px] text-muted-foreground">{t.count}</span></Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;