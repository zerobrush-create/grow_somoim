import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Hash, Users } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const TagSearch = () => {
  const { tag } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const decoded = decodeURIComponent(tag ?? "").toLowerCase();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["tag-groups", decoded],
    enabled: !!decoded,
    queryFn: async () => {
      const { data: tags } = await supabase.from("group_tags").select("group_id").eq("tag", decoded);
      const ids = (tags ?? []).map((t) => t.group_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("groups").select("id,name,category,location,image_url,description").in("id", ids).eq("status", "active");
      return data ?? [];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["tag-posts", decoded],
    enabled: !!decoded,
    queryFn: async () => {
      const { data } = await supabase.from("board_posts").select("id,title,content,group_id,created_at").ilike("content", `%#${decoded}%`).order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label={t.common.back}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold flex items-center gap-1.5"><Hash className="h-5 w-5 text-primary" />{decoded}</h1>
      </header>

      <section className="px-4 pt-4">
        <h2 className="text-sm font-bold mb-2">{t.tagSearch.relatedGroups}</h2>
        {isLoading ? <Skeleton className="h-20" /> : groups && groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="flex gap-3 bg-card rounded-2xl p-3 shadow-soft">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                  {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                  <p className="text-sm font-bold truncate">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{g.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground py-4">{t.tagSearch.noGroups}</p>}
      </section>

      <section className="px-4 pt-6 pb-6">
        <h2 className="text-sm font-bold mb-2">{t.tagSearch.relatedPosts}</h2>
        {posts && posts.length > 0 ? (
          <div className="space-y-2">
            {posts.map((p) => (
              <Link key={p.id} to={`/groups/${p.group_id}/board`} className="block bg-card rounded-2xl p-3 shadow-soft">
                <p className="text-sm font-bold truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.content}</p>
              </Link>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground py-4">{t.tagSearch.noPosts}</p>}
      </section>
    </MobileShell>
  );
};

export default TagSearch;
