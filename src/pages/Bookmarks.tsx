import { Link, useNavigate, Navigate } from "react-router-dom";
import { ArrowLeft, Users, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Bookmarks = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["bookmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: bms } = await supabase
        .from("bookmarks")
        .select("id,target_type,target_id,created_at")
        .eq("user_id", user!.id)
        .eq("target_type", "group")
        .order("created_at", { ascending: false });
      const ids = (bms ?? []).map((b) => b.target_id);
      if (!ids.length) return [];
      const { data: gs } = await supabase.from("groups").select("id,name,location,image_url,category").in("id", ids);
      return (bms ?? []).map((b) => ({ ...b, group: (gs ?? []).find((g) => g.id === b.target_id) })).filter((x) => x.group);
    },
  });

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">찜한 모임</h1>
        </header>

        <div className="p-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground py-10">불러오는 중...</p>
          ) : items && items.length > 0 ? (
            items.map((b) => (
              <Link key={b.id} to={`/groups/${b.group!.id}`} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {b.group!.image_url ? <img src={b.group!.image_url} alt={b.group!.name} className="h-full w-full object-cover" /> : <Users className="h-6 w-6 text-muted-foreground/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{b.group!.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{b.group!.category}{b.group!.location ? ` · ${b.group!.location}` : ""}</p>
                </div>
                <Heart className="h-4 w-4 fill-accent text-accent" />
              </Link>
            ))
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <Heart className="h-10 w-10 mx-auto mb-2 opacity-30" />
              아직 찜한 모임이 없어요
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
