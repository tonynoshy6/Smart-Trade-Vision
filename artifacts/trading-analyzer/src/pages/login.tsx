import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Activity, Lock, User, Eye, EyeOff, TrendingUp, Shield, Zap } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(username.trim(), password);
    if (!ok) setError("اسم المستخدم أو كلمة المرور غير صحيحة");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden" dir="rtl">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        {/* خطوط الشبكة */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(201,162,39,0.3)]">
              <Activity className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-1">محلل التداول الذكي</h1>
          <p className="text-muted-foreground text-sm">منصة تحليل فني متقدمة بالذكاء الاصطناعي</p>
        </div>

        {/* مميزات سريعة */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <TrendingUp className="w-4 h-4" />, text: "SMC + ICT + SK + مرسال" },
            { icon: <Shield className="w-4 h-4" />, text: "نسبة نجاح عالية" },
            { icon: <Zap className="w-4 h-4" />, text: "تحليل فوري" },
          ].map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
              <span className="text-primary">{f.icon}</span>
              <span className="font-medium">{f.text}</span>
            </div>
          ))}
        </div>

        {/* بطاقة الدخول */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-yellow-500 to-transparent" />
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6 text-center">تسجيل الدخول</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">اسم المستخدم</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    required
                    autoComplete="username"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    required
                    autoComplete="current-password"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:shadow-[0_0_30px_rgba(201,162,39,0.5)] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  "دخول إلى المنصة"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground text-center space-y-1">
              <p className="font-semibold">بيانات تسجيل الدخول:</p>
              <p dir="ltr">Username: <span className="text-primary font-mono">admin</span> | Password: <span className="text-primary font-mono">trader2024</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
