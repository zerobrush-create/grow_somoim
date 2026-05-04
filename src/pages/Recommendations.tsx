import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Users, UserPlus, Wand2 } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";

const Recommendations = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: profile } = useQuery({
    queryKey: ["rec-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("interests,location").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: aiRecs, isLoading: aiLoading, isError: aiError } = useQuery({
    queryKey: ["ai-recs", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-recommend", { body: {} });
      if (error) throw error;
      return (data?.recommendations ?? []) as Array<{
        id: string; reason: string; score: number;
        group: { id: string; name: string; category: string; location: string; description: string; tags: string[] };
      }>;
    },
  });

  const { data: people, isLoading: peopleLoading } = useQuery({
    queryKey: ["rec-people", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: myFollows } = await supabase.from("follows").select("following_id").eq("follower_id", user!.id);
      const followedSet = new Set((myFollows ?? []).map((f) => f.following_id));
      followedSet.add(user!.id);
      const { data: allFollows } = await supabase.from("follows").select("following_id").limit(1000);
      const counts: Record<string, number> = {};
      (allFollows ?? []).forEach((f) => { counts[f.following_id] = (counts[f.following_id] ?? 0) + 1; });
      const top = Object.entries(counts)
        .filter(([id]) => !followedSet.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, c]) => ({ id, score: c }));
      if (!top.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("id,name,nickname,avatar_url,bio").in("id", top.map((t) => t.id));
      return top.map((t) => ({ ...t, profile: profiles?.find((p) => p.id === t.id) })).filter((t) => t.profile);
    },
  });

  const { data: recGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["rec-groups", user?.id, profile?.interests, profile?.location],
    enabled: !!user,
    queryFn: async () => {
      const interests = (profile?.interests ?? []) as string[];
      const loc = profile?.location ?? "";
      const { data: groups } = await supabase.from("groups").select("id,name,category,location,image_url,description").eq("status", "active").limit(60);
      const { data: myMem } = await supabase.from("memberships").select("group_id").eq("user_id", user!.id);
      const joined = new Set((myMem ?? []).map((m) => m.group_id));
      const ids = (groups ?? []).map((g) => g.id);
      const { data: members } = await supabase.from("memberships").select("group_id").in("group_id", ids).eq("status", "approved");
      const memberCount: Record<string, number> = {};
      (members ?? []).forEach((m) => { memberCount[m.group_id] = (memberCount[m.group_id] ?? 0) + 1; });
      return (groups ?? [])
        .filter((g) => !joined.has(g.id))
        .map((g) => {
          let score = 0;
          if (interests.includes(g.category)) score += 10;
          if (loc && g.location && g.location.includes(loc)) score += 5;
          score += Math.min(memberCount[g.id] ?? 0, 20) * 0.3;
          return { ...g, score, members: memberCount[g.id] ?? 0 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
  });

  return (
    <MobileShell>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-3 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" />{t.recommendations.title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t.recommendations.subtitle}</p>
      </header>

      {!user && <div className="text-center py-20 text-sm text-muted-foreground">{t.recommendations.loginRequired}</div>}

      {user && (
        <>
          <section className="px-4 pt-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
              <Wand2 className="h-4 w-4 text-accent" />{t.recommendations.aiRecs}
            </h2>
            {aiLoading ? (
              <Skeleton className="h-24" />
            ) : aiError ? (
              <p className="text-xs text-muted-foreground py-4">{t.recommendations.aiError}</p>
            ) : aiRecs && aiRecs.length > 0 ? (
              <div className="space-y-2">
                {aiRecs.map((r) => (
                  <Link
                    key={r.id}
                    to={`/groups/${r.id}`}
                    className="block bg-gradient-to-br from-primary-soft to-card rounded-2xl p-3 shadow-soft border border-primary/10"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-primary font-semibold">{r.group.category}</p>
                      <span className="text-[10px] text-muted-foreground">{t.recommendations.matchPct} {Math.round(r.score)}%</span>
                    </div>
                    <p className="text-sm font-bold mt-0.5">{r.group.name}</p>
                    <p className="text-[11px] text-foreground/80 mt-1 leading-relaxed">💡 {r.reason}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-4">{t.recommendations.noAiRecs}</p>
            )}
          </section>

          <section className="px-4 pt-5">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5"><UserPlus className="h-4 w-4 text-primary" />{t.recommendations.people}</h2>
            {peopleLoading ? <Skeleton className="h-20" /> : people && people.length > 0 ? (
              <div className="space-y-2">
                {people.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-soft">
                    <Link to={`/users/${p.id}`}>
                      <Avatar className="h-12 w-12"><AvatarImage src={p.profile?.avatar_url ?? undefined} /><AvatarFallback>{(p.profile?.nickname || p.profile?.name || "?").slice(0,1)}</AvatarFallback></Avatar>
                    </Link>
                    <Link to={`/users/${p.id}`} className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.profile?.nickname || p.profile?.name || "?"}</p>
                      <p className="text-[11px] text-muted-foreground">{t.recommendations.followers} {p.score}</p>
                    </Link>
                    <FollowButton targetUserId={p.id} />
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground py-6">{t.recommendations.noPeople}</p>}
          </section>

          <section className="px-4 pt-7 pb-6">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" />{t.recommendations.recGroups}</h2>
            {groupsLoading ? <Skeleton className="h-20" /> : recGroups && recGroups.length > 0 ? (
              <div className="space-y-2">
                {recGroups.map((g) => (
                  <Link key={g.id} to={`/groups/${g.id}`} className="flex gap-3 bg-card rounded-2xl p-3 shadow-soft hover:shadow-card transition-smooth">
                    <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {g.image_url ? <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary font-semibold">{g.category}</p>
                      <p className="text-sm font-bold truncate">{g.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{g.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{g.location} · {g.members}{t.groups.membersUnit}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground py-6">{t.recommendations.noGroups}</p>}
          </section>
        </>
      )}
    </MobileShell>
  );
};

export default Recommendations;
