import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, MapPin, TrendingDown, TrendingUp, Coins, X } from "lucide-react";
import { userProfile, stores, pointTransactions } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PayTab = "barcode" | "history";

/* ── 바코드 시각 컴포넌트 ── */
const BarcodeVisual = ({ value }: { value: string }) => {
  const bars: { dark: boolean; width: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const c = value.charCodeAt(i % value.length);
    bars.push({ dark: i % 2 === 0, width: ((c + i) % 3) + 1 });
  }
  return (
    <div className="flex items-stretch h-16 justify-center overflow-hidden rounded-sm">
      <div className="w-1.5 bg-foreground flex-shrink-0" />
      <div className="w-0.5 flex-shrink-0" />
      {bars.map((b, i) => (
        <div
          key={i}
          className={cn("flex-shrink-0", b.dark ? "bg-foreground" : "bg-transparent")}
          style={{ width: `${b.width * 2.5}px` }}
        />
      ))}
      <div className="w-0.5 flex-shrink-0" />
      <div className="w-1.5 bg-foreground flex-shrink-0" />
    </div>
  );
};

/* ── 결제 금액 입력 모달 ── */
const PayModal = ({
  points,
  onConfirm,
  onClose,
}: {
  points: number;
  onConfirm: (amount: number, storeName: string) => void;
  onClose: () => void;
}) => {
  const [amount, setAmount] = useState("");
  const [selectedStore, setSelectedStore] = useState(stores[0]);

  const numAmount = parseInt(amount.replace(/,/g, ""), 10) || 0;
  const canPay = numAmount > 0 && numAmount <= points;

  const handleInput = (v: string) => {
    const num = v.replace(/[^0-9]/g, "");
    setAmount(num ? parseInt(num, 10).toLocaleString() : "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card rounded-t-3xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">포인트 결제</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Store select */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">가맹점 선택</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStore(s)}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth",
                  selectedStore.id === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div className="bg-muted rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">결제 금액</p>
          <div className="flex items-baseline gap-1">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-3xl font-bold outline-none placeholder:text-muted"
            />
            <span className="text-base font-medium text-muted-foreground">P</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            보유 포인트: <span className="font-semibold text-foreground">{points.toLocaleString()} P</span>
          </p>
          {numAmount > points && (
            <p className="text-xs text-destructive mt-1">포인트가 부족합니다.</p>
          )}
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-5">
          {[500, 1000, 2000, 3000].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v.toLocaleString())}
              className="flex-1 py-2 rounded-xl bg-muted text-xs font-semibold hover:bg-secondary transition-smooth"
            >
              +{v.toLocaleString()}
            </button>
          ))}
        </div>

        <Button
          disabled={!canPay}
          onClick={() => onConfirm(numAmount, selectedStore.name)}
          className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {canPay ? `${numAmount.toLocaleString()}P 결제하기` : "금액을 입력해주세요"}
        </Button>
      </div>
    </div>
  );
};

