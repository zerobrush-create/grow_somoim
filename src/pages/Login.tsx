import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/grow-logo.png";
import { cn } from "@/lib/utils";

const Login = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/profile", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!agreeTerms || !agreePrivacy) {
          throw new Error("필수 약관에 동의해 주세요");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: name || email.split("@")[0], referral_code: referralCode.trim() || null },
          },
        });
        if (error) throw error;

        // 추천 코드 처리: referral_code(=referrer 사용자 id)로 referrals 적립
        const { data: session } = await supabase.auth.getSession();
        const newUserId = session.session?.user.id;
        if (newUserId && referralCode.trim()) {
          await supabase.from("referrals").insert({
            referrer_id: referralCode.trim(),
            referred_user_id: newUserId,
          });
        }
        toast({ title: "회원가입 완료", description: "이메일 인증 후 로그인할 수 있어요." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "환영해요!", description: "로그인되었어요." });
        navigate("/profile", { replace: true });
      }
    } catch (err: any) {
      toast({
        title: mode === "signup" ? "회원가입 실패" : "로그인 실패",
        description: err?.message ?? "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (error) {
      toast({ title: "Google 로그인 실패", description: error.message, variant: "destructive" });
    }
  };

  const handleOAuth = async (provider: "kakao" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (error) {
      toast({ title: `${provider} 로그인 실패`, description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-10 pb-8">
        {/* Logo */}
        <div className="flex flex-col items-center pt-6 pb-8 animate-fade-in">
          <img src={logo} alt="GROW" className="h-20 w-20 rounded-full shadow-glow" />
          <h1 className="text-2xl font-bold mt-4">함께 성장하는 시간</h1>
          <p className="text-sm text-muted-foreground mt-1">GROW에서 새로운 인연을 만나보세요</p>
        </div>

        {/* Tabs */}
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 animate-fade-in"
          key={mode}
        >
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs font-semibold">닉네임</Label>
              <Input
                id="nickname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="활동할 닉네임을 입력하세요"
                className="h-12 rounded-xl bg-muted border-0"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">이메일</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일 주소"
              className="h-12 rounded-xl bg-muted border-0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (6자 이상)"
              className="h-12 rounded-xl bg-muted border-0"
            />
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ref" className="text-xs font-semibold">추천 코드 (선택)</Label>
                <Input
                  id="ref"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="친구의 추천 코드"
                  className="h-12 rounded-xl bg-muted border-0"
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreeTerms} onCheckedChange={(v) => setAgreeTerms(v === true)} className="mt-0.5" />
                  <span><span className="text-destructive">[필수]</span> <span className="underline">서비스 이용약관</span>에 동의합니다</span>
                </label>
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox checked={agreePrivacy} onCheckedChange={(v) => setAgreePrivacy(v === true)} className="mt-0.5" />
                  <span><span className="text-destructive">[필수]</span> <span className="underline">개인정보 처리방침</span>에 동의합니다</span>
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
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-muted"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6-2.74-6-6.2s2.69-6.2 6-6.2c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.78 3.18 14.6 2.2 12 2.2 6.92 2.2 2.8 6.32 2.8 11.4S6.92 20.6 12 20.6c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.12-1.04H12z"/>
            </svg>
            Google로 계속하기
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("kakao")}
            className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.78 1.84 5.21 4.6 6.6l-1.18 4.32c-.1.36.31.65.62.45L11.2 19c.27.02.53.04.8.04 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z"/></svg>
            카카오로 계속하기
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.08 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>
            GitHub로 계속하기
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
          가입하면 <span className="underline">서비스 약관</span> 및{" "}
          <span className="underline">개인정보 처리방침</span>에 동의하게 됩니다.
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