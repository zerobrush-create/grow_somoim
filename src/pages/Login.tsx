import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, Gift, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { LANGUAGE_LABELS, useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";

type Mode = "login" | "signup" | "forgot" | "verify_email";
const INTRO_DURATION_MS = 3000;

const Login = () => {
  const location = useLocation();
  const isSignupRoute = location.pathname === "/signup";
  const [mode, setMode] = useState<Mode>(() => (isSignupRoute ? "signup" : "login"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showEmailSignup, setShowEmailSignup] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showSignupIntro, setShowSignupIntro] = useState(() => {
    try {
      return isSignupRoute && sessionStorage.getItem("grow_intro_seen") !== "1";
    } catch {
      return isSignupRoute;
    }
  });
  const [resendCooldown, setResendCooldown] = useState(0);
  const [referralPromptOpen, setReferralPromptOpen] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const a = t.auth;
  const [searchParams] = useSearchParams();
  const languageOptions = Object.entries(LANGUAGE_LABELS) as [Language, (typeof LANGUAGE_LABELS)[Language]][];
  const normalizeReferralCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "/";
  const normalizedReferralCode = normalizeReferralCode(referralCode);
  const canStartSignup = name.trim().length >= 2 && agreeTerms && agreePrivacy;
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const isEmbeddedBrowser = /NAVER|KAKAOTALK|FBAN|FBAV|Instagram|Line\/|Twitter|Telegram|DaumApps|; wv\)/i.test(userAgent);
  const signupCompleted = localStorage.getItem("grow_signup_completed") === "1";

  const copyOpenBrowserLink = async () => {
    await navigator.clipboard?.writeText(window.location.href).catch(() => {});
    toast({
      title: a.linkCopied,
      description: a.linkCopiedDesc,
    });
  };

  // 추천 링크로 진입 시 자동 처리
  useEffect(() => {
    const ref = searchParams.get("ref");
    const forceMode = searchParams.get("mode");
    if ((forceMode === "signup" || ref) && !isSignupRoute) {
      navigate(`/signup?${searchParams.toString()}`, { replace: true });
      return;
    }
    if (ref) {
      const normalized = normalizeReferralCode(ref);
      setReferralCode(normalized);
      setReferralPromptOpen(!!normalized);
    }
    setMode(isSignupRoute ? "signup" : "login");
  }, [isSignupRoute, navigate, searchParams]);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

  useEffect(() => {
    if (!showSignupIntro) return;
    try { sessionStorage.setItem("grow_intro_seen", "1"); } catch {}
    const timer = window.setTimeout(() => setShowSignupIntro(false), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showSignupIntro]);

  const startResendCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (name.trim().length < 2) throw new Error(a.nicknameRequired);
        if (!agreeTerms || !agreePrivacy) throw new Error(a.agreeBeforeSignup);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name || email.split("@")[0], referral_code: normalizeReferralCode(referralCode) || null },
          },
        });
        if (error) throw error;
        localStorage.setItem("grow_signup_completed", "1");
        sessionStorage.setItem("grow_intro_seen", "1");
        if (data.session) {
          navigate(redirectTo, { replace: true });
          return;
        }
        setMode("verify_email");
        startResendCooldown();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: a.welcome, description: a.loggedIn });
        navigate(redirectTo, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : a.retryLater;
      toast({ title: mode === "signup" ? a.signupFail : a.loginFail, description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/profile`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : a.retryLater;
      toast({ title: a.resetFail, description: message, variant: "destructive" });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await supabase.auth.resend({ type: "signup", email });
      startResendCooldown();
      toast({ title: a.resendDone, description: a.resendDoneDesc });
    } catch {
      toast({ title: a.resendFail, variant: "destructive" });
    }
  };

  const handleGoogle = async () => {
    if (isEmbeddedBrowser) {
      await copyOpenBrowserLink();
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      toast({ title: a.nickname, description: a.nicknameRequired, variant: "destructive" });
      return;
    }
    if (mode === "signup" && (!agreeTerms || !agreePrivacy)) {
      toast({ title: a.agreeBeforeSignup, description: a.agreeBeforeSignup, variant: "destructive" });
      return;
    }
    if (mode === "signup" && normalizedReferralCode) {
      localStorage.setItem("grow_pending_referral_code", normalizedReferralCode);
    }
    if (mode === "signup") {
      localStorage.setItem("grow_pending_signup_name", name.trim());
      sessionStorage.setItem("grow_intro_seen", "1");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });
    if (error) toast({ title: mode === "signup" ? a.signupFail : a.loginFail, description: error.message, variant: "destructive" });
  };

  const handleOAuth = async (provider: "kakao") => {
    if (mode === "signup" && name.trim().length < 2) {
      toast({ title: a.nickname, description: a.nicknameRequired, variant: "destructive" });
      return;
    }
    if (mode === "signup" && (!agreeTerms || !agreePrivacy)) {
      toast({ title: a.agreeBeforeSignup, description: a.agreeBeforeSignup, variant: "destructive" });
      return;
    }
    if (mode === "signup" && normalizedReferralCode) {
      localStorage.setItem("grow_pending_referral_code", normalizedReferralCode);
    }
    if (mode === "signup") {
      localStorage.setItem("grow_pending_signup_name", name.trim());
      sessionStorage.setItem("grow_intro_seen", "1");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast({ title: mode === "signup" ? a.signupFail : a.loginFail, description: error.message, variant: "destructive" });
  };

  /* ── 이메일 인증 대기 화면 ── */
  if (mode === "verify_email") {
    return (
      <div className="min-h-screen bg-background" data-i18n-skip>
        <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-10 pb-8">
          <button onClick={() => setMode("signup")} className="self-start p-1 -ml-1 text-muted-foreground mb-8">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center text-center animate-fade-in flex-1 pt-6">
            <div className="h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{a.verifyTitle}</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              <span className="font-semibold text-foreground">{email}</span><br />
              {a.verifyDesc}
            </p>
            <div className="w-full mt-8 space-y-3">
              <Button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                {resendCooldown > 0 ? `${a.resendEmail} (${resendCooldown}s)` : a.resendEmail}
              </Button>
              <button onClick={() => navigate("/login", { replace: true })} className="w-full text-sm text-muted-foreground hover:text-foreground py-2">
                {a.backToLogin}
              </button>
            </div>
            <p className="mt-auto pt-8 text-xs text-muted-foreground leading-relaxed">
              {a.checkSpam}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── 비밀번호 찾기 화면 ── */
  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-background" data-i18n-skip>
        <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-10 pb-8">
          <button
            onClick={() => { setMode("login"); setForgotSent(false); setForgotEmail(""); }}
            className="self-start p-1 -ml-1 text-muted-foreground mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {forgotSent ? (
            <div className="flex flex-col items-center text-center animate-fade-in flex-1 pt-6">
              <div className="h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">{a.resetSentTitle}</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                <span className="font-semibold text-foreground">{forgotEmail}</span><br />
                {a.resetSentDesc}
              </p>
              <Button
                onClick={() => { setMode("login"); setForgotSent(false); setForgotEmail(""); }}
                className="w-full h-12 rounded-xl mt-8 gradient-primary border-0 text-base font-bold shadow-soft hover:opacity-95"
              >
                {a.backToLogin}
              </Button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold">{a.forgotTitle}</h1>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {a.forgotDesc}
                </p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-xs font-semibold">{a.email}</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder={a.emailPlaceholder}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-12 rounded-xl bg-muted border-0"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95 mt-2">
                  {a.resetSend}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 로그인 / 회원가입 화면 ── */
  if (showSignupIntro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6" data-i18n-skip>
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

  return (
    <div className="min-h-screen bg-background" data-i18n-skip>
      <Dialog open={referralPromptOpen} onOpenChange={setReferralPromptOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Gift className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl">{a.referralApplied}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {a.referralAppliedDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-muted px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-muted-foreground">{a.referralCode}</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-primary">{referralCode}</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setReferralPromptOpen(false);
            }}
            className="h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95"
          >
            {a.signupStart}
          </Button>
          <button
            type="button"
            onClick={() => setReferralPromptOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {a.later}
          </button>
        </DialogContent>
      </Dialog>
      <div className={`mx-auto max-w-md min-h-screen flex flex-col px-6 pb-8 ${isEmbeddedBrowser ? "pt-28" : "pt-10"}`}>
        <div className="flex justify-end pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t.profile.language}
                className="inline-flex h-14 min-w-20 items-center justify-center gap-2 rounded-full bg-muted px-4 text-base font-semibold transition-smooth hover:bg-muted/80 shadow-soft"
              >
                <span className="text-3xl leading-none" aria-hidden="true">{LANGUAGE_LABELS[lang].flag}</span>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40 rounded-xl">
              {languageOptions.map(([code, option]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => setLang(code)}
                  className="gap-2 rounded-lg"
                >
                  <span className="text-2xl" aria-hidden="true">{option.flag}</span>
                  <span>{option.label}</span>
                  {lang === code && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col items-center pt-6 pb-8 animate-fade-in">
          <img src={logo} alt="GROW" className="h-20 w-20 rounded-full shadow-glow" />
          <h1 className="text-2xl font-bold mt-4">{a.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{a.subtitle}</p>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-lg font-bold">{isSignupRoute ? a.signup : a.login}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSignupRoute ? a.signupSubtitle : a.loginSubtitle}
          </p>
        </div>

        {isSignupRoute ? (
          <div className="mb-6 rounded-2xl bg-primary-soft px-4 py-3 text-center text-sm font-semibold text-primary">
            {a.signupFirst}
          </div>
        ) : (
          <div className="mb-6 rounded-2xl bg-muted px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
            {a.loginFirst}
          </div>
        )}

        {isEmbeddedBrowser && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">{a.embeddedTitle}</p>
            <p className="mt-1">
              {a.embeddedDesc}
            </p>
            <button
              type="button"
              onClick={copyOpenBrowserLink}
              className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-100 px-3 text-xs font-bold text-amber-950"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {a.copyBrowserLink}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" key={mode}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs font-semibold">{a.nickname}</Label>
              <Input id="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder={a.nicknamePlaceholder} className="h-12 rounded-xl bg-muted border-0" />
            </div>
          )}

          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ref" className="text-xs font-semibold flex items-center gap-1.5">
                  {a.referralCode}
                  {referralCode && searchParams.get("ref") && (
                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{a.autoFilled}</span>
                  )}
                </Label>
                <Input
                  id="ref"
                  value={referralCode}
                  onChange={(e) => setReferralCode(normalizeReferralCode(e.target.value))}
                  placeholder={a.referralPlaceholder}
                  className={`h-12 rounded-xl border-0 font-mono tracking-widest uppercase ${referralCode ? "bg-primary-soft text-primary" : "bg-muted"}`}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} className="mt-0.5" />
                  <span>
                    <span className="text-destructive">{a.termsRequiredLabel}</span>{" "}
                    {a.agreePrefix}<Link to="/terms" className="underline hover:text-foreground">{a.terms}</Link>{a.agreeSuffix}
                  </span>
                </label>
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} className="mt-0.5" />
                  <span>
                    <span className="text-destructive">{a.termsRequiredLabel}</span>{" "}
                    {a.agreePrefix}<Link to="/privacy" className="underline hover:text-foreground">{a.privacy}</Link>{a.agreeSuffix}
                  </span>
                </label>
              </div>
            </>
          )}

          {mode === "signup" && (
            <div className="space-y-2.5 pt-2">
              <p className="text-center text-[11px] text-muted-foreground">
                {a.socialGuide}
              </p>
              <button
                type="button"
                onClick={() => handleOAuth("kakao")}
                disabled={!canStartSignup}
                className="w-full h-14 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-base flex items-center justify-center gap-2 transition-smooth hover:opacity-90 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.78 1.84 5.21 4.6 6.6l-1.18 4.32c-.1.36.31.65.62.45L11.2 19c.27.02.53.04.8.04 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z"/></svg>
                {a.kakaoStart}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailSignup((open) => !open)}
                className="w-full h-12 rounded-xl bg-primary-soft text-primary font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-primary-soft/80"
              >
                <Mail className="h-4 w-4" />
                {showEmailSignup ? a.emailClose : a.emailStart}
              </button>
              {isEmbeddedBrowser ? (
                <button
                  type="button"
                  onClick={copyOpenBrowserLink}
                  className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted"
                >
                  <ExternalLink className="h-4 w-4" />
                  {a.googleExternalSignup}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={!canStartSignup}
                  className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted disabled:opacity-50 disabled:hover:bg-card"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.78 3.18 14.6 2.2 12 2.2 6.92 2.2 2.8 6.32 2.8 11.4S6.92 20.6 12 20.6c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.12-1.04H12z"/>
                  </svg>
                  {a.googleSignup}
                </button>
              )}
            </div>
          )}

          {(mode === "login" || showEmailSignup) && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">{mode === "signup" ? a.emailId : a.email}</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={a.emailPlaceholder} className="h-12 rounded-xl bg-muted border-0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">{a.password}</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.passwordPlaceholder} className="h-12 rounded-xl bg-muted border-0" />
              </div>

              <Button
                type="submit"
                disabled={submitting || (mode === "signup" && !canStartSignup)}
                className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95 mt-2"
              >
                {submitting ? a.processing : mode === "login" ? a.login : a.emailSignup}
              </Button>
            </>
          )}

          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                {a.forgot}
              </button>
            </div>
          )}
        </form>

        {mode === "login" && (
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">{a.or}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {mode === "login" && (
          <div className="space-y-2.5">
            {isEmbeddedBrowser ? (
              <button type="button" onClick={copyOpenBrowserLink} className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted">
                <ExternalLink className="h-4 w-4" />
                {a.googleExternalLogin}
              </button>
            ) : (
              <button type="button" onClick={handleGoogle} className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted">
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.78 3.18 14.6 2.2 12 2.2 6.92 2.2 2.8 6.32 2.8 11.4S6.92 20.6 12 20.6c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.12-1.04H12z"/>
                </svg>
                {a.googleLogin}
              </button>
            )}
            <button type="button" onClick={() => handleOAuth("kakao")} className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90">
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.78 1.84 5.21 4.6 6.6l-1.18 4.32c-.1.36.31.65.62.45L11.2 19c.27.02.53.04.8.04 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z"/></svg>
              {a.kakaoLogin}
            </button>
          </div>
        )}

        {mode === "signup" && (
          <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
            {a.signupTermsNote}
          </p>
        )}

        <div className="mt-auto pt-6 text-center">
          {isSignupRoute ? (
            <p className="mb-4 text-xs text-muted-foreground">
              {a.alreadyJoined}{" "}
              <Link to="/login" className="font-semibold text-primary underline">
                {a.loginHere}
              </Link>
            </p>
          ) : !signupCompleted ? (
            <p className="mb-4 text-xs text-muted-foreground">
              {a.firstTime}{" "}
              <Link to="/signup" className="font-semibold text-primary underline">
                {a.signupHere}
              </Link>
            </p>
          ) : (
            <p className="mb-4 text-xs text-muted-foreground">{a.loginWithAccount}</p>
          )}
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            {a.browse}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
