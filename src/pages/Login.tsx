import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup" | "forgot" | "verify_email";

const Login = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [referralPromptOpen, setReferralPromptOpen] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const normalizeReferralCode = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "/";

  // 추천 링크로 진입 시 자동 처리
  useEffect(() => {
    const ref = searchParams.get("ref");
    const forceMode = searchParams.get("mode");
    if (ref) {
      const normalized = normalizeReferralCode(ref);
      setReferralCode(normalized);
      setReferralPromptOpen(!!normalized);
    }
    if (forceMode === "signup" || ref) setMode("signup");
  }, [searchParams]);

  useEffect(() => {
    if (user) navigate(redirectTo, { replace: true });
  }, [user, navigate, redirectTo]);

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
        if (!agreeTerms || !agreePrivacy) throw new Error("필수 약관에 동의해 주세요");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name || email.split("@")[0], referral_code: normalizeReferralCode(referralCode) || null },
          },
        });
        if (error) throw error;
        setMode("verify_email");
        startResendCooldown();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "환영해요!", description: "로그인되었어요." });
        navigate(redirectTo, { replace: true });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "잠시 후 다시 시도해 주세요.";
      toast({ title: mode === "signup" ? "회원가입 실패" : "로그인 실패", description: message, variant: "destructive" });
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
      const message = err instanceof Error ? err.message : "잠시 후 다시 시도해 주세요.";
      toast({ title: "전송 실패", description: message, variant: "destructive" });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await supabase.auth.resend({ type: "signup", email });
      startResendCooldown();
      toast({ title: "재발송했어요", description: "이메일을 확인해주세요." });
    } catch {
      toast({ title: "재발송 실패", variant: "destructive" });
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast({ title: "Google 로그인 실패", description: error.message, variant: "destructive" });
  };

  const handleOAuth = async (provider: "kakao") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) toast({ title: `${provider} 로그인 실패`, description: error.message, variant: "destructive" });
  };

  /* ── 이메일 인증 대기 화면 ── */
  if (mode === "verify_email") {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-10 pb-8">
          <button onClick={() => setMode("signup")} className="self-start p-1 -ml-1 text-muted-foreground mb-8">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex flex-col items-center text-center animate-fade-in flex-1 pt-6">
            <div className="h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">이메일을 확인해주세요</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              <span className="font-semibold text-foreground">{email}</span>로<br />
              인증 링크를 보냈어요. 링크를 클릭하면<br />가입이 완료됩니다.
            </p>
            <div className="w-full mt-8 space-y-3">
              <Button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                variant="outline"
                className="w-full h-12 rounded-xl"
              >
                {resendCooldown > 0 ? `재발송 (${resendCooldown}s)` : "인증 메일 재발송"}
              </Button>
              <button onClick={() => setMode("login")} className="w-full text-sm text-muted-foreground hover:text-foreground py-2">
                로그인 화면으로 돌아가기
              </button>
            </div>
            <p className="mt-auto pt-8 text-xs text-muted-foreground leading-relaxed">
              메일이 오지 않으면 스팸 폴더를 확인하거나<br />다른 이메일 주소로 다시 시도해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── 비밀번호 찾기 화면 ── */
  if (mode === "forgot") {
    return (
      <div className="min-h-screen bg-background">
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
              <h1 className="text-2xl font-bold">메일을 보냈어요!</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                <span className="font-semibold text-foreground">{forgotEmail}</span>로<br />
                비밀번호 재설정 링크를 보냈어요.<br />링크는 30분 후 만료됩니다.
              </p>
              <Button
                onClick={() => { setMode("login"); setForgotSent(false); setForgotEmail(""); }}
                className="w-full h-12 rounded-xl mt-8 gradient-primary border-0 text-base font-bold shadow-soft hover:opacity-95"
              >
                로그인으로 돌아가기
              </Button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h1 className="text-2xl font-bold">비밀번호를 잊으셨나요?</h1>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  가입한 이메일을 입력하면<br />재설정 링크를 보내드릴게요.
                </p>
              </div>
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-xs font-semibold">이메일</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="가입한 이메일 주소"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-12 rounded-xl bg-muted border-0"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95 mt-2">
                  재설정 링크 보내기
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── 로그인 / 회원가입 화면 ── */
  return (
    <div className="min-h-screen bg-background">
      <Dialog open={referralPromptOpen} onOpenChange={setReferralPromptOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-3xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Gift className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl">추천 코드가 적용됐어요</DialogTitle>
            <DialogDescription className="leading-relaxed">
              친구 초대 링크로 들어왔어요. 회원가입하면 추천 코드가 자동으로 함께 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-muted px-4 py-3 text-center">
            <p className="text-[11px] font-semibold text-muted-foreground">추천 코드</p>
            <p className="mt-1 font-mono text-lg font-bold tracking-widest text-primary">{referralCode}</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setMode("signup");
              setReferralPromptOpen(false);
            }}
            className="h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95"
          >
            회원가입 시작
          </Button>
          <button
            type="button"
            onClick={() => setReferralPromptOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            나중에 입력하기
          </button>
        </DialogContent>
      </Dialog>
      <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-10 pb-8">
        <div className="flex flex-col items-center pt-6 pb-8 animate-fade-in">
          <img src={logo} alt="GROW" className="h-20 w-20 rounded-full shadow-glow" />
          <h1 className="text-2xl font-bold mt-4">함께 성장하는 시간</h1>
          <p className="text-sm text-muted-foreground mt-1">GROW에서 새로운 인연을 만나보세요</p>
        </div>

        <div className="flex bg-muted rounded-full p-1 mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-2 rounded-full text-sm font-bold transition-smooth",
                mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
              )}
            >
              {m === "login" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in" key={mode}>
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs font-semibold">닉네임</Label>
              <Input id="nickname" value={name} onChange={(e) => setName(e.target.value)} placeholder="활동할 닉네임을 입력하세요" className="h-12 rounded-xl bg-muted border-0" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">이메일</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" className="h-12 rounded-xl bg-muted border-0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">비밀번호</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (6자 이상)" className="h-12 rounded-xl bg-muted border-0" />
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ref" className="text-xs font-semibold flex items-center gap-1.5">
                  추천 코드 (선택)
                  {referralCode && searchParams.get("ref") && (
                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-semibold">자동 입력됨</span>
                  )}
                </Label>
                <Input
                  id="ref"
                  value={referralCode}
                  onChange={(e) => setReferralCode(normalizeReferralCode(e.target.value))}
                  placeholder="친구의 추천 코드 (예: AB12CD34)"
                  className={`h-12 rounded-xl border-0 font-mono tracking-widest uppercase ${referralCode ? "bg-primary-soft text-primary" : "bg-muted"}`}
                  maxLength={8}
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} className="mt-0.5" />
                  <span>
                    <span className="text-destructive">[필수]</span>{" "}
                    <Link to="/terms" className="underline hover:text-foreground">서비스 이용약관</Link>에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} className="mt-0.5" />
                  <span>
                    <span className="text-destructive">[필수]</span>{" "}
                    <Link to="/privacy" className="underline hover:text-foreground">개인정보 처리방침</Link>에 동의합니다
                  </span>
                </label>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={submitting || (mode === "signup" && (!agreeTerms || !agreePrivacy))}
            className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95 mt-2"
          >
            {submitting ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </Button>

          {mode === "login" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2.5">
          <button type="button" onClick={handleGoogle} className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.78 3.18 14.6 2.2 12 2.2 6.92 2.2 2.8 6.32 2.8 11.4S6.92 20.6 12 20.6c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.12-1.04H12z"/>
            </svg>
            Google로 계속하기
          </button>
          <button type="button" onClick={() => handleOAuth("kakao")} className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90">
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.78 1.84 5.21 4.6 6.6l-1.18 4.32c-.1.36.31.65.62.45L11.2 19c.27.02.53.04.8.04 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z"/></svg>
            카카오로 계속하기
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
          가입하면{" "}
          <Link to="/terms" className="underline hover:text-foreground">서비스 약관</Link>
          {" "}및{" "}
          <Link to="/privacy" className="underline hover:text-foreground">개인정보 처리방침</Link>
          에 동의하게 됩니다.
        </p>

        <div className="mt-auto pt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            둘러보기로 시작하기 →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
