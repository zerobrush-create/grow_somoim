import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Props = { children: React.ReactNode; requireRole?: "admin" | "instructor" };

export const ProtectedRoute = ({ children, requireRole }: Props) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const { data: hasRole, isLoading: roleLoading } = useQuery({
    queryKey: ["has-role", user?.id, requireRole],
    enabled: !!user && !!requireRole,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", requireRole!).maybeSingle();
      return !!data;
    },
  });

  if (loading || (requireRole && roleLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">불러오는 중...</div>;
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (requireRole && !hasRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <p className="text-sm text-muted-foreground">접근 권한이 없어요</p>
        <a href="/" className="text-sm text-primary underline">홈으로</a>
      </div>
    );
  }
  return <>{children}</>;
};
