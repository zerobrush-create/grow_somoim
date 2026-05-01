import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Share2, Heart, MapPin, Users, MessageCircle, Image, Bell, Settings, UserCheck, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGroup } from "@/hooks/useGroups";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type Tab = "intro" | "events" | "board" | "photos" | "notices";

const tabs: { id: Tab; label: string }[] = [
  { id: "intro", label: "소개" },
  { id: "events", label: "이벤트" },
  { id: "board", label: "게시판" },
  { id: "photos", label: "사진첩" },
  { id: "notices", label: "공지" },
];

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: group, isLoading } = useGroup(id);
  const [liked, setLiked] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("intro");

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

  const join = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
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
      toast({ title: "가입 신청 완료", description: "운영자의 승인을 기다려주세요." });
      qc.invalidateQueries({ queryKey: ["membership", id, user?.id] });
      qc.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (e: Error) => toast({ title: "신청 실패", description: e.message, variant: "destructive" }),
  });

  const handleJoin = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (myMembership) return;
    join.mutate();
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
        <p className="text-muted-foreground mb-4">존재하지 않는 모임이에요</p>
        <Button onClick={() => navigate("/groups")}>목록으로</Button>
      </div>
    );
  }

  const ctaLabel = !user
    ? "로그인하고 가입하기"
    : myMembership?.status === "approved"
    ? "✓ 가입됨"
    : myMembership?.status === "pending"
    ? "승인 대기중"
    : myMembership?.status === "rejected"
    ? "신청 거절됨"
    : "가입 신청하기";

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
              aria-label="뒤로"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <button
                    onClick={() => navigate(`/groups/${group.id}/requests`)}
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                    aria-label="가입 신청 관리"
                  >
                    <UserCheck className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/groups/${group.id}/edit`)}
                    className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                    aria-label="모임 설정"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setLiked(!liked)}
                className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
                aria-label="찜"
              >
                <Heart className={cn("h-5 w-5", liked && "fill-accent text-accent")} />
              </button>
              <button className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center" aria-label="공유">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pt-5">
          <Badge className="bg-primary-soft text-primary border-0 hover:bg-primary-soft">{group.category}</Badge>
          <h1 className="text-2xl font-bold mt-2">{group.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            {group.location && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {group.location}</span>
            )}
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {group.members}명</span>
          </div>
        </div>

        <div className="mx-4 mt-4 bg-primary-soft rounded-2xl p-4 grid grid-cols-3 divide-x divide-primary/10">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">멤버</p>
            <p className="text-lg font-bold text-primary mt-0.5">{group.members}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">정원</p>
            <p className="text-lg font-bold text-primary mt-0.5">{group.max_members ?? "∞"}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">상태</p>
            <p className="text-lg font-bold text-primary mt-0.5">활성</p>
          </div>
        </div>

        <div className="flex border-b border-border mt-5 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-smooth",
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "intro" && (
            <section className="px-4 pt-6 pb-4">
              <h2 className="text-base font-bold mb-2">소모임 소개</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {group.description || "아직 소개가 작성되지 않았어요."}
              </p>
            </section>
          )}
          {activeTab === "events" && (
            <div className="px-4 py-6 text-center">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">모임 일정을 확인하고 참석을 신청해 보세요</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/events`)}>일정 보기</Button>
            </div>
          )}
          {activeTab === "board" && (
            <div className="px-4 py-6 text-center">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">멤버들과 자유롭게 소통해 보세요</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/board`)}>게시판 가기</Button>
            </div>
          )}
          {activeTab === "photos" && (
            <div className="px-4 py-6 text-center">
              <Image className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">모임 추억을 사진으로 공유해 보세요</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/photos`)}>사진첩 가기</Button>
            </div>
          )}
          {activeTab === "notices" && (
            <div className="px-4 py-6 text-center">
              <Bell className="h-10 w-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">중요한 공지사항을 확인해 보세요</p>
              <Button variant="outline" onClick={() => navigate(`/groups/${group.id}/announcements`)}>공지 보기</Button>
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
              aria-label="모임 채팅"
            >
              <MessageCircle className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              to="/chat"
              className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-secondary transition-smooth"
              aria-label="문의"
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
            {join.isPending ? "신청 중..." : isOwner ? "✓ 내 모임" : ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
