import { useState } from "react";
import { Flag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const ReportDialog = ({ targetType, targetId, label = "신고" }: { targetType: string; targetId: string; label?: string }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("로그인이 필요해요");
      if (!reason.trim()) throw new Error("사유를 입력해주세요");
      const { error } = await supabase.from("reports").insert({
        reporter_id: user.id, target_type: targetType, target_id: targetId, reason: reason.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "신고가 접수되었어요" }); setReason(""); setOpen(false); },
    onError: (e: Error) => toast({ title: "오류", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground"><Flag className="h-4 w-4 mr-1" />{label}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>신고하기</DialogTitle></DialogHeader>
        <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="신고 사유를 적어주세요" maxLength={500} />
        <Button onClick={() => submit.mutate()} disabled={submit.isPending}>제출</Button>
      </DialogContent>
    </Dialog>
  );
};