import { useState } from "react";
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, DollarSign, Globe, Loader2, Activity } from "lucide-react";

interface NewsItem {
  title: string;
  currency: string;
  impact: "high" | "medium" | "low";
  direction: "bullish" | "bearish" | "neutral";
  expectedMove: string;
  tradingAdvice: string;
  affectedPairs: string[];
  time: string;
}

interface CurrentPrices {
  XAUUSD?: string | null;
  BTCUSD?: string | null;
  ETHUSD?: string | null;
  EURUSD?: string | null;
  GBPUSD?: string | null;
  USDJPY?: string | null;
  USDCHF?: string | null;
  AUDUSD?: string | null;
  USDCAD?: string | null;
}

interface NewsAnalysis {
  marketSummary: string;
  riskSentiment: "risk_on" | "risk_off" | "neutral";
  dollarBias: "bullish" | "bearish" | "neutral";
  goldBias: "bullish" | "bearish" | "neutral";
  news: NewsItem[];
  currentPrices: CurrentPrices;
  keyLevelsToWatch: string[];
  sessionAdvice: string;
  generatedAt: string;
}

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const IMPACT_COLORS = {
  high: "text-red-400 bg-red-400/10 border-red-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  low: "text-green-400 bg-green-400/10 border-green-400/30",
};
const IMPACT_LABELS = { high: "تأثير عالي", medium: "تأثير متوسط", low: "تأثير منخفض" };

const DIR_ICON = {
  bullish: <TrendingUp className="w-4 h-4 text-emerald-400" />,
  bearish: <TrendingDown className="w-4 h-4 text-red-400" />,
  neutral: <Minus className="w-4 h-4 text-muted-foreground" />,
};

const RISK_LABELS = {
  risk_on:  { label: "شهية مخاطرة مرتفعة", color: "text-emerald-400" },
  risk_off: { label: "تجنب المخاطرة",       color: "text-red-400"     },
  neutral:  { label: "محايدة",              color: "text-yellow-400"  },
};
const BIAS_LABELS = {
  bullish: { label: "صعودي", color: "text-emerald-400" },
  bearish: { label: "هبوطي", color: "text-red-400"     },
  neutral: { label: "محايد", color: "text-yellow-400"  },
};

const PRICE_DISPLAY = [
  { key: "XAUUSD", label: "ذهب XAU/USD", symbol: "XAU" },
  { key: "EURUSD", label: "EUR/USD", symbol: "EUR" },
  { key: "GBPUSD", label: "GBP/USD", symbol: "GBP" },
  { key: "USDJPY", label: "USD/JPY", symbol: "JPY" },
  { key: "USDCHF", label: "USD/CHF", symbol: "CHF" },
  { key: "AUDUSD", label: "AUD/USD", symbol: "AUD" },
  { key: "USDCAD", label: "USD/CAD", symbol: "CAD" },
  { key: "BTCUSD", label: "BTC/USD", symbol: "BTC" },
  { key: "ETHUSD", label: "ETH/USD", symbol: "ETH" },
];

