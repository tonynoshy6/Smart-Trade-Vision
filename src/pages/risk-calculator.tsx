import { useState, useCallback } from "react";
import { Calculator, DollarSign, TrendingDown, Shield, Info, ChevronDown, ChevronUp } from "lucide-react";

type RiskPercent = 1 | 2;

interface CalcResult {
  riskAmount: number;
  lotSize: number;
  pipValue: number;
  stopLossPips: number;
  maxLoss: number;
  rewardRR2: number;
  rewardRR3: number;
}

const PAIRS: { label: string; value: string; pipSize: number; contractSize: number }[] = [
  { label: "EURUSD", value: "EURUSD", pipSize: 0.0001, contractSize: 100000 },
  { label: "GBPUSD", value: "GBPUSD", pipSize: 0.0001, contractSize: 100000 },
  { label: "USDJPY", value: "USDJPY", pipSize: 0.01, contractSize: 100000 },
  { label: "AUDUSD", value: "AUDUSD", pipSize: 0.0001, contractSize: 100000 },
  { label: "USDCAD", value: "USDCAD", pipSize: 0.0001, contractSize: 100000 },
  { label: "USDCHF", value: "USDCHF", pipSize: 0.0001, contractSize: 100000 },
  { label: "NZDUSD", value: "NZDUSD", pipSize: 0.0001, contractSize: 100000 },
  { label: "XAUUSD (ذهب)", value: "XAUUSD", pipSize: 0.1, contractSize: 100 },
  { label: "BTCUSD (بيتكوين)", value: "BTCUSD", pipSize: 1, contractSize: 1 },
  { label: "ETHUSD (إيثيريوم)", value: "ETHUSD", pipSize: 0.1, contractSize: 1 },
];

function computeLots(
  balance: number,
  riskPct: RiskPercent,
  entryPrice: number,
  stopLossPrice: number,
  pair: string
): CalcResult | null {
  if (!balance || !entryPrice || !stopLossPrice) return null;
  const pairData = PAIRS.find((p) => p.value === pair);
  if (!pairData) return null;

  const riskAmount = (balance * riskPct) / 100;
  const priceDiff = Math.abs(entryPrice - stopLossPrice);
  if (priceDiff === 0) return null;
  const stopLossPips = priceDiff / pairData.pipSize;
  const pipValue = pairData.contractSize * pairData.pipSize;
  const lotSize = riskAmount / (stopLossPips * pipValue);

  return {
    riskAmount,
    lotSize: Math.max(0.01, Math.round(lotSize * 100) / 100),
    pipValue,
    stopLossPips: Math.round(stopLossPips * 10) / 10,
    maxLoss: riskAmount,
    rewardRR2: riskAmount * 2,
    rewardRR3: riskAmount * 3,
  };
}

