import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Heart, Users, MessageCircle, Image, Bell, Settings, UserCheck, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useGroup } from "@/hooks/useGroups";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ReportDialog } from "@/components/ReportDialog";
import { MapLink } from "@/components/MapLink";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "intro" | "members" | "chat" | "events" | "board" | "photos" | "notices" | "reviews";

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { t } = useLanguage();
  const { data: group, isLoading } = useGroup(id);
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const { data: members = [], isLoading: membersLoading } = useGroupMembers(id);

  const tabs: { id: Tab; label: string }[] = [
    { id: "intro", label: t.groupDetail.tabIntro },
    { id: "members", label: t.groupDetail.tabMembers },
    { id: "chat", label: t.groupDetail.tabChat },
    { id: "events", label: t.groupDetail.tabEvents },
    { id: "board", label: t.groupDetail.tabBoard },
    { id: "photos", label: t.groupDetail.tabPhotos },
    { id: "notices", label: t.groupDetail.tabNotices },
    { id: "reviews", label: t.groupDetail.tabReviews },
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

  const { data: reviews } = useQuery({
    queryKey: ["group-reviews", id],
    enabled: !!id,
    queryFn: async () => (await supabase.from("group_reviews").select("*").eq("group_id", id!).order("created_at", { ascending: false })).data ?? [],
  });

  const addReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t.groupDetail.loginRequired);
      if (!reviewText.trim()) throw new Error(t.groupDetail.reviewPlaceholder);
      const { error } = await supabase.from("group_reviews").insert({ group_id: id!, author_id: user.id, rating, content: reviewText.trim() });
      if (error) throw error;
      setReviewText("");
    },
    onSuccess: () => { toast({ title: t.groupDetail.reviewSuccess }); qc.invalidateQueries({ queryKey: ["group-reviews", id] }); },
    onError: (e: Error) => toast({ title: t.groupDetail.reviewFail, description: e.message, variant: "destructive" }),
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
              <button className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="share">
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
          {activeTab === "members" && (
            <section className="px-4 pt-5 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold">{t.groupDetail.memberList}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{t.groupDetail.inviteDesc}</p>
                  </div>
                  <Button size="sm" onClick={shareInvite} className="rounded-xl">
                    <Share2 className="mr-1.5 h-4 w-4" />
                    {t.groupDetail.inviteMembers}
                  </Button>
                </div>
              </div>

              {membersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                </div>
              ) : members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isGroupOwner = member.userId === group.owner_id;
                    return (
                      <div key={member.userId} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={member.avatarUrl ?? undefined} />
                          <AvatarFallback>{member.name.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{member.name}</p>
                          {member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                        </div>
                        <Badge variant={isGroupOwner ? "default" : "secondary"} className="shrink-0">
                          {isGroupOwner ? t.groupDetail.ownerRole : t.groupDetail.memberRole}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">{t.groupDetail.noMembers}</div>
              )}
            </section>
          )}
          {activeTab === "chat" && (
            <div className="px-4 py-6 text-center">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.chatDesc}</p>
              <Button
                variant="outline"
                onClick={() => navigate((isMember || isOwner) ? `/groups/${group.id}/chat` : "/chat")}
              >
                {t.groupDetail.goToChat}
              </Button>
            </div>
          )}
          {activeTab === "events" && (
            <div className="px-4 py-6 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.eventsDesc}</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/events`)}>{t.groupDetail.viewEvents}</Button>
            </div>
          )}
          {activeTab === "board" && (
            <div className="px-4 py-6 text-center">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.boardDesc}</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/board`)}>{t.groupDetail.goToBoard}</Button>
            </div>
          )}
          {activeTab === "photos" && (
            <div className="px-4 py-6 text-center">
              <Image className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.photosDesc}</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/photos`)}>{t.groupDetail.goToPhotos}</Button>
            </div>
          )}
          {activeTab === "notices" && (
            <div className="px-4 py-6 text-center">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">{t.groupDetail.noticesDesc}</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/announcements`)}>{t.groupDetail.viewNotices}</Button>
            </div>
          )}
          {activeTab === "reviews" && (
            <div className="px-4 py-5 space-y-4">
              {user && (isMember || isOwner) && (
                <div className="bg-card border border-border rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((s) => (
                      <button key={s} onClick={() => setRating(s)} aria-label={`${s}`}>
                        <Star className={cn("h-5 w-5", s <= rating ? "fill-accent text-accent" : "text-muted")} />
                      </button>
                    ))}
                  </div>
                  <Textarea rows={3} placeholder={t.groupDetail.reviewPlaceholder} value={reviewText} onChange={(e) => setReviewText(e.target.value)} maxLength={1000} />
                  <Button onClick={() => addReview.mutate()} disabled={addReview.isPending} className="w-full">
                    {addReview.isPending ? t.groupDetail.submitting : t.groupDetail.submitReview}
                  </Button>
                </div>
              )}
              {reviews && reviews.length > 0 ? reviews.map((r) => (
                <div key={r.id} className="border-b border-border pb-3">
                  <div className="flex items-center gap-1 mb-1">
                    {[1,2,3,4,5].map((s) => <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "fill-accent text-accent" : "text-muted")} />)}
                  </div>
                  <p className="text-sm">{r.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              )) : (
                <div className="text-center py-12 text-sm text-muted-foreground">{t.groupDetail.noReviews}</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40">
        <div className="flex items-center gap-2 p-3">
          {(isMember || isOwner) ? (
            <Link
              to={`/groups/${group.id}/chat`}
              className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-smooth"
              aria-label="chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/chat"
              className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-smooth"
              aria-label="chat"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          )}
          <Button
            onClick={handleJoin}
            disabled={join.isPending || !!myMembership || isOwner}
            className={cn(
              "flex-1 h-12 rounded-xl text-base font-bold border-0 hover:opacity-95",
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
