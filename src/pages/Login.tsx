import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/grow-logo.png";
import { cn } from "@/lib/utils";

const Login = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");

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
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4 animate-fade-in"
          key={mode}
        >
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-xs font-semibold">닉네임</Label>
              <Input id="nickname" placeholder="활동할 닉네임을 입력하세요" className="h-12 rounded-xl bg-muted border-0" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">이메일</Label>
            <Input id="email" type="email" placeholder="이메일 주소" className="h-12 rounded-xl bg-muted border-0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">비밀번호</Label>
            <Input id="password" type="password" placeholder="비밀번호" className="h-12 rounded-xl bg-muted border-0" />
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-soft hover:opacity-95 mt-2">
            {mode === "login" ? "로그인" : "회원가입"}
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
          <button className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191600] font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90">
            <span className="text-lg">💬</span> 카카오로 시작하기
          </button>
          <button className="w-full h-12 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 transition-smooth hover:opacity-90">
             Apple로 시작하기
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