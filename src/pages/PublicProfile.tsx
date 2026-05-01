import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("profiles").select("id,name,avatar_url,bio,location,mbti,interests").eq("id", id!).maybeSingle()).data,
  });

  const { data: groups } = useQuery({
    queryKey: ["public-profile-groups", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: ms } = await supabase.from("memberships").select("group_id").eq("user_id", id!).eq("status", "approved").limit(10);
      const ids = (ms ?? []).map((m) => m.group_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("groups").select("id,name,image_url").in("id", ids);
      return data ?? [];
    },
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
  if (!profile) return <div className="p-10 text-center text-sm text-muted-foreground">존재하지 않는 사용자예요</div>;

  const isMe = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">프로필</h1>
        </header>

        <section className="p-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft text-center">
            <Avatar className="h-20 w-20 mx-auto"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback><User className="h-8 w-8" /></AvatarFallback></Avatar>
            <h2 className="text-lg font-bold mt-3">{profile.name ?? "회원"}</h2>
            {profile.mbti && <Badge className="mt-1">{profile.mbti}</Badge>}
            {profile.location && <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2"><MapPin className="h-3 w-3" />{profile.location}</p>}
            {profile.bio && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{profile.bio}</p>}
            {!isMe && user && (
              <Button onClick={() => navigate(`/dm/${profile.id}`)} className="mt-4 w-full">
                <MessageCircle className="h-4 w-4 mr-1" /> 메시지 보내기
              </Button>
            )}
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold mb-2">관심사</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => <Badge key={i} variant="secondary" className="bg-primary-soft text-primary border-0">{i}</Badge>)}
              </div>
            </div>
          )}

          {groups && groups.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold mb-2">참여 모임</h3>
              <div className="space-y-2">
                {groups.map((g) => (
                  <Link key={g.id} to={`/groups/${g.id}`} className="flex items-center gap-3 bg-card rounded-xl p-2 border border-border">
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden">{g.image_url && <img src={g.image_url} alt={g.name} className="h-full w-full object-cover" />}</div>
                    <span className="text-sm font-semibold truncate">{g.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicProfile;