export function NewsPage() {
  const [analysis, setAnalysis] = useState<NewsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/news/economic`);
      if (!res.ok) throw new Error("فشل في جلب الأخبار");
      const data = await res.json();
      setAnalysis(data);
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const prices = analysis?.currentPrices ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-transparent" />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">الأخبار الاقتصادية الحية</h1>
              <p className="text-xs text-muted-foreground">أسعار حقيقية + أخبار CNBC محللة بالذكاء الاصطناعي</p>
            </div>
          </div>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(201,162,39,0.2)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "جاري التحديث..." : "تحديث الأخبار"}
          </button>
        </div>
      </div>

      {/* ── لوحة الأسعار الحية ── */}
      {analysis && Object.values(prices).some(Boolean) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold">الأسعار الحية الآن</span>
            <span className="text-xs text-muted-foreground mr-auto">
              {new Date(analysis.generatedAt).toLocaleTimeString("ar-EG")}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-px bg-border">
            {PRICE_DISPLAY.map(({ key, label }) => {
              const val = prices[key as keyof CurrentPrices];
              if (!val || val === "غير متاح") return null;
              return (
                <div key={key} className="bg-card px-3 py-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{label}</div>
                  <div className="text-sm font-extrabold text-primary font-mono">{val}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* الحالة الأولية */}
      {!analysis && !loading && !error && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
            <Globe className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold">أخبار اقتصادية حقيقية</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            الذكاء الاصطناعي سيجلب الأسعار الحية من Coinbase وأخبار CNBC الحقيقية ويحللها لك فوراً.
          </p>
          <button
            onClick={fetchNews}
            className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(201,162,39,0.3)] mt-2"
          >
            ابدأ التحليل الآن
          </button>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center text-destructive">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            <Newspaper className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-primary">جاري جلب الأسعار والأخبار...</h2>
          <p className="text-muted-foreground text-sm">أسعار حية من Coinbase + أخبار CNBC → تحليل بالذكاء الاصطناعي</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-5">
          {/* ملخص السوق */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              ملخص حالة السوق
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-4 border border-border">
              {analysis.marketSummary}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background rounded-xl p-3 border border-border text-center space-y-1">
                <p className="text-xs text-muted-foreground">حالة المخاطرة</p>
                <p className={`text-sm font-bold ${RISK_LABELS[analysis.riskSentiment]?.color}`}>
                  {RISK_LABELS[analysis.riskSentiment]?.label}
                </p>
              </div>
              <div className="bg-background rounded-xl p-3 border border-border text-center space-y-1">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" />الدولار
                </p>
                <p className={`text-sm font-bold ${BIAS_LABELS[analysis.dollarBias]?.color}`}>
                  {BIAS_LABELS[analysis.dollarBias]?.label}
                </p>
              </div>
              <div className="bg-background rounded-xl p-3 border border-border text-center space-y-1">
                <p className="text-xs text-muted-foreground">الذهب</p>
                <p className={`text-sm font-bold ${BIAS_LABELS[analysis.goldBias]?.color}`}>
                  {BIAS_LABELS[analysis.goldBias]?.label}
                </p>
              </div>
            </div>

            {analysis.sessionAdvice && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-primary mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />نصيحة الجلسة
                </p>
                <p className="text-sm text-foreground">{analysis.sessionAdvice}</p>
              </div>
            )}
          </div>

          {/* الأخبار */}
          <div className="space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2 px-1">
              <Newspaper className="w-5 h-5 text-blue-400" />
              الأخبار والأحداث الاقتصادية
            </h2>
            {(analysis.news ?? []).map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${IMPACT_COLORS[item.impact]}`}>
                        {IMPACT_LABELS[item.impact]}
                      </span>
                      <span className="text-xs bg-muted border border-border px-2.5 py-1 rounded-full font-mono font-bold">{item.currency}</span>
                      <div className="flex items-center gap-1">{DIR_ICON[item.direction]}</div>
                    </div>
                    {item.time && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{item.time}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-foreground leading-relaxed">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.expectedMove}</p>

                  {item.tradingAdvice && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                      <p className="text-xs font-bold text-primary mb-1">توصية التداول:</p>
                      <p className="text-sm text-foreground">{item.tradingAdvice}</p>
                    </div>
                  )}

                  {item.affectedPairs?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">الأزواج المتأثرة:</span>
                      {item.affectedPairs.map((p) => (
                        <span key={p} className="text-xs bg-muted border border-border px-2 py-0.5 rounded-lg font-mono font-bold">{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* مستويات يجب مراقبتها */}
          {(analysis.keyLevelsToWatch ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-bold text-base mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                مستويات مهمة يجب مراقبتها
              </h2>
              <div className="space-y-2">
                {analysis.keyLevelsToWatch.map((level, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            آخر تحديث: {new Date(analysis.generatedAt).toLocaleString("ar-EG")} — أسعار مأخوذة من Coinbase & Frankfurter
          </p>
        </div>
      )}
    </div>
  );
}
