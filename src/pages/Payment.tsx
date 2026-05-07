import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, MapPin, TrendingDown, TrendingUp, Coins, X } from "lucide-react";
import { userProfile, stores, pointTransactions } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayText, formatDate } from "@/i18n/format";

type PayTab = "barcode" | "history";

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
        <div key={i} className={cn("flex-shrink-0", b.dark ? "bg-foreground" : "bg-transparent")} style={{ width: `${b.width * 2.5}px` }} />
      ))}
      <div className="w-0.5 flex-shrink-0" />
      <div className="w-1.5 bg-foreground flex-shrink-0" />
    </div>
  );
};

const PayModal = ({
  points, onConfirm, onClose, t, tr,
}: {
  points: number;
  onConfirm: (amount: number, storeName: string) => void;
  onClose: () => void;
  t: any;
  tr: (value?: string | null) => string;
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
      <div className="w-full max-w-md bg-card rounded-t-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">{t.payment.title}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 font-medium">{t.payment.selectStore}</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {stores.map((s) => (
              <button key={s.id} onClick={() => setSelectedStore(s)} className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-smooth",
                selectedStore.id === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}>{tr(s.name)}</button>
            ))}
          </div>
        </div>

        <div className="bg-muted rounded-2xl p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">{t.payment.amount}</p>
          <div className="flex items-baseline gap-1">
            <input type="text" inputMode="numeric" value={amount} onChange={(e) => handleInput(e.target.value)}
              placeholder="0" className="flex-1 bg-transparent text-3xl font-bold outline-none placeholder:text-muted" />
            <span className="text-base font-medium text-muted-foreground">P</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {t.payment.myPoints}: <span className="font-semibold text-foreground">{points.toLocaleString()} P</span>
          </p>
          {numAmount > points && <p className="text-xs text-destructive mt-1">{t.payment.insufficient}</p>}
        </div>

        <div className="flex gap-2 mb-5">
          {[500, 1000, 2000, 3000].map((v) => (
            <button key={v} onClick={() => setAmount(v.toLocaleString())} className="flex-1 py-2 rounded-xl bg-muted text-xs font-semibold hover:bg-secondary transition-smooth">
              +{v.toLocaleString()}
            </button>
          ))}
        </div>

        <Button disabled={!canPay} onClick={() => onConfirm(numAmount, selectedStore.name)}
          className="w-full h-12 rounded-xl text-base font-bold gradient-primary border-0 shadow-glow hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed">
          {canPay ? `${numAmount.toLocaleString()}P ${t.payment.payNow}` : t.payment.enterAmount}
        </Button>
      </div>
    </div>
  );
};

