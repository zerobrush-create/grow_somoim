import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Plus, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const filters = ["전체", "공예", "쿠킹", "요가", "사진", "독서", "아웃도어"];

const Classes = () => {
  const [active, setActive] = useState("전체");
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: list, isLoading } = useQuery({
    queryKey: ["classes", active],
    queryFn: async () => {
      let q = supabase.from("classes").select("id,title,category,price,image_url,location,instructor_id").order("created_at", { ascending: false }).limit(60);
      if (active !== "전체") q = q.eq("category", active);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold">클래스</h1>
          {user && (
            <Button size="sm" onClick={() => navigate("/classes/new")} className="gradient-primary h-8">
              <Plus className="h-4 w-4 mr-1" />클래스 개설
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">새로운 취미를 배워보세요</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {filters.map((f) => (
            <button key={f} onClick={() => setActive(f)} className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-smooth",
              active === f ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-secondary"
            )}>{f}</button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 grid grid-cols-2 gap-3 animate-fade-in">
        {isLoading ? (
          <><Skeleton className="aspect-square" /><Skeleton className="aspect-square" /></>
        ) : list && list.length > 0 ? (
          list.map((c) => (
            <Link key={c.id} to={`/classes/${c.id}`} className="bg-card rounded-2xl overflow-hidden shadow-soft transition-smooth hover:shadow-card hover:-translate-y-0.5">
              <div className="aspect-square overflow-hidden bg-muted flex items-center justify-center">
                {c.image_url ? <img src={c.image_url} alt={c.title} loading="lazy" className="h-full w-full object-cover" /> : <BookOpen className="h-10 w-10 text-muted-foreground/30" />}
              </div>
              <div className="p-3">
                {c.category && <p className="text-[10px] font-semibold text-primary">{c.category}</p>}
                <p className="text-sm font-bold mt-0.5 line-clamp-2 leading-tight min-h-[2.5rem]">{c.title}</p>
                {c.location && (
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" /> {c.location}
                  </p>
                )}
                <p className="text-sm font-bold mt-1.5">{c.price ?? "무료"}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-2 text-center py-16 text-sm text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
            아직 등록된 클래스가 없어요
          </div>
        )}
      </div>
      <div className="h-6" />
    </MobileShell>
  );
};

export default Classes;