const Payment = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PayTab>("barcode");
  const [currentPoints, setCurrentPoints] = useState(userProfile.points);
  const [history, setHistory] = useState(pointTransactions);
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payResult, setPayResult] = useState<{ amount: number; store: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateBarcode = () => {
    const code = `GRW${Date.now().toString(36).toUpperCase()}`;
    setBarcodeValue(code);
    setTimeLeft(180);
    setPayResult(null);
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      setBarcodeValue(null);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setBarcodeValue(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [barcodeValue]);

  const handlePayConfirm = (amount: number, storeName: string) => {
    setCurrentPoints((p) => p - amount);
    setHistory((h) => [
      {
        id: `pt${Date.now()}`,
        type: "use",
        amount,
        description: `${storeName} 결제`,
        date: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(".", "").trim(),
      },
      ...h,
    ]);
    setShowPayModal(false);
    setPayResult({ amount, store: storeName });
    setBarcodeValue(null);
    setTimeLeft(0);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md min-h-screen bg-background">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-0 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground" aria-label="뒤로">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold flex-1">포인트 결제</h1>
              <div className="flex items-center gap-1 bg-primary-soft px-3 py-1.5 rounded-full">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold text-primary">{currentPoints.toLocaleString()} P</span>
              </div>
            </div>
            <div className="flex">
              {([["barcode", "바코드 결제"], ["history", "이용 내역"]] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 py-2.5 text-sm font-semibold border-b-2 transition-smooth",
                    activeTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {/* 바코드 탭 */}
          {activeTab === "barcode" && (
            <div className="px-4 pt-6 animate-fade-in">
              {payResult ? (
                /* 결제 완료 상태 */
                <div className="flex flex-col items-center text-center py-8 animate-scale-in">
                  <div className="h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-4">
                    <Coins className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">{payResult.amount.toLocaleString()}P</h2>
                  <p className="text-sm text-muted-foreground mt-1">결제 완료</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{payResult.store}</p>
                  <p className="text-sm font-semibold mt-4">
                    남은 포인트: <span className="text-primary">{currentPoints.toLocaleString()} P</span>
                  </p>
                  <Button
                    onClick={generateBarcode}
                    className="mt-6 h-12 px-8 rounded-xl gradient-primary border-0 shadow-glow text-base font-bold"
                  >
                    새 바코드 생성
                  </Button>
                </div>
              ) : barcodeValue ? (
                /* 바코드 활성 상태 */
                <div className="animate-scale-in">
                  <div className="bg-card rounded-3xl p-5 shadow-card border border-border">
                    <div className="text-center mb-4">
                      <p className="text-xs text-muted-foreground">유효 시간</p>
                      <p className={cn("text-3xl font-bold font-mono mt-0.5", timeLeft < 60 ? "text-destructive" : "text-primary")}>
                        {mm}:{ss}
                      </p>
                    </div>

                    <BarcodeVisual value={barcodeValue} />

                    <p className="text-center text-xs font-mono text-muted-foreground mt-3 tracking-widest">
                      {barcodeValue}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={generateBarcode}
                        className="flex-1 h-11 rounded-xl text-sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-1.5" /> 재생성
                      </Button>
                      <Button
                        onClick={() => setShowPayModal(true)}
                        className="flex-1 h-11 rounded-xl gradient-primary border-0 shadow-soft text-sm font-bold"
                      >
                        금액 직접 입력
                      </Button>
                    </div>
                  </div>

                  <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                    가맹점에 바코드를 제시하거나<br />직접 금액을 입력해 결제하세요.
                  </p>
                </div>
              ) : (
                /* 초기 상태 */
                <div className="flex flex-col items-center text-center py-8">
                  <div className="h-24 w-24 rounded-3xl bg-primary-soft flex items-center justify-center mb-5">
                    <Coins className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">포인트로 결제하기</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    바코드를 생성해 제휴 가맹점에서<br />포인트로 결제할 수 있어요.
                  </p>
                  <p className="text-base font-bold text-primary mt-3">
                    보유 {currentPoints.toLocaleString()} P
                  </p>
                  <Button
                    onClick={generateBarcode}
                    className="mt-6 h-12 px-10 rounded-xl gradient-primary border-0 shadow-glow text-base font-bold"
                  >
                    바코드 생성
                  </Button>
                </div>
              )}

              {/* 가맹점 목록 */}
              <section className="mt-8">
                <h3 className="text-sm font-bold mb-3">제휴 가맹점</h3>
                <div className="space-y-2">
                  {stores.map((s) => (
                    <div key={s.id} className="bg-card rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary text-lg flex-shrink-0">
                        {s.category === "카페" ? "☕" : s.category === "서점" ? "📚" : s.category === "요가" ? "🧘" : s.category === "공방" ? "🏺" : "🍽"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-3 w-3" /> {s.address}
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-primary bg-primary-soft px-2 py-1 rounded-lg flex-shrink-0">
                        {s.discount}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="h-8" />
            </div>
          )}

          {/* 이용 내역 탭 */}
          {activeTab === "history" && (
            <div className="animate-fade-in">
              {/* 잔액 카드 */}
              <div className="mx-4 mt-4 gradient-primary rounded-2xl p-4 text-primary-foreground relative overflow-hidden">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <p className="text-xs text-white/80">현재 포인트 잔액</p>
                <p className="text-3xl font-bold mt-0.5">{currentPoints.toLocaleString()} P</p>
              </div>

              <div className="divide-y divide-border mt-4">
                {history.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                      t.type === "earn" ? "bg-primary-soft" : t.type === "donate" ? "bg-accent-soft" : "bg-muted"
                    )}>
                      {t.type === "earn"
                        ? <TrendingUp className="h-4 w-4 text-primary" />
                        : <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.date}</p>
                    </div>
                    <span className={cn(
                      "text-sm font-bold flex-shrink-0",
                      t.type === "earn" ? "text-primary" : "text-muted-foreground"
                    )}>
                      {t.type === "earn" ? "+" : "-"}{t.amount.toLocaleString()} P
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-8" />
            </div>
          )}
        </div>
      </div>

      {showPayModal && (
        <PayModal
          points={currentPoints}
          onConfirm={handlePayConfirm}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </>
  );
};

export default Payment;
