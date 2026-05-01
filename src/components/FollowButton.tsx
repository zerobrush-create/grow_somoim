import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FollowButton = ({ targetUserId, size = "sm" }: { targetUserId: string; size?: "sm" | "default" }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: follow } = useQuery({
    queryKey: ["follow", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user?.id !== targetUserId,
    queryFn: async () => (await supabase.from("follows").select("id").eq("follower_id", user!.id).eq("following_id", targetUserId).maybeSingle()).data,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인 필요");
      if (follow) {
        const { error } = await supabase.from("follows").delete().eq("id", follow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["follow", user?.id, targetUserId] });
      qc.invalidateQueries({ queryKey: ["followers", targetUserId] });
      qc.invalidateQueries({ queryKey: ["following", user?.id] });
    },
  });

  if (!user) {
    return <Button size={size} variant="outline" onClick={() => navigate("/login")}><UserPlus className="h-4 w-4 mr-1" />팔로우</Button>;
  }
  if (user.id === targetUserId) return null;

  return (
    <Button size={size} variant={follow ? "outline" : "default"} onClick={() => toggle.mutate()} disabled={toggle.isPending}>
      {follow ? <><UserCheck className="h-4 w-4 mr-1" />팔로잉</> : <><UserPlus className="h-4 w-4 mr-1" />팔로우</>}
    </Button>
  );
};