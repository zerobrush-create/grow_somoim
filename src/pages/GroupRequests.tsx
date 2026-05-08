import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { fallbackUserName, firstText, fullName } from "@/lib/userIdentity";

type Request = {
  id: number;
  user_id: string;
  status: string;
  joined_at: string | null;
  profile?: { name: string; avatar_url: string | null; email: string | null } | null;
};

const GroupRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ["group-owner-check", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.from("groups").select("id,name,owner_id").eq("id", id!).maybeSingle();
      return data;
    },
  });

  const isOwner = !!user && group?.owner_id === user.id;

  const { data: requests, isLoading } = useQuery({
    queryKey: ["group-requests", id],
    enabled: !!id && isOwner,
    queryFn: async (): Promise<Request[]> => {
      const { data: rows, error } = await supabase
        .from("memberships")
        .select("id,user_id,status,joined_at")
        .eq("group_id", id!)
        .eq("status", "pending")
        .order("joined_at", { ascending: true });
      if (error) throw error;
      const userIds = (rows ?? []).map((r) => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,name,nickname,avatar_url,email")
        .in("id", userIds);
      const { data: appUsers } = await supabase
        .from("users")
        .select("id,nickname,email,first_name,last_name,profile_image_url")
        .in("id", userIds);

      const map = new Map<string, { name: string; avatar_url: string | null; email: string | null }>();

      (appUsers ?? []).forEach((u) => {
        const name = firstText(u.nickname, fullName(u.first_name, u.last_name), u.email, fallbackUserName(u.id));
        map.set(u.id, {
          name,
          avatar_url: u.profile_image_url ?? null,
          email: u.email ?? null,
        });
      });

      (profiles ?? []).forEach((p) => {
        const existing = map.get(p.id);
        map.set(p.id, {
          name: firstText(p.nickname, existing?.name, p.name, p.email, existing?.email, fallbackUserName(p.id)),
          avatar_url: p.avatar_url ?? existing?.avatar_url ?? null,
          email: p.email ?? existing?.email ?? null,
        });
      });

      return (rows ?? []).map((r) => ({
        ...r,
        profile: map.get(r.user_id) ?? {
          name: fallbackUserName(r.user_id),
          avatar_url: null,
          email: null,
        },
      }));
    },
  });

  const decide = useMutation({
    mutationFn: async ({ rid, approve }: { rid: number; approve: boolean }) => {
      const { error } = await supabase
        .from("memberships")
        .update({ status: approve ? "approved" : "rejected" })
        .eq("id", rid);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "처리 완료" });
      qc.invalidateQueries({ queryKey: ["group-requests", id] });
      qc.invalidateQueries({ queryKey: ["group", id] });
    },
    onError: (e: Error) => toast({ title: "처리 실패", description: e.message, variant: "destructive" }),
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  if (group && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">모임 오너만 접근할 수 있어요</p>
        <Button onClick={() => navigate(`/groups/${id}`)}>돌아가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">가입 신청 관리</h1>
            {group && <p className="text-xs text-muted-foreground">{group.name}</p>}
          </div>
        </header>

        <div className="px-4 py-4 space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </>
          ) : requests && requests.length > 0 ? (
            requests.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={r.profile?.avatar_url ?? undefined} />
                  <AvatarFallback>{(r.profile?.name ?? r.profile?.email ?? r.user_id).slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.profile?.name ?? fallbackUserName(r.user_id)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.profile?.email ? `${r.profile.email} · ` : ""}ID {r.user_id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.joined_at ? new Date(r.joined_at).toLocaleDateString("ko-KR") : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" onClick={() => decide.mutate({ rid: r.id, approve: false })} disabled={decide.isPending} aria-label="거절">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={() => decide.mutate({ rid: r.id, approve: true })} disabled={decide.isPending} aria-label="승인">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">대기 중인 신청이 없어요</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupRequests;
