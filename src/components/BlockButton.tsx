import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Ban } from "lucide-react";

export const BlockButton = ({ targetUserId }: { targetUserId: string }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: blocked } = useQuery({
    queryKey: ["block", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user!.id !== targetUserId,
    queryFn: async () => {
      const { data } = await supabase.from("blocks").select("id").eq("blocker_id", user!.id).eq("blocked_id", targetUserId).maybeSingle();
      return !!data;
    },
  });
  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (blocked) {
        const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: blocked ? "차단을 해제했어요" : "차단했어요" });
      qc.invalidateQueries({ queryKey: ["block", user?.id, targetUserId] });
    },
    onError: (e: Error) => toast({ title: "처리 실패", description: e.message, variant: "destructive" }),
  });
  if (!user || user.id === targetUserId) return null;
  return (
    <Button size="sm" variant="ghost" onClick={() => m.mutate()} disabled={m.isPending} className="text-xs text-muted-foreground">
      <Ban className="h-3.5 w-3.5 mr-1" />{blocked ? "차단 해제" : "차단"}
    </Button>
  );
};