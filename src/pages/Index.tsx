import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Home from "./Home";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/grow-logo.png";

const INTRO_DURATION_MS = 3000;

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (loading || user) return;

    const signupCompleted = localStorage.getItem("grow_signup_completed") === "1";
    const introSeen = sessionStorage.getItem("grow_intro_seen") === "1";

    if (introSeen) {
      navigate(signupCompleted ? "/login" : `/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`, { replace: true });
      return;
    }

    setShowIntro(true);
    sessionStorage.setItem("grow_intro_seen", "1");
    const timer = window.setTimeout(() => {
      setShowIntro(false);
      navigate(signupCompleted ? "/login" : `/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`, { replace: true });
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [loading, navigate, searchParams, user]);

  if (loading || showIntro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
          <img src={logo} alt="GROW" className="h-28 w-28 rounded-full shadow-glow animate-scale-in" />
          <div>
            <p className="text-3xl font-black tracking-normal">GROW</p>
            <p className="mt-2 text-base text-muted-foreground">{t.home.introTagline}</p>
          </div>
          <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full origin-left bg-primary animate-[grow-intro-progress_3s_linear_forwards]" />
          </div>
        </div>
      </div>
    );
  }

  return <Home />;
};

export default Index;
