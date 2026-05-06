import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const applyPendingReferral = async (userId: string) => {
  const pendingCode = localStorage.getItem("grow_pending_referral_code");
  if (!pendingCode) return;

  const normalizedCode = pendingCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  if (!normalizedCode) {
    localStorage.removeItem("grow_pending_referral_code");
    return;
  }

  const { data: referrer } = await supabase
    .from("users")
    .select("id")
    .or(`referral_code.eq.${normalizedCode},id.ilike.${normalizedCode}%`)
    .neq("id", userId)
    .maybeSingle();

  if (!referrer?.id) return;

  const { error } = await supabase.from("referrals").insert({
    referrer_id: referrer.id,
    referred_user_id: userId,
  });

  if (!error || error.code === "23505") {
    localStorage.removeItem("grow_pending_referral_code");
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set listener FIRST to avoid missing events
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        localStorage.setItem("grow_signup_completed", "1");
        sessionStorage.setItem("grow_intro_seen", "1");
        setTimeout(() => {
          applyPendingReferral(newSession.user.id).catch(() => {});
        }, 0);
      }
    });

    // Then load existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        localStorage.setItem("grow_signup_completed", "1");
        sessionStorage.setItem("grow_intro_seen", "1");
        applyPendingReferral(existing.user.id).catch(() => {});
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
