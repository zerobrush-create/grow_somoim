import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Ban, User as UserIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

const BlockedUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows } = useQuery({
    queryKey: ["blocks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: bl } = await supabase.from("blocks").select("id,blocked_id,created_at").eq("blocker_id", user!.id).order("created_at", { ascending: false });
      const ids = (bl ?? []).map((b) => b.blocked_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id,name,avatar_url").in("id", ids as any);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return (bl ?? []).map((b) => ({ ...b, profile: map.get(b.blocked_id as any) }));
    },
  });

  const unblock = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("blocks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "차단 해제" }); qc.invalidateQueries({ queryKey: ["blocks", user?.id] }); },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-base font-bold flex-1 flex items-center gap-1.5"><Ban className="h-4 w-4" />차단 목록</h1>
        </header>
        <div className="p-4 space-y-2">
          {rows && rows.length ? rows.map((r: any) => (
            <div key={r.id} className="flex items-center gap-3 bg-card rounded-xl p-2 border border-border">
              <Link to={`/users/${r.blocked_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10"><AvatarImage src={r.profile?.avatar_url ?? undefined} /><AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{r.profile?.name ?? "회원"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ko-KR")} 차단</p>
                </div>
              </Link>
              <Button size="sm" variant="outline" onClick={() => unblock.mutate(r.id)} disabled={unblock.isPending}>해제</Button>
            </div>
          )) : <p className="text-center text-sm text-muted-foreground py-12">차단한 사용자가 없어요</p>}
        </div>
      </div>
    </div>
  );
};

export default BlockedUsers;