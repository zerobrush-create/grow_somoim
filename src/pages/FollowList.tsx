import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowButton } from "@/components/FollowButton";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "followers" | "following";

const useList = (id: string | undefined, mode: Mode) =>
  useQuery({
    queryKey: ["follow-list", id, mode],
    enabled: !!id,
    queryFn: async () => {
      const col = mode === "followers" ? "follower_id" : "following_id";
      const matchCol = mode === "followers" ? "following_id" : "follower_id";
      const { data: rows } = await supabase.from("follows").select(`id, ${col}`).eq(matchCol, id!).order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r: any) => r[col]);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url,bio").in("id", ids);
      return profs ?? [];
    },
  });

const FollowList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const targetId = id ?? user?.id;

  const { data: followers } = useList(targetId, "followers");
  const { data: following } = useList(targetId, "following");

  const renderList = (items: any[] | undefined) =>
    !items || items.length === 0 ? (
      <p className="text-center text-sm text-muted-foreground py-12">아직 없어요</p>
    ) : (
      <div className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center gap-3 bg-card rounded-2xl p-3 border border-border">
            <Link to={`/users/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-11 w-11"><AvatarImage src={p.avatar_url ?? undefined} /><AvatarFallback><User className="h-5 w-5" /></AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{p.name ?? "회원"}</p>
                {p.bio && <p className="text-xs text-muted-foreground truncate">{p.bio}</p>}
              </div>
            </Link>
            <FollowButton targetUserId={p.id} />
          </div>
        ))}
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">팔로우</h1>
        </header>
        <Tabs defaultValue="followers" className="p-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="followers">팔로워 {followers?.length ?? 0}</TabsTrigger>
            <TabsTrigger value="following">팔로잉 {following?.length ?? 0}</TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4">{renderList(followers)}</TabsContent>
          <TabsContent value="following" className="mt-4">{renderList(following)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FollowList;