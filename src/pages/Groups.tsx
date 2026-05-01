import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Users } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { categories } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGroups, mapCategoryFilter } from "@/hooks/useGroups";

const Groups = () => {
  const [active, setActive] = useState("all");
  const { data: groups, isLoading, error } = useGroups();

  const filtered = (groups ?? []).filter((g) => {
    if (active === "all") return true;
    return g.category === mapCategoryFilter(active);
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-bold flex-1">소모임</h1>
          <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="검색">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-smooth" aria-label="필터">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
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
              <span>{c.label}</span>
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
            모임을 불러오지 못했어요
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            아직 이 카테고리의 모임이 없어요
          </div>
        )}

        {filtered.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="block bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="flex gap-3 p-3">
              <div className="h-24 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative flex items-center justify-center">
                {g.image_url ? (
                  <img src={g.image_url} alt={g.name} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <Badge variant="secondary" className="bg-primary-soft text-primary border-0 text-[10px] py-0">
                  {g.category}
                </Badge>
                <p className="text-base font-bold mt-1 line-clamp-1">{g.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  {g.location && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {g.location}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" /> {g.members}명
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        <div className="h-4" />
      </div>
    </MobileShell>
  );
};

export default Groups;
