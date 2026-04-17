import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAnalyzeChart,
  AnalyzeChartRequestMarket,
  AnalyzeChartRequestTimeframe,
  AnalyzeChartRequestAnalysisSchool,
  AnalyzeChartRequestTradeStyle,
} from "@workspace/api-client-react";
import { UploadCloud, Image as ImageIcon, Loader2, RefreshCw, Layers, BookOpen, Zap, TrendingUp, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { AnalysisResultView } from "@/components/analysis-result-view";
import { TradingSessions } from "@/components/trading-sessions";

type School = AnalyzeChartRequestAnalysisSchool;

const SCHOOLS: {
  value: School;
  label: string;
  badge: string;
  desc: string;
  activeClass: string;
  isCombined?: boolean;
}[] = [
  {
    value: "combined",
    label: "كل المدارس",
    badge: "SMC + ICT + SK + مرسال",
    desc: "تحليل مجمع من أربع مدارس — توصية مضمونة",
    activeClass: "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(201,162,39,0.25)]",
    isCombined: true,
  },
  {
    value: "mersal",
    label: "مرسال",
    badge: "Mersal SMC",
    desc: "CISD + AMD + True OB + Refined Entry — منهجية مرسال",
    activeClass: "border-teal-500 bg-teal-500/10 text-teal-400",
  },
  {
    value: "smc",
    label: "SMC فقط",
    badge: "Smart Money",
    desc: "الأموال الذكية — Order Blocks & Liquidity",
    activeClass: "border-amber-500 bg-amber-500/10 text-amber-400",
  },
  {
    value: "ict",
    label: "ICT فقط",
    badge: "Inner Circle",
    desc: "المنهجية المؤسسية — OTE & Kill Zones",
    activeClass: "border-blue-500 bg-blue-500/10 text-blue-400",
  },
  {
    value: "sk",
    label: "كلاسيكي SK",
    badge: "Classic",
    desc: "دعم ومقاومة — أنماط وإشارات كلاسيكية",
    activeClass: "border-violet-500 bg-violet-500/10 text-violet-400",
  },
];

export function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [market, setMarket] = useState<AnalyzeChartRequestMarket>("forex");
  const [timeframe, setTimeframe] = useState<AnalyzeChartRequestTimeframe>("H1");
  const [symbol, setSymbol] = useState("");
  const [school, setSchool] = useState<School>("combined");
  const [tradeStyle, setTradeStyle] = useState<AnalyzeChartRequestTradeStyle>("flex");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeChart = useAnalyzeChart();

  const readFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!ev.target?.result) return;
      const img = new Image();
      img.onload = () => {
        // أهدف إلى عرض 2048px كحد أقصى مع الحفاظ على النسبة — أعلى دقة لقراءة الأسعار
        const MAX = 2048;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round((height / width) * MAX); width = MAX; }
          else { width = Math.round((width / height) * MAX); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        // جودة 0.97 = أعلى وضوح للأرقام والشموع
        const optimized = canvas.toDataURL("image/jpeg", 0.97).split(",")[1];
        setImageBase64(optimized);
      };
      img.src = String(ev.target.result);
    };
    reader.readAsDataURL(f);
  };

  const handleAnalyze = () => {
    if (!imageBase64) { toast.error("يرجى إرفاق صورة الشارت أولاً"); return; }
    analyzeChart.mutate(
      { data: { imageBase64, market, timeframe, analysisSchool: school, tradeStyle, symbol: symbol.trim() || undefined } },
      {
        onSuccess: () => toast.success("تم التحليل بنجاح!"),
        onError: (e: any) => toast.error(e?.message ?? "حدث خطأ أثناء التحليل"),
      }
    );
  };

  const resetForm = () => { setFile(null); setImageBase64(""); analyzeChart.reset(); };
  const selectedMeta = SCHOOLS.find((s) => s.value === school)!;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <TradingSessions />
      {!analyzeChart.data && (
        <Card className="border-border bg-card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary via-yellow-600 to-transparent" />
          <CardHeader className="text-center pb-4 pt-10">
            <CardTitle className="text-3xl font-extrabold text-primary mb-2">تحليل شارت جديد</CardTitle>
            <CardDescription className="text-muted-foreground text-base max-w-2xl mx-auto">
              ارفع صورة الشارت واختر طريقة التحليل — يمكنك الجمع بين كل المدارس أو اختيار مدرسة واحدة.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 px-6 pb-10">

            {/* ── اختيار المدرسة ── */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                اختر طريقة التحليل
              </Label>

              {/* بطاقة الكل - بارزة فوق */}
              <button
                onClick={() => setSchool("combined")}
                className={`w-full flex flex-col sm:flex-row sm:items-center gap-3 p-5 rounded-2xl border-2 transition-all text-right ${
                  school === "combined"
                    ? SCHOOLS[0].activeClass + " scale-[1.01]"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${school === "combined" ? "bg-primary/20" : "bg-muted"}`}>
                    <Layers className={`w-5 h-5 ${school === "combined" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold">كل المدارس مجتمعة</span>
                      {school === "combined" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">مُفضَّل</span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">SMC + ICT + كلاسيكي SK + مرسال — توصية موحدة من الأربع مدارس مع أسباب كل مدرسة</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 flex-wrap">
                  {["SMC","ICT","SK","مرسال"].map((l) => (
                    <span key={l} className={`text-xs px-2 py-1 rounded border font-bold ${school === "combined" ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground"}`}>{l}</span>
                  ))}
                </div>
              </button>

              {/* المدارس الفردية */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SCHOOLS.slice(1).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSchool(s.value)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-right ${
                      school === s.value ? s.activeClass + " scale-[1.02]" : "border-border bg-background hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-bold">{s.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border font-bold ${school === s.value ? "border-current opacity-80" : "border-border text-muted-foreground"}`}>
                        {s.badge}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground leading-relaxed">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── اختيار أسلوب التداول ── */}
            <div className="space-y-3">
              <Label className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                أسلوب التداول
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTradeStyle("scalp")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tradeStyle === "scalp"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 scale-[1.02]"
                      : "border-border bg-background hover:border-cyan-500/40"
                  }`}
                >
                  <Zap className={`w-6 h-6 ${tradeStyle === "scalp" ? "text-cyan-400" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-bold text-sm">اسكالب</div>
                    <div className="text-xs text-muted-foreground">صفقة سريعة</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${tradeStyle === "scalp" ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/5" : "border-border text-muted-foreground"}`}>M1–M15</span>
                </button>

                <button
                  onClick={() => setTradeStyle("swing")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tradeStyle === "swing"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 scale-[1.02]"
                      : "border-border bg-background hover:border-emerald-500/40"
                  }`}
                >
                  <TrendingUp className={`w-6 h-6 ${tradeStyle === "swing" ? "text-emerald-400" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-bold text-sm">سوينج</div>
                    <div className="text-xs text-muted-foreground">صفقة أيام/أسابيع</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${tradeStyle === "swing" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" : "border-border text-muted-foreground"}`}>H4–D1</span>
                </button>

                <button
                  onClick={() => setTradeStyle("flex")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    tradeStyle === "flex"
                      ? "border-primary bg-primary/10 text-primary scale-[1.02] shadow-[0_0_15px_rgba(201,162,39,0.2)]"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <Shuffle className={`w-6 h-6 ${tradeStyle === "flex" ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-bold text-sm flex items-center gap-1">
                      مرن
                      {tradeStyle === "flex" && <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">مُفضَّل</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">الذكاء يختار</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${tradeStyle === "flex" ? "border-primary/40 text-primary bg-primary/5" : "border-border text-muted-foreground"}`}>Scalp + Swing</span>
                </button>
              </div>
            </div>

            {/* ── رفع الصورة ── */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer flex flex-col items-center gap-4 transition-all ${
                file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/10"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && readFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file" ref={fileInputRef} className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
              />
              {file ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div className="text-lg font-semibold">{file.name}</div>
                  <div className="text-sm text-muted-foreground">اضغط أو اسحب صورة أخرى للتغيير</div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div className="text-xl font-bold">اسحب وأفلت صورة الشارت هنا</div>
                  <div className="text-sm text-muted-foreground">أو اضغط لاختيار ملف (PNG, JPG, WebP)</div>
                </>
              )}
            </div>

            {/* ── إعدادات السوق ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-background/50 p-5 rounded-xl border border-border">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">السوق</Label>
                <Select value={market} onValueChange={(v) => setMarket(v as AnalyzeChartRequestMarket)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forex">فوركس (Forex)</SelectItem>
                    <SelectItem value="gold">ذهب (Gold)</SelectItem>
                    <SelectItem value="crypto">عملات رقمية (Crypto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">الإطار الزمني</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as AnalyzeChartRequestTimeframe)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M5">5 دقائق (M5)</SelectItem>
                    <SelectItem value="M15">15 دقيقة (M15)</SelectItem>
                    <SelectItem value="H1">ساعة (H1)</SelectItem>
                    <SelectItem value="H4">4 ساعات (H4)</SelectItem>
                    <SelectItem value="D1">يومي (D1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  الزوج / الرمز
                  <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    ⚡ بيانات حقيقية
                  </span>
                </Label>
                <Input
                  placeholder="مثال: EURUSD, XAUUSD, BTCUSD"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="bg-background border-border uppercase"
                  dir="ltr"
                />
                {symbol.trim() && (
                  <p className="text-xs text-emerald-400/80 flex items-center gap-1">
                    ✅ سيُجلب RSI + MACD + EMA الحقيقي لـ {symbol.trim().toUpperCase()} ويُرسل للتحليل
                  </p>
                )}
                {!symbol.trim() && (
                  <p className="text-xs text-muted-foreground/60">
                    أدخل الزوج لتفعيل التحليل الهجين (صورة + بيانات حقيقية)
                  </p>
                )}
              </div>
            </div>

            {/* ── زرار التحليل ── */}
            {/* ── مؤشر التحليل الهجين ── */}
            {symbol.trim() && (
              <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400/80">
                <span className="flex items-center gap-1.5">🖼️ <strong>صورة الشارت</strong></span>
                <span className="text-emerald-500/40">+</span>
                <span className="flex items-center gap-1.5">📊 <strong>RSI · MACD · EMA · ATR</strong> (حقيقية)</span>
                <span className="text-emerald-500/40">=</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">⚡ تحليل هجين</span>
              </div>
            )}

            <Button
              className="w-full h-14 text-lg font-bold shadow-[0_0_20px_rgba(201,162,39,0.2)] hover:shadow-[0_0_30px_rgba(201,162,39,0.4)] transition-all"
              onClick={handleAnalyze}
              disabled={!file || analyzeChart.isPending}
            >
              {analyzeChart.isPending ? (
                <><Loader2 className="w-6 h-6 ml-3 animate-spin" />{symbol.trim() ? "جاري جلب البيانات الحقيقية والتحليل..." : "جاري التحليل المعمق..."}</>
              ) : school === "combined" ? (
                <><Layers className="w-5 h-5 ml-2" />تحليل {symbol.trim() ? "هجين" : ""} بكل المدارس (SMC + ICT + SK + مرسال)</>
              ) : (
                <><BookOpen className="w-5 h-5 ml-2" />تحليل {symbol.trim() ? "هجين" : ""} — {selectedMeta.label}</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── شاشة التحميل ── */}
      {analyzeChart.isPending && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            <Layers className="absolute inset-0 m-auto w-12 h-12 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            {school === "combined" ? "تحليل المدارس الأربع..." : `تحليل ${selectedMeta.label}...`}
          </h2>
          <p className="text-muted-foreground text-center max-w-xs">
            {school === "combined"
              ? "الذكاء الاصطناعي يحلل الشارت من SMC وICT والكلاسيكي ومرسال ويستخرج توصية موحدة"
              : `تحليل معمق باستخدام منهجية ${selectedMeta.badge}`}
          </p>
        </div>
      )}

      {/* ── النتيجة ── */}
      {analyzeChart.data && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
            <h2 className="text-xl font-bold">نتيجة التحليل</h2>
            <Button variant="outline" size="sm" onClick={resetForm}>
              <RefreshCw className="w-4 h-4 ml-2" />تحليل جديد
            </Button>
          </div>
          <AnalysisResultView
            analysis={analyzeChart.data}
            imageUrl={file ? URL.createObjectURL(file) : undefined}
          />
        </div>
      )}
    </div>
  );
}
