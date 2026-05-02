import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Calendar, MessageSquare, Users, GraduationCap } from "lucide-react";

const iconFor = (type: string) => {
  switch (type) {
    case "group_join": return Users;
    case "post": return MessageSquare;
    case "class_enroll": return GraduationCap;
    case "event": return Calendar;
    default: return Activity;
  }
};

export const ActivityFeed = ({ userId }: { userId: string }) => {
  const { data: items } = useQuery({
    queryKey: ["activity", userId],
    queryFn: async () => (await supabase.from("activity_feed").select("id,type,title,link,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  if (!items || items.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">아직 활동 기록이 없어요</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const Icon = iconFor(it.type);
        const inner = (
          <div className="flex items-start gap-3 bg-card rounded-xl p-3 border border-border">
            <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(it.created_at).toLocaleString("ko-KR")}</p>
            </div>
          </div>
        );
        return <li key={it.id}>{it.link ? <Link to={it.link}>{inner}</Link> : inner}</li>;
      })}
    </ul>
  );
};