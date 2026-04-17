import {
  AnalysisResult,
  PriceZone,
  StructureEvent,
  ClassicalPattern,
  SupportResistanceLevel,
  SchoolReasons,
  InstitutionalSignal,
  AnalysisResultSession,
  TakeProfitReasons,
  IndicatorsSnapshot,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy, TrendingUp, TrendingDown, Crosshair, Target, ShieldAlert,
  BarChart3, AlertCircle, ArrowDown, ArrowUp, Layers, BookOpen,
  LineChart, Clock, Building2, AlertTriangle, Star, Zap, Shuffle,
  Activity, Gauge, CandlestickChart, Waves,
} from "lucide-react";
import { toast } from "sonner";

interface Props { analysis: AnalysisResult; imageUrl?: string; }

// ── مدارس التحليل ──
const SCHOOL_META = {
  smc:      { label: "SMC",      shortLabel: "الأموال الذكية",      color: "border-amber-500  text-amber-400  bg-amber-500/10"  },
  ict:      { label: "ICT",      shortLabel: "Inner Circle",        color: "border-blue-500   text-blue-400   bg-blue-500/10"   },
  sk:       { label: "SK",       shortLabel: "كلاسيكي",             color: "border-violet-500 text-violet-400 bg-violet-500/10" },
  mersal:   { label: "مرسال",    shortLabel: "Mersal SMC",          color: "border-teal-500   text-teal-400   bg-teal-500/10"   },
  combined: { label: "مجمع",     shortLabel: "SMC + ICT + SK + مرسال", color: "border-primary text-primary    bg-primary/10"    },
};

// ── جلسات التداول ──
const SESSION_META: Record<string, { label: string; color: string; icon: string; desc: string }> = {
  asian:           { label: "الجلسة الآسيوية",    color: "border-sky-500   text-sky-400   bg-sky-500/10",   icon: "🌏", desc: "طوكيو — سيولة أقل" },
  london:          { label: "جلسة لندن",           color: "border-emerald-500 text-emerald-400 bg-emerald-500/10", icon: "🇬🇧", desc: "أقوى جلسات الفوركس" },
  new_york:        { label: "جلسة نيويورك",        color: "border-blue-500  text-blue-400  bg-blue-500/10",  icon: "🇺🇸", desc: "تحركات قوية وسريعة" },
  london_new_york: { label: "تداخل لندن + نيويورك", color: "border-primary   text-primary   bg-primary/10",   icon: "⭐", desc: "الأقوى — أعلى سيولة" },
  any:             { label: "أي جلسة",             color: "border-border    text-muted-foreground bg-muted/50",  icon: "🌐", desc: "مناسب لأي وقت" },
};

