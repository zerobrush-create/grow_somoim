import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Heart, Users, MessageCircle, Image, Settings, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGroup } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ReportDialog } from "@/components/ReportDialog";
import { MapLink } from "@/components/MapLink";
import { useLanguage } from "@/contexts/LanguageContext";
import GroupBoard from "./GroupBoard";
import GroupChat from "./GroupChat";

type Tab = "intro" | "board" | "photos" | "chat";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useLanguage();
  const { data: group, isLoading } = useGroup(id);
  const [activeTab, setActiveTab] = useState<Tab>("intro");

  const tabs: { id: Tab; label: string }[] = [
    { id: "intro", label: "홈" },
    { id: "board", label: t.groupDetail.tabBoard },
    { id: "photos", label: t.groupDetail.tabPhotos },
    { id: "chat", label: t.groupDetail.tabChat },
  ];

  const { data: myMembership } = useQuery({
    queryKey: ["membership", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("memberships")
        .select("id,status,role")
        .eq("group_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: bookmark } = useQuery({
    queryKey: ["bookmark-group", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => (await supabase.from("bookmarks").select("id").eq("user_id", user!.id).eq("target_type", "group").eq("target_id", id!).maybeSingle()).data,
  });
  const liked = !!bookmark;

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t.groupDetail.loginRequired);
      if (bookmark) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", bookmark.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, target_type: "group", target_id: id! });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmark-group", id, user?.id] }),
  });

  const join = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t.groupDetail.loginRequired);
      const { error } = await supabase.from("memberships").insert({
        group_id: id!,
        user_id: user.id,
        role: "member",
        status: "pending",
        joined_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t.groupDetail.joinSuccess, description: t.groupDetail.joinSuccessDesc });
      qc.invalidateQueries({ queryKey: ["membership", id, user?.id] });
      qc.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (e: Error) => toast({ title: t.groupDetail.joinFail, description: e.message, variant: "destructive" }),
  });

  const handleJoin = () => {
    if (!user) { navigate("/login"); return; }
    if (myMembership) return;
    join.mutate();
  };

  const shareInvite = async () => {
    const url = `${window.location.origin}/groups/${group?.id ?? id}`;
    try {
      if (navigator.share && group) {
        await navigator.share({
          title: group.name,
          text: t.groupDetail.inviteShareText,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      toast({ title: t.groupDetail.inviteCopied });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ title: t.groupDetail.inviteFail, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="px-4 pt-5 space-y-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <p className="text-muted-foreground mb-4">{t.groupDetail.notFound}</p>
        <Button onClick={() => navigate("/groups")}>{t.groupDetail.toList}</Button>
      </div>
    );
  }

  const ctaLabel = !user
    ? t.groupDetail.loginToJoin
    : myMembership?.status === "approved"
    ? t.groupDetail.joined
    : myMembership?.status === "pending"
    ? t.groupDetail.pending
    : myMembership?.status === "rejected"
    ? t.groupDetail.rejected
    : t.groupDetail.joinRequest;

  const isOwner = !!user && group.owner_id === user.id;
  const isMember = myMembership?.status === "approved";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md bg-background relative pb-28">
        <div className="relative aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
          {group.image_url ? (
            <img src={group.image_url} alt={group.name} className="h-full w-full object-cover" />
          ) : (
            <Users className="h-16 w-16 text-muted-foreground/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          <div className="absolute top-3 left-0 right-0 px-3 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
              aria-label={t.common.back}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/groups/${group.id}/requests`)}
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                    aria-label="requests"
                  >
                    <UserCheck className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/groups/${group.id}/edit`)}
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                    aria-label="settings"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={() => user ? toggleBookmark.mutate() : navigate("/login")}
                className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                aria-label="bookmark"
              >
                <Heart className={cn("h-5 w-5", liked && "fill-accent text-accent")} />
              </button>
              <button onClick={shareInvite} className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="share">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{group.category}</Badge>
          <div className="flex items-start justify-between gap-2 mt-2">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {user && !isOwner && <ReportDialog targetType="group" targetId={group.id} />}
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {group.location && <MapLink location={group.location} className="text-sm text-muted-foreground" />}
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.members}{t.groups.membersUnit}</span>
          </div>
        </div>

        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 grid grid-cols-3 divide-x divide-primary/10">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t.groupDetail.members}</p>
            <p className="text-lg font-bold text-primary mt-0.5">{group.members}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t.groupDetail.capacity}</p>
            <p className="text-lg font-bold text-primary mt-0.5">{group.max_members ?? "∞"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t.groupDetail.statusLabel}</p>
            <p className="text-lg font-bold text-primary mt-0.5">{t.groupDetail.active}</p>
          </div>
        </div>

        <div className="flex border-b border-border mt-5 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-smooth",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "intro" && (
            <section className="px-4 pt-6 pb-4">
              <h2 className="text-base font-bold mb-2">{t.groupDetail.groupIntro}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {group.description || t.groupDetail.noDescription}
              </p>
            </section>
          )}
          {activeTab === "board" && (
            <div className="px-4 py-4">
              <GroupBoard embedded groupId={group.id} />
            </div>
          )}
          {activeTab === "photos" && (
            <div className="px-4 py-6 text-center">
              <Image className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.photosDesc}</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/photos`)}>{t.groupDetail.goToPhotos}</Button>
            </div>
          )}
          {activeTab === "chat" && (
            <div className="px-4 py-4">
              {(isMember || isOwner) ? (
                <GroupChat embedded groupId={group.id} />
              ) : (
                <div className="rounded-2xl border border-border bg-card p-6 text-center">
                  <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.chatDesc}</p>
                  <Button onClick={handleJoin} disabled={join.isPending || !!myMembership}>
                    {join.isPending ? t.groupDetail.applying : ctaLabel}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          <Button
            onClick={handleJoin}
            disabled={join.isPending || !!myMembership || isOwner}
            className={cn(
              "w-full h-12 rounded-xl text-base font-bold border-0 hover:opacity-95",
              (myMembership || isOwner) ? "bg-muted text-foreground" : "gradient-primary shadow-glow"
            )}
          >
            {join.isPending ? t.groupDetail.applying : isOwner ? t.groupDetail.myGroup : ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
