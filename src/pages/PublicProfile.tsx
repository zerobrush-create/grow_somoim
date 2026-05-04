import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FollowButton } from "@/components/FollowButton";
import { ReportDialog } from "@/components/ReportDialog";
import { ActivityFeed } from "@/components/ActivityFeed";
import { BlockButton } from "@/components/BlockButton";
import { useLanguage } from "@/contexts/LanguageContext";

const INTEREST_KEY_MAP: Record<string, "exercise"|"music"|"reading"|"travel"|"cooking"|"photo"|"gaming"|"movie"|"study"|"volunteer"|"finance"|"pet"> = {
  "운동": "exercise", "음악": "music", "독서": "reading", "여행": "travel",
  "요리": "cooking", "사진": "photo", "게임": "gaming", "영화": "movie",
  "공부": "study", "봉사": "volunteer", "재테크": "finance", "반려동물": "pet",
};

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

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

  const { data: followers } = useQuery({
    queryKey: ["followers", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", id!)).count ?? 0,
  });
  const { data: following } = useQuery({
    queryKey: ["following", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", id!)).count ?? 0,
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-32 w-full" /></div>;
  if (!profile) return <div className="p-10 text-center text-sm text-muted-foreground">{t.publicProfile.notFound}</div>;

  const isMe = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1">{t.publicProfile.title}</h1>
        </header>

        <section className="p-4">
          <div className="bg-card rounded-2xl p-5 shadow-soft text-center">
            <Avatar className="h-20 w-20 mx-auto"><AvatarImage src={profile.avatar_url ?? undefined} /><AvatarFallback><User className="h-8 w-8" /></AvatarFallback></Avatar>
            <h2 className="text-lg font-bold mt-3">{profile.name ?? t.publicProfile.member}</h2>
            {profile.mbti && <Badge className="mt-1">{profile.mbti}</Badge>}
            {profile.location && <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2"><MapPin className="h-3 w-3" />{profile.location}</p>}
            {profile.bio && <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{profile.bio}</p>}

            <div className="flex justify-center gap-6 mt-4 text-sm">
              <Link to={`/users/${profile.id}/follows`} className="text-center hover:opacity-70">
                <p className="font-bold">{followers ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t.publicProfile.followers}</p>
              </Link>
              <Link to={`/users/${profile.id}/follows`} className="text-center hover:opacity-70">
                <p className="font-bold">{following ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t.publicProfile.following}</p>
              </Link>
              <div className="text-center">
                <p className="font-bold">{groups?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">{t.publicProfile.groups}</p>
              </div>
            </div>

            {!isMe && (
              <div className="flex gap-2 mt-4">
                <FollowButton targetUserId={profile.id} size="default" />
                {user && (
                  <Button variant="outline" onClick={() => navigate(`/dm/${profile.id}`)} className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" /> {t.publicProfile.message}
                  </Button>
                )}
              </div>
            )}
            {!isMe && user && (
              <div className="mt-2 flex justify-end">
                <ReportDialog targetType="user" targetId={profile.id} />
                <BlockButton targetUserId={profile.id} />
              </div>
            )}
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold mb-2">{t.publicProfile.interests}</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((i) => {
                  const key = INTEREST_KEY_MAP[i];
                  return <Badge key={i} variant="secondary" className="bg-primary-soft text-primary border-0">{key ? t.interests[key] : i}</Badge>;
                })}
              </div>
            </div>
          )}

          {groups && groups.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold mb-2">{t.publicProfile.joinedGroups}</h3>
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

          <div className="mt-5">
            <h3 className="text-sm font-bold mb-2">{t.publicProfile.activity}</h3>
            <ActivityFeed userId={profile.id} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PublicProfile;