// ── إشارات مؤسسية ──
const INST_META: Record<string, { label: string; color: string; icon: string }> = {
  accumulation: { label: "تجميع مؤسسي",       icon: "🟢", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
  distribution: { label: "توزيع مؤسسي",       icon: "🔴", color: "text-rose-400    border-rose-500/30    bg-rose-500/5"    },
  absorption:   { label: "امتصاص أوامر",      icon: "🟡", color: "text-amber-400   border-amber-500/30   bg-amber-500/5"   },
  manipulation: { label: "تلاعب / Judas Swing",icon: "🟣", color: "text-violet-400  border-violet-500/30  bg-violet-500/5"  },
  sweep:        { label: "اصطياد سيولة",      icon: "🔵", color: "text-blue-400    border-blue-500/30    bg-blue-500/5"    },
  breaker:      { label: "Breaker Block",      icon: "🔶", color: "text-orange-400  border-orange-500/30  bg-orange-500/5"  },
  mitigation:   { label: "Mitigation Block",   icon: "⚪", color: "text-slate-300   border-slate-500/30   bg-slate-500/5"   },
  propulsion:   { label: "دفع مؤسسي",         icon: "⚡", color: "text-yellow-400  border-yellow-500/30  bg-yellow-500/5"  },
  wyckoff:      { label: "مرحلة وايكوف",       icon: "🌊", color: "text-cyan-400    border-cyan-500/30    bg-cyan-500/5"    },
  divergence:   { label: "تباين مؤسسي",       icon: "📉", color: "text-pink-400    border-pink-500/30    bg-pink-500/5"    },
  order_flow:   { label: "تدفق أوامر مؤسسي",  icon: "🏦", color: "text-indigo-400  border-indigo-500/30  bg-indigo-500/5"  },
};

export function AnalysisResultView({ analysis, imageUrl }: Props) {
  const isBuy = analysis.tradeType === "buy";
  const schoolKey = (analysis.analysisSchool ?? "combined") as keyof typeof SCHOOL_META;
  const school = SCHOOL_META[schoolKey] ?? SCHOOL_META.combined;
  const isCombined = schoolKey === "combined" || schoolKey === "mersal";

  const sessionKey = (analysis.session ?? "any") as AnalysisResultSession;
  const session = SESSION_META[sessionKey] ?? SESSION_META.any;
  const prob = analysis.successProbability;
  const noTrade = prob === 0 || prob == null;
  const isLowProb = !noTrade && prob < 80 && prob >= 68;

  const instSignals: InstitutionalSignal[] = (analysis.institutionalSignals as InstitutionalSignal[]) ?? [];
  const style = analysis.tradeStyle ?? "flex";
  const STYLE_META = {
    scalp: { label: "اسكالب", icon: "⚡", color: "border-cyan-500 text-cyan-400 bg-cyan-500/10" },
    swing: { label: "سوينج", icon: "📈", color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
    flex:  { label: "مرن", icon: "🔄", color: "border-primary text-primary bg-primary/10" },
  };
  const styleMeta = STYLE_META[style as keyof typeof STYLE_META] ?? STYLE_META.flex;

  const copyToClipboard = () => {
    const entryZone = (analysis.entryZoneHigh && analysis.entryZoneLow)
      ? `منطقة الدخول: من ${analysis.entryZoneLow} إلى ${analysis.entryZoneHigh} (المثلى: ${analysis.entryPoint})`
      : `نقطة الدخول: ${analysis.entryPoint}`;
    const targets = [
      `الهدف الأول: ${analysis.takeProfit}`,
      analysis.takeProfit2 ? `الهدف الثاني: ${analysis.takeProfit2}` : null,
      analysis.takeProfit3 ? `الهدف الثالث: ${analysis.takeProfit3}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(`صفقة ${isBuy ? "شراء" : "بيع"} — ${isCombined ? "كل المدارس" : school.label}${analysis.symbol ? " — " + analysis.symbol : ""}
الجلسة: ${session.label}
${entryZone}
وقف الخسارة: ${analysis.stopLoss}
${targets}
نسبة النجاح: ${prob}%
نسبة المخاطرة للعائد: 1:${Number(analysis.riskRewardRatio).toFixed(2)}`);
    toast.success("تم نسخ تفاصيل الصفقة");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ══ حالة: لا توجد صفقة ══ */}
      {noTrade && (
        <div className="flex flex-col items-center gap-5 p-8 rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-400" />
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-amber-400">لا توجد فرصة تداول الآن</div>
            <div className="text-sm font-medium text-amber-300/80">هذا رد مهني وصحيح — الانتظار أفضل من صفقة سيئة</div>
          </div>
          {analysis.probabilityWarning && (
            <div className="max-w-lg bg-background/60 border border-amber-500/20 rounded-xl px-5 py-3 text-sm text-muted-foreground leading-relaxed text-right">
              <span className="font-semibold text-amber-400 block mb-1">سبب غياب الإعداد:</span>
              {analysis.probabilityWarning}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-xs text-muted-foreground/70">
            <div className="bg-background/40 border border-border/30 rounded-lg p-3">
              <div className="font-semibold text-foreground/60 mb-1">السبب الأشيع</div>
              <div>الصفقة عكس الاتجاه الرئيسي بدون تأكيد</div>
            </div>
            <div className="bg-background/40 border border-border/30 rounded-lg p-3">
              <div className="font-semibold text-foreground/60 mb-1">أو</div>
              <div>لا يوجد OB أو FVG واضح في الشارت</div>
            </div>
            <div className="bg-background/40 border border-border/30 rounded-lg p-3">
              <div className="font-semibold text-foreground/60 mb-1">أو</div>
              <div>RR أقل من 1:2 ولا يوجد هدف بعيد كافٍ</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground/60 border border-border/30 rounded-lg px-4 py-2">
            ↓ يمكنك مراجعة التحليل الكامل والهيكلية والإشارات المؤسسية أدناه
          </div>
        </div>
      )}

      {/* ══ تحذير النسبة (68-79%) ══ */}
      {isLowProb && analysis.probabilityWarning && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-1">تنبيه — نسبة متوسطة ({prob}%) — تداول بحذر</div>
            <p className="text-sm text-amber-300/80">{analysis.probabilityWarning}</p>
          </div>
        </div>
      )}

      {/* ══ كل محتوى الصفقة (يُخفى إذا لا صفقة) ══ */}
      {!noTrade && <>

      {/* ══ بطاقة الإشارة الرئيسية + نسبة النجاح ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* الإشارة الرئيسية */}
        <Card className="col-span-1 lg:col-span-2 border-primary/20 bg-card/50 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* نوع الصفقة */}
              <Badge variant="outline" className={`text-base px-5 py-2 border-2 font-bold ${isBuy ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : "border-rose-500 text-rose-400 bg-rose-500/10"}`}>
                {isBuy ? <TrendingUp className="w-5 h-5 ml-2" /> : <TrendingDown className="w-5 h-5 ml-2" />}
                {isBuy ? "صفقة شراء (BUY)" : "صفقة بيع (SELL)"}
              </Badge>
              {/* نوع الأمر */}
              {(() => {
                const ot = analysis.orderType ?? "market";
                const otMeta: Record<string, { label: string; color: string; icon: string }> = {
                  market:     { label: "Market — دخول فوري",      color: "border-emerald-500/60 text-emerald-300 bg-emerald-500/10", icon: "⚡" },
                  buy_limit:  { label: "Buy Limit — شراء معلّق",  color: "border-sky-400/60 text-sky-300 bg-sky-400/10",            icon: "📌" },
                  sell_limit: { label: "Sell Limit — بيع معلّق",  color: "border-violet-400/60 text-violet-300 bg-violet-400/10",   icon: "📌" },
                  buy_stop:   { label: "Buy Stop — اختراق صاعد",  color: "border-amber-400/60 text-amber-300 bg-amber-400/10",      icon: "🔼" },
                  sell_stop:  { label: "Sell Stop — اختراق هابط", color: "border-rose-400/60 text-rose-300 bg-rose-400/10",         icon: "🔽" },
                };
                const m = otMeta[ot] ?? otMeta.market;
                return (
                  <Badge variant="outline" className={`text-sm px-3 py-1.5 border font-bold ${m.color}`}>
                    <span className="ml-1">{m.icon}</span>{m.label}
                  </Badge>
                );
              })()}
              {/* المدرسة */}
              <Badge variant="outline" className={`text-sm px-3 py-1 border ${school.color}`}>
                {isCombined ? <Layers className="w-3 h-3 ml-1" /> : <BookOpen className="w-3 h-3 ml-1" />}
                {isCombined ? "كل المدارس" : school.label}
              </Badge>
              {/* الجلسة */}
              <Badge variant="outline" className={`text-sm px-3 py-1 border ${session.color}`}>
                <Clock className="w-3 h-3 ml-1" />
                {session.icon} {session.label}
              </Badge>
              {/* أسلوب التداول */}
              <Badge variant="outline" className={`text-sm px-3 py-1 border ${styleMeta.color}`}>
                <span className="ml-1">{styleMeta.icon}</span>
                {styleMeta.label}
              </Badge>
              {analysis.symbol && (
                <span className="text-xl font-bold font-mono tracking-widest text-primary">{analysis.symbol}</span>
              )}
            </div>
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground shrink-0" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 ml-2" />نسخ الصفقة
            </Button>
          </CardHeader>

          <CardContent className="pt-5 space-y-5">
            {/* وصف الجلسة */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${session.color} text-sm`}>
              <Clock className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">{session.icon} أفضل جلسة للدخول: {session.label}</span>
                <span className="text-muted-foreground mr-2">— {session.desc}</span>
              </div>
            </div>

            {/* اتجاه السوق */}
            {analysis.trendAnalysis && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 text-sm">
                {isBuy
                  ? <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  : <TrendingDown className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />}
                <span>{analysis.trendAnalysis}</span>
              </div>
            )}

            {/* منطقة الدخول */}
            <div className="bg-background/70 rounded-xl border border-primary/20 p-4">
              <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                <Crosshair className="w-4 h-4" /> منطقة الدخول
              </div>
              {analysis.entryZoneHigh && analysis.entryZoneLow ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[80px] text-center bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">الحد الأدنى</div>
                    <div className="text-xl font-bold font-mono text-primary">{analysis.entryZoneLow}</div>
                  </div>
                  <div className="text-muted-foreground font-bold text-lg">←</div>
                  <div className="flex-1 min-w-[80px] text-center bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <div className="text-xs text-muted-foreground mb-1">النقطة المثلى</div>
                    <div className="text-2xl font-extrabold font-mono text-foreground">{analysis.entryPoint}</div>
                  </div>
                  <div className="text-muted-foreground font-bold text-lg">←</div>
                  <div className="flex-1 min-w-[80px] text-center bg-primary/10 rounded-lg p-3 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">الحد الأعلى</div>
                    <div className="text-xl font-bold font-mono text-primary">{analysis.entryZoneHigh}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div className="text-3xl font-extrabold font-mono text-primary">{analysis.entryPoint}</div>
                </div>
              )}
            </div>

            {/* وقف الخسارة والأهداف */}
            <div className="space-y-3">
              <div className="bg-rose-500/5 p-4 rounded-lg border border-rose-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-medium text-sm">
                  <ShieldAlert className="w-4 h-4" /> وقف الخسارة
                </div>
                <div className="text-2xl font-bold font-mono text-rose-500">{analysis.stopLoss}</div>
              </div>

              {/* الهدف الأول */}
              <TakeProfitCard
                num={1}
                price={analysis.takeProfit}
                reason={(analysis.takeProfitReasons as TakeProfitReasons)?.tp1}
                color={{ border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", price: "text-emerald-500" }}
              />
              {/* الهدف الثاني */}
              {analysis.takeProfit2 && (
                <TakeProfitCard
                  num={2}
                  price={analysis.takeProfit2}
                  reason={(analysis.takeProfitReasons as TakeProfitReasons)?.tp2}
                  color={{ border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", price: "text-emerald-400" }}
                />
              )}
              {/* الهدف الثالث */}
              {analysis.takeProfit3 && (
                <TakeProfitCard
                  num={3}
                  price={analysis.takeProfit3}
                  reason={(analysis.takeProfitReasons as TakeProfitReasons)?.tp3}
                  color={{ border: "border-emerald-500/15", bg: "bg-emerald-500/5", text: "text-emerald-300", price: "text-emerald-300" }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* نسبة النجاح */}
        <Card className="col-span-1 border-primary/20 bg-card/50 shadow-lg">
          <CardContent className="p-6 h-full flex flex-col justify-center space-y-5 text-center">
            <div>
              <div className="text-muted-foreground mb-2 font-medium text-sm">نسبة النجاح</div>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="58" className="stroke-muted fill-none" strokeWidth="12" />
                  <circle
                    cx="64" cy="64" r="58"
                    className={`fill-none transition-all duration-1000 ${prob >= 80 ? "stroke-emerald-500" : prob >= 68 ? "stroke-primary" : "stroke-amber-500"}`}
                    strokeWidth="12"
                    strokeDasharray="364.4"
                    strokeDashoffset={364.4 - (364.4 * prob) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-3xl font-bold ${prob >= 80 ? "text-emerald-500" : prob >= 68 ? "text-primary" : "text-amber-500"}`}>{prob}%</span>
                  {prob >= 85 && <span className="text-xs text-emerald-400">ممتاز</span>}
                  {prob >= 68 && prob < 85 && <span className="text-xs text-primary">جيد</span>}
                </div>
              </div>
            </div>
            {/* ══ نسبة الثقة بالنجوم ══ */}
            {(() => {
              const conf = Math.min(5, Math.max(1, Math.round(analysis.tradeConfidence ?? 3)));
              const confMeta: Record<number, { label: string; color: string; bg: string }> = {
                1: { label: "إعداد ضعيف",   color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30" },
                2: { label: "إعداد مقبول",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30" },
                3: { label: "إعداد جيد",    color: "text-primary",     bg: "bg-primary/10 border-primary/30" },
                4: { label: "إعداد قوي",    color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
                5: { label: "إعداد مثالي",  color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/30" },
              };
              const m = confMeta[conf];
              return (
                <div className={`rounded-xl border p-3 ${m.bg} text-center`}>
                  <div className="text-xs text-muted-foreground mb-1 font-medium">قوة الإعداد التقني</div>
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={`text-xl transition-all ${i <= conf ? m.color : "text-muted-foreground/25"}`}>★</span>
                    ))}
                  </div>
                  <div className={`text-xs font-bold ${m.color}`}>{m.label}</div>
                </div>
              );
            })()}
            <div>
              <div className="text-muted-foreground mb-2 font-medium text-sm">نسبة المخاطرة للعائد</div>
              <div className="text-2xl font-bold font-mono bg-accent/30 py-2 rounded-md border border-accent">
                1 : {Number(analysis.riskRewardRatio).toFixed(2)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-3 space-y-1">
              <div>السوق: <span className="font-semibold text-foreground">{analysis.market === "forex" ? "فوركس" : analysis.market === "gold" ? "ذهب" : "كريبتو"}</span></div>
              <div>الإطار: <span className="font-semibold text-foreground font-mono">{analysis.timeframe}</span></div>
              <div>الجلسة: <span className="font-semibold">{session.icon} {session.label}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ══ إشارات المؤسسات والبنوك ══ */}
      {instSignals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            إشارات دخول المؤسسات والبنوك الكبيرة
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{instSignals.length} إشارة</Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {instSignals.map((sig, i) => {
              const meta = INST_META[sig.type] ?? INST_META.accumulation;
              return (
                <div key={i} className={`p-4 rounded-xl border ${meta.color} space-y-2`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="font-bold text-sm">{sig.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                      {sig.confidence != null && (
                        <span className="text-xs font-mono font-bold">
                          <Star className="w-3 h-3 inline ml-1" />{sig.confidence}%
                        </span>
                      )}
                    </div>
                  </div>
                  {(sig.price || sig.priceHigh || sig.priceLow) && (
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      {sig.price && <span>السعر: <span className="text-foreground font-bold">{sig.price}</span></span>}
                      {sig.priceLow && sig.priceHigh && (
                        <span>من <span className="text-foreground">{sig.priceLow}</span> إلى <span className="text-foreground">{sig.priceHigh}</span></span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-foreground/80 leading-relaxed">{sig.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ أسباب المدارس (عند التحليل المجمع أو مرسال) ══ */}
      {isCombined && analysis.schoolReasons && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            سبب الدخول من منظور كل مدرسة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SchoolReasonCard school="SMC" subtitle="الأموال الذكية" color="border-amber-500/30 bg-amber-500/5" headerColor="text-amber-400" icon="🟡" reason={(analysis.schoolReasons as SchoolReasons).smc} />
            <SchoolReasonCard school="ICT" subtitle="Inner Circle Trader" color="border-blue-500/30 bg-blue-500/5" headerColor="text-blue-400" icon="🔵" reason={(analysis.schoolReasons as SchoolReasons).ict} />
            <SchoolReasonCard school="كلاسيكي SK" subtitle="دعم ومقاومة وأنماط" color="border-violet-500/30 bg-violet-500/5" headerColor="text-violet-400" icon="🟣" reason={(analysis.schoolReasons as SchoolReasons).sk} />
            <SchoolReasonCard school="مرسال" subtitle="CISD + AMD + True OB" color="border-teal-500/30 bg-teal-500/5" headerColor="text-teal-400" icon="🩵" reason={(analysis.schoolReasons as SchoolReasons).mersal} />
          </div>
          <div className="p-5 rounded-xl border border-primary/30 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">⭐</span>
              <div>
                <h4 className="font-extrabold text-primary mb-1 text-base">إجماع المدارس الأربع</h4>
                <p className="text-sm text-foreground leading-loose">{(analysis.schoolReasons as SchoolReasons).consensus}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      </>}

      {/* ══ لوحة المؤشرات الحقيقية (يظهر دائماً إذا توفرت بيانات) ══ */}
      {analysis.indicatorsSnapshot && (
        <IndicatorsPanel ind={analysis.indicatorsSnapshot as IndicatorsSnapshot} isBuy={isBuy} />
      )}

      {/* ══ التحليل التفصيلي + الصورة (يظهر دائماً) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              التحليل التفصيلي الشامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-loose whitespace-pre-wrap text-sm">{analysis.detailedAnalysis}</p>
          </CardContent>
        </Card>
        {imageUrl ? (
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader><CardTitle className="text-lg">صورة الشارت المحلَّلة</CardTitle></CardHeader>
            <div className="aspect-video bg-black/50 border-t border-border">
              <img src={imageUrl} alt="Chart" className="w-full h-full object-contain" />
            </div>
          </Card>
        ) : <div />}
      </div>

      {/* ══ هيكلية السوق (يظهر دائماً) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary" />
              هيكلية السوق ومناطق السيولة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {analysis.liquidityZones.length > 0 && (
              <Section title="مناطق السيولة (Liquidity)">
                {analysis.liquidityZones.map((z, i) => <ZoneRow key={i} zone={z} />)}
              </Section>
            )}
            {analysis.orderBlocks.length > 0 && (
              <Section title="Order Blocks المؤسسية">
                {analysis.orderBlocks.map((ob, i) => <ZoneRow key={i} zone={ob} />)}
              </Section>
            )}
            {analysis.fairValueGaps.length > 0 && (
              <Section title="Fair Value Gaps (FVG)">
                {analysis.fairValueGaps.map((fvg, i) => <ZoneRow key={i} zone={fvg} />)}
              </Section>
            )}
            {analysis.liquidityZones.length === 0 && analysis.orderBlocks.length === 0 && analysis.fairValueGaps.length === 0 && (
              <EmptyMsg text="لم يتم تحديد مناطق هيكلية في هذا الشارت" />
            )}
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              كسر الهيكل والتغيير في الطابع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {analysis.structureBreaks.length > 0 && (
              <Section title="كسر الهيكل (BOS)">
                {analysis.structureBreaks.map((s, i) => <EventRow key={i} event={s} type="BOS" />)}
              </Section>
            )}
            {analysis.characterChanges.length > 0 && (
              <Section title="تغيير الطابع (ChoCH)">
                {analysis.characterChanges.map((c, i) => <EventRow key={i} event={c} type="ChoCH" />)}
              </Section>
            )}
            {analysis.supportResistanceLevels?.length > 0 && (
              <Section title="الدعم والمقاومة الرئيسية">
                {analysis.supportResistanceLevels.map((sr, i) => <SRRow key={i} level={sr} />)}
              </Section>
            )}
            {analysis.structureBreaks.length === 0 && analysis.characterChanges.length === 0 && (
              <EmptyMsg text="لم يتم رصد كسر هيكل واضح في هذا الشارت" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══ إشارات المؤسسات + الأنماط الكلاسيكية (تظهر دائماً) ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              إشارات الأموال المؤسسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(analysis.institutionalSignals as InstitutionalSignal[]).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(analysis.institutionalSignals as InstitutionalSignal[]).map((sig, i) => {
                  const meta = INST_META[sig.type] ?? INST_META.accumulation;
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${meta.color} space-y-2`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <span className="font-bold text-sm">{sig.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.label}</Badge>
                          {sig.confidence != null && (
                            <span className="text-xs font-mono font-bold"><Star className="w-3 h-3 inline ml-1" />{sig.confidence}%</span>
                          )}
                        </div>
                      </div>
                      {(sig.price || sig.priceHigh || sig.priceLow) && (
                        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                          {sig.price && <span>السعر: <span className="text-foreground font-bold">{sig.price}</span></span>}
                          {sig.priceLow && sig.priceHigh && <span>من <span className="text-foreground">{sig.priceLow}</span> إلى <span className="text-foreground">{sig.priceHigh}</span></span>}
                        </div>
                      )}
                      <p className="text-xs text-foreground/80 leading-relaxed">{sig.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyMsg text="لم يتم رصد إشارات مؤسسية واضحة في هذا الشارت" />
            )}
          </CardContent>
        </Card>

        {analysis.classicalPatterns?.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-lg">الأنماط الفنية الكلاسيكية</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {analysis.classicalPatterns.map((p, i) => <PatternRow key={i} pattern={p} />)}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}

// ── Sub-components ──

interface TPColor { border: string; bg: string; text: string; price: string; }
function TakeProfitCard({ num, price, reason, color }: { num: number; price: number; reason?: string; color: TPColor }) {
  return (
    <div className={`${color.bg} rounded-lg border ${color.border} p-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className={`flex items-center gap-1.5 ${color.text} text-xs font-medium`}>
          <Target className="w-3.5 h-3.5" />
          الهدف {num === 1 ? "الأول" : num === 2 ? "الثاني" : "الثالث"}
        </div>
        <div className={`text-xl font-bold font-mono ${color.price}`}>{price}</div>
      </div>
      {reason && (
        <div className={`flex items-start gap-1.5 ${color.text} text-xs opacity-80 bg-black/10 rounded px-2 py-1.5`}>
          <Star className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="leading-relaxed">{reason}</span>
        </div>
      )}
    </div>
  );
}

function SchoolReasonCard({ school, subtitle, color, headerColor, icon, reason }: {
  school: string; subtitle: string; color: string; headerColor: string; icon: string; reason: string;
}) {
  return (
    <div className={`p-4 rounded-xl border ${color} space-y-2`}>
      <div className={`flex items-center gap-2 font-bold ${headerColor}`}>
        <span className="text-lg">{icon}</span>
        <div>
          <div className="text-sm font-extrabold">{school}</div>
          <div className="text-xs opacity-70 font-normal">{subtitle}</div>
        </div>
      </div>
      <p className="text-sm text-foreground leading-loose">{reason}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-primary mb-2 text-sm">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="text-muted-foreground text-center py-4 flex items-center justify-center gap-2 text-sm">
      <AlertCircle className="w-4 h-4" />{text}
    </div>
  );
}

function ZoneRow({ zone }: { zone: PriceZone }) {
  const isBullish = zone.type === "bullish";
  const isBearish = zone.type === "bearish";
  return (
    <div className={`p-3 rounded-lg border space-y-1.5 ${isBullish ? "border-emerald-500/20 bg-emerald-500/3" : isBearish ? "border-rose-500/20 bg-rose-500/3" : "border-border/50 bg-background"}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shrink-0 ${isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-primary"}`} />
          <span className="font-semibold text-sm">{zone.label}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-muted-foreground">من</span>
          <span className={`font-bold ${isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-foreground"}`}>{zone.priceLow}</span>
          <span className="text-muted-foreground">إلى</span>
          <span className={`font-bold ${isBullish ? "text-emerald-400" : isBearish ? "text-rose-400" : "text-foreground"}`}>{zone.priceHigh}</span>
        </div>
      </div>
      {zone.description && (
        <p className="text-xs text-muted-foreground leading-relaxed pr-4 border-t border-border/30 pt-1.5">{zone.description}</p>
      )}
    </div>
  );
}

function EventRow({ event, type }: { event: StructureEvent; type: string }) {
  const isBullish = event.type === "bullish";
  return (
    <div className={`p-3 rounded-lg border space-y-1.5 ${isBullish ? "border-emerald-500/20 bg-emerald-500/3" : "border-rose-500/20 bg-rose-500/3"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-mono text-xs font-bold ${isBullish ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" : "text-rose-400 border-rose-500/40 bg-rose-500/5"}`}>
            {type} {isBullish ? <ArrowUp className="w-3 h-3 inline ml-0.5" /> : <ArrowDown className="w-3 h-3 inline ml-0.5" />}
          </Badge>
          <span className="font-medium text-sm">{event.label}</span>
        </div>
        <span className={`font-mono font-bold text-sm ${isBullish ? "text-emerald-400" : "text-rose-400"}`}>{event.price}</span>
      </div>
      {event.description && (
        <p className="text-xs text-muted-foreground leading-relaxed pr-4 border-t border-border/30 pt-1.5">{event.description}</p>
      )}
    </div>
  );
}

function SRRow({ level }: { level: SupportResistanceLevel }) {
  const isSupport = level.type === "support" || level.type === "strong_support";
  const isStrong = level.type === "strong_support" || level.type === "strong_resistance";
  return (
    <div className={`p-3 rounded-lg border space-y-1.5 ${isSupport ? "border-emerald-500/20 bg-emerald-500/3" : "border-rose-500/20 bg-rose-500/3"}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupport ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className="font-medium text-sm">{level.label}</span>
          {isStrong && (
            <Badge variant="outline" className={`text-xs px-1.5 py-0 font-bold ${isSupport ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-rose-500/40 text-rose-400 bg-rose-500/5"}`}>
              ⭐ قوي
            </Badge>
          )}
        </div>
        <span className={`font-mono font-bold text-base ${isSupport ? "text-emerald-400" : "text-rose-400"}`}>{level.price}</span>
      </div>
      {level.description && (
        <p className="text-xs text-muted-foreground leading-relaxed pr-4 border-t border-border/30 pt-1.5">{level.description}</p>
      )}
    </div>
  );
}

function PatternRow({ pattern }: { pattern: ClassicalPattern }) {
  const isBullish = pattern.type === "bullish";
  const isBearish = pattern.type === "bearish";
  const reliability = pattern.reliability ?? 0;
  const reliabilityColor = reliability >= 80 ? "text-emerald-400 border-emerald-500/40 bg-emerald-500/5"
    : reliability >= 65 ? "text-primary border-primary/40 bg-primary/5"
    : "text-amber-400 border-amber-500/40 bg-amber-500/5";
  return (
    <div className={`p-3 rounded-lg border space-y-1.5 ${isBullish ? "border-emerald-500/20 bg-emerald-500/3" : isBearish ? "border-rose-500/20 bg-rose-500/3" : "border-border/50 bg-background"}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isBullish ? "bg-emerald-500" : isBearish ? "bg-rose-500" : "bg-primary"}`} />
          <span className="font-semibold text-sm">{pattern.name}</span>
          <Badge variant="outline" className={`text-xs px-1.5 py-0 font-bold ${isBullish ? "text-emerald-400 border-emerald-500/30" : isBearish ? "text-rose-400 border-rose-500/30" : "text-primary border-primary/30"}`}>
            {isBullish ? "صاعد" : isBearish ? "هابط" : "محايد"}
          </Badge>
        </div>
        {reliability > 0 && (
          <Badge variant="outline" className={`text-xs font-bold ${reliabilityColor}`}>
            موثوقية {reliability}%
          </Badge>
        )}
      </div>
      {(pattern.priceHigh || pattern.priceLow) && (
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pr-4">
          {pattern.priceLow && <span>من: <span className="text-foreground font-bold">{pattern.priceLow}</span></span>}
          {pattern.priceHigh && <span>إلى: <span className="text-foreground font-bold">{pattern.priceHigh}</span></span>}
        </div>
      )}
      {pattern.description && (
        <p className="text-xs text-muted-foreground leading-relaxed pr-4 border-t border-border/30 pt-1.5">{pattern.description}</p>
      )}
    </div>
  );
}

// ── لوحة المؤشرات الحقيقية ──────────────────────────────────────────
function IndicatorsPanel({ ind, isBuy }: { ind: IndicatorsSnapshot; isBuy: boolean }) {
  const p = (n: number) => n >= 1000 ? n.toFixed(2) : n >= 10 ? n.toFixed(4) : n.toFixed(6);
  const pct = (n: number) => n.toFixed(2) + "%";

  // RSI colour
  const rsiColor = ind.rsi14 >= 70 ? "text-rose-400" : ind.rsi14 <= 30 ? "text-emerald-400" : "text-primary";
  const rsiBarColor = ind.rsi14 >= 70 ? "bg-rose-500" : ind.rsi14 <= 30 ? "bg-emerald-500" : "bg-primary";
  const rsiLabel = ind.rsiSignal === "overbought" ? "تشبع شراء ⚠️" : ind.rsiSignal === "oversold" ? "تشبع بيع ⚠️" : "محايد ✅";

  // Stochastic colour
  const stochColor = ind.stochK >= 80 ? "text-rose-400" : ind.stochK <= 20 ? "text-emerald-400" : "text-primary";

  // MACD
  const macdBull = ind.macdHistogram >= 0;
  const macdCrossText = ind.macdCrossing === "bullish" ? "⚡ تقاطع صاعد!" : ind.macdCrossing === "bearish" ? "⚡ تقاطع هابط!" : "";

  // Bollinger
  const bbText: Record<string, string> = {
    near_upper: "قريب من الحد العلوي",
    near_lower: "قريب من الحد السفلي",
    middle: "منتصف النطاق",
    breakout_up: "🔥 اختراق علوي!",
    breakout_down: "🔥 اختراق سفلي!",
  };

  // Momentum score
  const score = ind.momentumScore;
  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 55 ? "text-primary" : score <= 30 ? "text-rose-400" : score <= 45 ? "text-orange-400" : "text-muted-foreground";
  const scoreBarColor = score >= 70 ? "bg-emerald-500" : score >= 55 ? "bg-primary" : score <= 30 ? "bg-rose-500" : score <= 45 ? "bg-orange-500" : "bg-muted-foreground";
  const scoreLabel = score >= 75 ? "قوي جداً للصعود 🟢" : score >= 60 ? "يميل للصعود 🟡" : score <= 25 ? "قوي جداً للهبوط 🔴" : score <= 40 ? "يميل للهبوط 🟠" : "محايد ⚪";

  // EMA badge
  const emaBadge = (label: string, price: number, rel: string) => {
    const above = rel === "above";
    return (
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${above ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
        <span className="text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{p(price)}</span>
          <Badge variant="outline" className={`text-xs px-1.5 py-0 ${above ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30"}`}>
            {above ? <><ArrowUp className="w-2.5 h-2.5 inline" /> فوقها</> : <><ArrowDown className="w-2.5 h-2.5 inline" /> تحتها</>}
          </Badge>
        </div>
      </div>
    );
  };

  // Volume
  const volIcon = ind.volumeTrend === "rising" ? "📈" : ind.volumeTrend === "falling" ? "📉" : ind.volumeTrend === "n/a" ? "—" : "➡️";
  const volText = ind.volumeTrend === "rising" ? "متصاعد" : ind.volumeTrend === "falling" ? "متراجع" : ind.volumeTrend === "n/a" ? "غير متاح" : "مستقر";

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/3 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
          <Activity className="w-5 h-5" />
          المؤشرات الحقيقية — {ind.symbol}
          <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400 bg-emerald-500/5 mr-auto">
            ⚡ بيانات مباشرة
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── الزخم المركّب ── */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">نقاط الزخم المركّب</span>
            </div>
            <span className={`text-2xl font-extrabold font-mono ${scoreColor}`}>{score}<span className="text-sm text-muted-foreground">/100</span></span>
          </div>
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${scoreBarColor}`} style={{ width: `${score}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${scoreColor}`}>{scoreLabel}</span>
            <span className={`text-xs font-medium ${ind.probabilityBonus >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {ind.probabilityBonus >= 0 ? "+" : ""}{ind.probabilityBonus}% على نسبة النجاح
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/30 pt-2">{ind.tradeSuggestion}</p>
        </div>

        {/* ── شبكة المؤشرات ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* RSI */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">RSI (14)</span>
              <span className={`text-xl font-extrabold font-mono ${rsiColor}`}>{ind.rsi14}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${rsiBarColor}`} style={{ width: `${ind.rsi14}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>30</span><span className={`font-bold ${rsiColor}`}>{rsiLabel}</span><span>70</span>
            </div>
            {ind.rsiDivergence !== "none" && (
              <Badge variant="outline" className={`text-xs w-full justify-center ${ind.rsiDivergence === "bullish" ? "text-emerald-400 border-emerald-500/40" : "text-rose-400 border-rose-500/40"}`}>
                {ind.rsiDivergence === "bullish" ? "📈 تباين صاعد (Divergence)" : "📉 تباين هابط (Divergence)"}
              </Badge>
            )}
          </div>

          {/* Stochastic */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stochastic (14,3)</span>
              <span className={`text-xl font-extrabold font-mono ${stochColor}`}>{ind.stochK.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${ind.stochK >= 80 ? "bg-rose-500" : ind.stochK <= 20 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${ind.stochK}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>K={ind.stochK.toFixed(1)}</span>
              <span className={`font-bold ${stochColor}`}>{ind.stochSignal === "overbought" ? "تشبع شراء ⚠️" : ind.stochSignal === "oversold" ? "تشبع بيع ⚠️" : "محايد ✅"}</span>
              <span>D={ind.stochD.toFixed(1)}</span>
            </div>
          </div>

          {/* MACD */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">MACD (12,26,9)</span>
              <span className={`font-extrabold font-mono ${macdBull ? "text-emerald-400" : "text-rose-400"}`}>{ind.macdHistogram > 0 ? "+" : ""}{ind.macdHistogram.toFixed(4)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Line</span>
                <span className="font-mono font-bold">{ind.macdLine.toFixed(5)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Signal</span>
                <span className="font-mono font-bold">{ind.macdSignal.toFixed(5)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`text-xs ${macdBull ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" : "text-rose-400 border-rose-500/30 bg-rose-500/5"}`}>
                Histogram: {macdBull ? "🟢 موجب" : "🔴 سالب"}
              </Badge>
              {macdCrossText && <span className="text-xs font-bold text-primary">{macdCrossText}</span>}
            </div>
          </div>

          {/* Bollinger Bands */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bollinger Bands (20,2)</span>
              <Waves className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">Upper</span><span className="font-bold text-rose-400">{p(ind.bollingerUpper)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mid</span><span className="font-bold">{p(ind.bollingerMid)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lower</span><span className="font-bold text-emerald-400">{p(ind.bollingerLower)}</span></div>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, Math.max(0, ind.bollingerPct))}%` }} />
            </div>
            <Badge variant="outline" className="text-xs w-full justify-center border-primary/30 text-primary">
              %B = {pct(ind.bollingerPct)} — {bbText[ind.bollingerSignal] ?? ind.bollingerSignal}
            </Badge>
          </div>

          {/* ATR */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ATR (14) — التذبذب</span>
              <CandlestickChart className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <span className="text-2xl font-extrabold font-mono text-primary">{p(ind.atr14)}</span>
              <span className="text-xs text-muted-foreground block">({pct(ind.atrPct)} من السعر)</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>وقف مقترح (1.5× ATR)</span>
                <span className="font-mono font-bold text-amber-400">{p(ind.atr14 * 1.5)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>وقف مقترح (2× ATR)</span>
                <span className="font-mono font-bold text-rose-400">{p(ind.atr14 * 2)}</span>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">الحجم (Volume)</span>
              <span className="text-xl">{volIcon}</span>
            </div>
            <div className="text-center py-2">
              <span className={`text-xl font-bold ${ind.volumeTrend === "rising" ? "text-emerald-400" : ind.volumeTrend === "falling" ? "text-rose-400" : "text-muted-foreground"}`}>
                {volText}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {ind.volumeTrend === "n/a" ? "الفوركس والذهب لا يحتويان على بيانات حجم موحدة" : "الحجم يُستخدم لتأكيد قوة الحركة السعرية"}
            </p>
          </div>
        </div>

        {/* ── EMAs ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LineChart className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm">المتوسطات المتحركة (EMAs) — السعر الحالي: <span className="text-primary font-mono">{p(ind.currentPrice)}</span></h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {emaBadge("EMA 20 (قصير المدى)", ind.ema20, ind.priceVsEma20)}
            {emaBadge("EMA 50 (متوسط المدى)", ind.ema50, ind.priceVsEma50)}
            {emaBadge("EMA 200 (طويل المدى — الأهم)", ind.ema200, ind.priceVsEma200)}
          </div>
        </div>

        {/* ── مستويات ICT الرئيسية ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-primary" />
            <h4 className="font-bold text-sm">مستويات ICT الأساسية (Previous Day + Week)</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: "PDH — أعلى أمس",    price: ind.prevDayHigh,  color: "text-rose-400",    border: "border-rose-500/20 bg-rose-500/3"    },
              { label: "PDL — أدنى أمس",     price: ind.prevDayLow,   color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/3" },
              { label: "PDC — إغلاق أمس",    price: ind.prevDayClose, color: "text-primary",     border: "border-primary/20 bg-primary/3"        },
              { label: "أعلى الأسبوع (WHH)", price: ind.weekHigh,     color: "text-rose-400",    border: "border-rose-500/20 bg-rose-500/3"    },
              { label: "أدنى الأسبوع (WHL)", price: ind.weekLow,      color: "text-emerald-400", border: "border-emerald-500/20 bg-emerald-500/3" },
              { label: "أعلى 50 شمعة",       price: ind.highestHigh,  color: "text-amber-400",   border: "border-amber-500/20 bg-amber-500/3"   },
            ].map((item) => (
              <div key={item.label} className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-xs ${item.border}`}>
                <span className="text-muted-foreground">{item.label}</span>
                <span className={`font-mono font-bold text-sm ${item.color}`}>{p(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fibonacci ── */}
        {ind.fibLevels && ind.fibLevels.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">مستويات فيبوناتشي (من أحدث نطاق رئيسي)</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ind.fibLevels.map((f, i) => {
                const isOTE = f.level.includes("61.8") || f.level.includes("50%");
                return (
                  <div key={i} className={`flex flex-col gap-0.5 px-3 py-2 rounded-lg border text-xs ${isOTE ? "border-primary/40 bg-primary/8 text-primary" : "border-border bg-card"}`}>
                    <span className={`${isOTE ? "text-primary font-bold" : "text-muted-foreground"}`}>{f.level}</span>
                    <span className={`font-mono font-bold text-sm ${isOTE ? "text-primary" : ""}`}>{p(f.price)}</span>
                    {isOTE && <span className="text-primary/60 text-xs">← OTE</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── هيكل السوق ── */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-card text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">الاتجاه:</span>
            <Badge variant="outline" className={`font-bold ${ind.trend === "bullish" ? "text-emerald-400 border-emerald-500/40" : ind.trend === "bearish" ? "text-rose-400 border-rose-500/40" : "text-muted-foreground border-border"}`}>
              {ind.trend === "bullish" ? "🟢 صاعد" : ind.trend === "bearish" ? "🔴 هابط" : "⚪ عرضي"} — {ind.trendStrength === "strong" ? "قوي" : ind.trendStrength === "moderate" ? "متوسط" : "ضعيف"}
            </Badge>
          </div>
          <div className="flex-1 text-muted-foreground">{ind.marketStructure}</div>
        </div>

      </CardContent>
    </Card>
  );
}
