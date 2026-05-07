import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, GraduationCap, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, LANGUAGE_LABELS } from "@/contexts/LanguageContext";

export const MobileShell = ({ children, hideNav }: { children: ReactNode; hideNav?: boolean }) => {
  const location = useLocation();
  const { t, lang } = useLanguage();
  const isKorean = lang === "ko";

  const tabs = [
    { to: "/", label: t.nav.home, icon: Home },
    { to: "/groups", label: t.nav.groups, icon: Users },
    { to: "/classes", label: t.nav.classes, icon: GraduationCap },
    { to: "/chat", label: t.nav.chat, icon: MessageCircle },
    { to: "/profile", label: t.nav.profile, icon: User },
  ];
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md min-h-screen bg-background relative pb-20 [@media_(min-width:600px)]:max-w-2xl [@media_(min-width:700px)]:max-w-[820px]">
        {children}
      </div>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border safe-bottom z-40 [@media_(min-width:600px)]:max-w-2xl [@media_(min-width:700px)]:max-w-[820px]">
          {!isKorean && (
            <div className="flex justify-center pt-1 pb-0">
              <NavLink to="/profile" className="text-[10px] text-muted-foreground flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60">
                <span>{LANGUAGE_LABELS[lang].flag}</span>
                <span>{LANGUAGE_LABELS[lang].label} · {t.profile.languageHint}</span>
              </NavLink>
            </div>
          )}
          <div className="grid grid-cols-5">
            {tabs.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-1 py-2.5 transition-smooth"
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-smooth",
                      active ? "text-primary scale-110" : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