const Payment = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const tr = (value?: string | null) => displayText(value, lang);
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
    if (timeLeft <= 0) { setBarcodeValue(null); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); setBarcodeValue(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [barcodeValue]);

  const handlePayConfirm = (amount: number, storeName: string) => {
    setCurrentPoints((p) => p - amount);
    setHistory((h) => [{
      id: `pt${Date.now()}`, type: "use", amount,
      description: `${storeName} ${t.payment.payComplete}`,
      date: formatDate(new Date(), lang),
    }, ...h]);
    setShowPayModal(false);
    setPayResult({ amount, store: storeName });
    setBarcodeValue(null);
    setTimeLeft(0);
  };

  const tabItems: { id: PayTab; label: string }[] = [
    { id: "barcode", label: t.payment.tabBarcode },
    { id: "history", label: t.payment.tabHistory },
  ];

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-md min-h-screen bg-background">
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-4 pt-4 pb-0 border-b border-border">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground" aria-label={t.common.back}>
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold flex-1">{t.payment.title}</h1>
              <div className="flex items-center gap-1 bg-primary-soft px-3 py-1.5 rounded-full">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-bold text-primary">{currentPoints.toLocaleString()} P</span>
              </div>
            </div>
            <div className="flex">
              {tabItems.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                  "flex-1 py-2.5 text-sm font-semibold border-b-2 transition-smooth",
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                )}>{tab.label}</button>
              ))}
            </div>
          </header>

          {activeTab === "barcode" && (
            <div className="px-4 pt-6 animate-fade-in">
              {payResult ? (
                <div className="flex flex-col items-center text-center py-8 animate-scale-in">
                  <div className="h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-4">
                    <Coins className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">{payResult.amount.toLocaleString()}P</h2>
                  <p className="text-sm text-muted-foreground mt-1">{t.payment.payComplete}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tr(payResult.store)}</p>
                  <p className="text-sm font-semibold mt-4">
                    {t.payment.remaining}: <span className="text-primary">{currentPoints.toLocaleString()} P</span>
                  </p>
                  <Button onClick={generateBarcode} className="mt-6 h-12 px-8 rounded-xl gradient-primary border-0 shadow-glow text-base font-bold">
                    {t.payment.newBarcode}
                  </Button>
                </div>
              ) : barcodeValue ? (
                <div className="animate-scale-in">
                  <div className="bg-card rounded-3xl p-5 shadow-card border border-border">
                    <div className="text-center mb-4">
                      <p className="text-xs text-muted-foreground">{t.payment.validTime}</p>
                      <p className={cn("text-3xl font-bold font-mono mt-0.5", timeLeft < 60 ? "text-destructive" : "text-primary")}>{mm}:{ss}</p>
                    </div>
                    <BarcodeVisual value={barcodeValue} />
                    <p className="text-center text-xs font-mono text-muted-foreground mt-3 tracking-widest">{barcodeValue}</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" onClick={generateBarcode} className="flex-1 h-11 rounded-xl text-sm">
                        <RefreshCw className="h-4 w-4 mr-1.5" /> {t.payment.regenerate}
                      </Button>
                      <Button onClick={() => setShowPayModal(true)} className="flex-1 h-11 rounded-xl gradient-primary border-0 shadow-soft text-sm font-bold">
                        {t.payment.directInput}
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">{t.payment.scanDesc}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="h-24 w-24 rounded-3xl bg-primary-soft flex items-center justify-center mb-5">
                    <Coins className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{t.payment.title}</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.payment.payDesc}</p>
                  <p className="text-base font-bold text-primary mt-3">{t.payment.balance} {currentPoints.toLocaleString()} P</p>
                  <Button onClick={generateBarcode} className="mt-6 h-12 px-10 rounded-xl gradient-primary border-0 shadow-glow text-base font-bold">
                    {t.payment.generateBarcode}
                  </Button>
                </div>
              )}

              <section className="mt-8">
                <h3 className="text-sm font-bold mb-3">{t.payment.partnerStores}</h3>
                <div className="space-y-2">
                  {stores.map((s) => (
                    <div key={s.id} className="bg-card rounded-2xl p-3.5 shadow-soft flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center text-primary text-lg flex-shrink-0">
                        {s.category === "카페" ? "☕" : s.category === "서점" ? "📚" : s.category === "요가" ? "🧘" : s.category === "공방" ? "🏺" : "🍽"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{tr(s.name)}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin className="h-3 w-3" /> {tr(s.address)}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-primary bg-primary-soft px-2 py-1 rounded-lg flex-shrink-0">{tr(s.discount)}</span>
                    </div>
                  ))}
                </div>
              </section>
              <div className="h-8" />
            </div>
          )}

          {activeTab === "history" && (
            <div className="animate-fade-in">
              <div className="mx-4 mt-4 gradient-primary rounded-2xl p-4 text-primary-foreground relative overflow-hidden">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <p className="text-xs text-white/80">{t.payment.currentBalance}</p>
                <p className="text-3xl font-bold mt-0.5">{currentPoints.toLocaleString()} P</p>
              </div>
              <div className="divide-y divide-border mt-4">
                {history.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                      item.type === "earn" ? "bg-primary-soft" : item.type === "donate" ? "bg-accent-soft" : "bg-muted")}>
                      {item.type === "earn" ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{tr(item.description)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.date}</p>
                    </div>
                    <span className={cn("text-sm font-bold flex-shrink-0", item.type === "earn" ? "text-primary" : "text-muted-foreground")}>
                      {item.type === "earn" ? "+" : "-"}{item.amount.toLocaleString()} P
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
        <PayModal points={currentPoints} onConfirm={handlePayConfirm} onClose={() => setShowPayModal(false)} t={t} tr={tr} />
      )}
    </>
  );
};

export default Payment;