export function RiskCalculatorPage() {
  const [balance, setBalance] = useState("");
  const [riskPct, setRiskPct] = useState<RiskPercent>(1);
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [pair, setPair] = useState("EURUSD");
  const [showGuide, setShowGuide] = useState(false);

  const result = useCallback((): CalcResult | null => {
    const b = parseFloat(balance);
    const e = parseFloat(entry);
    const sl = parseFloat(stopLoss);
    if (isNaN(b) || isNaN(e) || isNaN(sl) || b <= 0 || e <= 0 || sl <= 0) return null;
    return computeLots(b, riskPct, e, sl, pair);
  }, [balance, riskPct, entry, stopLoss, pair])();

  const formatNum = (n: number, decimals = 2) =>
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  return (
    <div className="max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary to-transparent" />
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">إدارة المخاطر</h1>
            <p className="text-sm text-muted-foreground">احسب حجم اللوت المناسب بناءً على رصيدك ونسبة المخاطرة</p>
          </div>
        </div>
      </div>

      {/* نسبة المخاطرة */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          نسبة المخاطرة
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as RiskPercent[]).map((pct) => (
            <button
              key={pct}
              onClick={() => setRiskPct(pct)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                riskPct === pct
                  ? pct === 1
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                    : "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                  : "border-border bg-background hover:border-primary/30"
              }`}
            >
              <div className="text-2xl font-extrabold">{pct}%</div>
              <div className="text-xs mt-1 font-medium opacity-80">
                {pct === 1 ? "مخاطرة منخفضة — محافظ" : "مخاطرة متوسطة — معتدل"}
              </div>
              {pct === 1 && (
                <div className="text-xs mt-1 opacity-60">موصى به للمبتدئين</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* مدخلات الحساب */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <h2 className="font-bold text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          بيانات الصفقة
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">رصيدك ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="مثال: 1000"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              dir="ltr"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">الزوج / الأداة</label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              dir="ltr"
            >
              {PAIRS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">سعر الدخول</label>
            <input
              type="number"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="مثال: 1.08500"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              dir="ltr"
              step="0.00001"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              الستوب لوس
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="مثال: 1.08200"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              dir="ltr"
              step="0.00001"
            />
          </div>
        </div>
      </div>

      {/* النتيجة */}
      {result ? (
        <div className="bg-card border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
          <div className="p-6 space-y-5">
            <h2 className="font-extrabold text-lg text-emerald-400 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              نتيجة الحساب
            </h2>

            {/* حجم اللوت - بارز */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">حجم اللوت المناسب</p>
              <p className="text-5xl font-extrabold text-emerald-400">{formatNum(result.lotSize, 2)}</p>
              <p className="text-sm text-muted-foreground mt-1">لوت</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-background border border-border rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">مبلغ المخاطرة</p>
                <p className="text-lg font-bold text-red-400">${formatNum(result.riskAmount)}</p>
                <p className="text-xs text-muted-foreground">{riskPct}% من الرصيد</p>
              </div>
              <div className="bg-background border border-border rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">عدد البيبات (SL)</p>
                <p className="text-lg font-bold text-yellow-400">{formatNum(result.stopLossPips, 1)}</p>
                <p className="text-xs text-muted-foreground">بيب</p>
              </div>
              <div className="bg-background border border-border rounded-xl p-4 text-center space-y-1">
                <p className="text-xs text-muted-foreground">قيمة البيب</p>
                <p className="text-lg font-bold text-primary">${formatNum(result.pipValue)}</p>
                <p className="text-xs text-muted-foreground">لكل بيب</p>
              </div>
            </div>

            {/* نسب الربح */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-muted-foreground">الأرباح المتوقعة:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">نسبة 1:2</p>
                    <p className="text-lg font-bold text-emerald-400">+${formatNum(result.rewardRR2)}</p>
                  </div>
                  <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg font-bold">RR 1:2</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">نسبة 1:3</p>
                    <p className="text-lg font-bold text-emerald-400">+${formatNum(result.rewardRR3)}</p>
                  </div>
                  <div className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg font-bold">RR 1:3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
          <Calculator className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground text-sm">أدخل الرصيد وأسعار الدخول والستوب لوس لحساب حجم اللوت</p>
        </div>
      )}

      {/* دليل إدارة المخاطر */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-5 flex items-center justify-between text-right"
        >
          <span className="font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            دليل إدارة المخاطر الاحترافية
          </span>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showGuide && (
          <div className="px-5 pb-5 space-y-3 border-t border-border">
            {[
              { title: "قاعدة 1% للمبتدئين", desc: "لا تخاطر بأكثر من 1% من رصيدك في صفقة واحدة. هذه القاعدة تحميك من خسارة حسابك عند سلسلة خسائر متتالية." },
              { title: "قاعدة 2% للمحترفين", desc: "المتداولون ذوو الخبرة يصلون إلى 2% لكن فقط مع وجود نسبة نجاح تاريخية عالية وخطة تداول واضحة." },
              { title: "نسبة المكافأة للمخاطرة (RR)", desc: "استهدف دائماً نسبة 1:2 على الأقل. أي أن ربحك يجب أن يكون ضعف خسارتك المحتملة كحد أدنى." },
              { title: "تنويع الصفقات", desc: "لا تضع أكثر من 3-5 صفقات مفتوحة في نفس الوقت، وتأكد أن إجمالي مخاطرتك لا يتجاوز 5% من رصيدك." },
              { title: "الستوب لوس إلزامي", desc: "ضع دائماً أمر ستوب لوس قبل الدخول في أي صفقة. لا تتداول بدون ستوب لوس." },
            ].map((item, i) => (
              <div key={i} className="bg-background border border-border rounded-xl p-4">
                <p className="text-sm font-bold text-primary mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
