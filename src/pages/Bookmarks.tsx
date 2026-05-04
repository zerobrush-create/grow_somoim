import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Users, Heart, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "group" | "class";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("group");

  const { data: items, isLoading } = useQuery({
    queryKey: ["bookmarks", user?.id, tab],
    enabled: !!user,
    queryFn: async () => {
      const { data: bms } = await supabase
        .from("bookmarks")
        .select("id,target_type,target_id,created_at")
        .eq("user_id", user!.id)
        .eq("target_type", tab)
        .order("created_at", { ascending: false });
      const ids = (bms ?? []).map((b) => b.target_id);
      if (!ids.length) return [];
      if (tab === "group") {
        const { data: gs } = await supabase.from("groups").select("id,name,location,image_url,category").in("id", ids);
        return (bms ?? []).map((b) => ({ ...b, item: (gs ?? []).find((g) => g.id === b.target_id) })).filter((x) => x.item);
      } else {
        const numIds = ids.map((i) => Number(i)).filter((n) => !isNaN(n));
        const { data: cs } = await supabase.from("classes").select("id,title,category,image_url,location,price").in("id", numIds);
        return (bms ?? []).map((b) => ({ ...b, item: (cs ?? []).find((c) => String(c.id) === b.target_id) })).filter((x) => x.item);
      }
    },
  });

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">{t.bookmarks.loading}</div>;
  if (!user) return <Navigate to="/login" replace />;

  const tabItems: { id: Tab; label: string }[] = [
    { id: "group", label: t.bookmarks.tabGroups },
    { id: "class", label: t.bookmarks.tabClasses },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={t.common.back}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">{t.bookmarks.title}</h1>
        </header>

        <div className="flex border-b border-border">
          {tabItems.map((tabItem) => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)} className={cn(
              "flex-1 py-2.5 text-sm font-semibold border-b-2 transition-smooth",
              tab === tabItem.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}>{tabItem.label}</button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-10">{t.bookmarks.loading}</p>
          ) : items && items.length > 0 ? (
            items.map((b: any) => (
              <Link key={b.id} to={tab === "group" ? `/groups/${b.item.id}` : `/classes/${b.item.id}`} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {b.item.image_url ? <img src={b.item.image_url} alt={b.item.name ?? b.item.title} className="h-full w-full object-cover" /> : (tab === "group" ? <Users className="h-6 w-6 text-muted-foreground/40" /> : <BookOpen className="h-6 w-6 text-muted-foreground/40" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{b.item.name ?? b.item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{b.item.category}{b.item.location ? ` · ${b.item.location}` : ""}{b.item.price ? ` · ${b.item.price}` : ""}</p>
                </div>
                <Heart className="h-4 w-4 fill-accent text-accent" />
              </Link>
            ))
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              {t.bookmarks.empty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
