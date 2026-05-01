import { Star, MapPin } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { classes } from "@/data/mock";
import { useState } from "react";
import { cn } from "@/lib/utils";

const filters = ["전체", "공예", "쿠킹", "요가", "사진", "독서", "아웃도어"];

const Classes = () => {
  const [active, setActive] = useState("전체");
  const list = active === "전체" ? classes : classes.filter((c) => c.category === active);

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <h1 className="text-xl font-bold mb-1">클래스</h1>
        <p className="text-xs text-muted-foreground mb-3">새로운 취미를 배워보세요</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-smooth",
                active === f
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-secondary"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 grid grid-cols-2 gap-3 animate-fade-in">
        {list.map((c) => (
          <a
            key={c.id}
            href={`/classes/${c.id}`}
            className="bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5"
          >
            <div className="aspect-square overflow-hidden bg-muted">
              <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="p-3">
              <p className="text-[10px] font-semibold text-primary">{c.category}</p>
              <p className="text-sm font-bold mt-0.5 line-clamp-2 leading-tight min-h-[2.5rem]">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-0.5">
                <MapPin className="h-3 w-3" /> {c.location}
              </p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-0.5 text-[11px]">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span className="font-bold">{c.rating}</span>
                  <span className="text-muted-foreground">({c.reviews})</span>
                </div>
              </div>
              <p className="text-sm font-bold mt-1.5">
                {c.price.toLocaleString()}<span className="text-xs font-normal">원</span>
              </p>
            </div>
          </a>
        ))}
      </div>
      <div className="h-6" />
    </MobileShell>
  );
};

export default Classes;