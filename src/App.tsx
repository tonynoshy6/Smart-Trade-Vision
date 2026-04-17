import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { HistoryPage } from "@/pages/history";
import { AnalysisDetailPage } from "@/pages/analysis-detail";
import { NewsPage } from "@/pages/news";
import { RiskCalculatorPage } from "@/pages/risk-calculator";
import { Activity, TrendingUp, Shield, Zap } from "lucide-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── خلفية متحركة مشتركة بين صفحتي الدخول والتسجيل ── */
function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ── هيدر الصفحات ── */
function AuthHeader() {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center mb-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(201,162,39,0.3)]">
          <Activity className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-1">محلل التداول الذكي</h1>
      <p className="text-muted-foreground text-sm">منصة تحليل فني متقدمة بالذكاء الاصطناعي</p>
    </div>
  );
}

/* ── صفحة تسجيل الدخول ── */
function SignInPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden" dir="rtl">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <AuthHeader />
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
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          appearance={{
            variables: {
              colorBackground: "#09090b",
              colorPrimary: "#c9a227",
              colorText: "#fafafa",
              colorTextSecondary: "#a1a1aa",
              colorInputBackground: "#18181b",
              colorInputText: "#fafafa",
              colorNeutral: "#3f3f46",
              colorDanger: "#f87171",
              colorSuccess: "#4ade80",
              borderRadius: "0.75rem",
              fontFamily: "Cairo, sans-serif",
              fontSize: "0.9rem",
            },
            elements: {
              rootBox: "w-full",
              card: "!bg-[#09090b] !border !border-[#27272a] !shadow-2xl w-full",
              headerTitle: "!text-white !font-bold",
              headerSubtitle: "!text-zinc-400",
              socialButtonsBlockButton: "!bg-[#18181b] !border !border-[#3f3f46] hover:!bg-[#27272a] !text-white !font-semibold",
              socialButtonsBlockButtonText: "!text-white",
              formFieldInput: "!bg-[#18181b] !border-[#3f3f46] !text-white placeholder:!text-zinc-500 focus:!ring-[#c9a227]/50 focus:!border-[#c9a227]",
              formFieldLabel: "!text-zinc-300 !font-semibold",
              formButtonPrimary: "!bg-[#c9a227] hover:!bg-[#b8911f] !text-black !font-bold !shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:!shadow-[0_0_30px_rgba(201,162,39,0.5)]",
              footerActionLink: "!text-[#c9a227] hover:!text-[#e6b82e]",
              dividerLine: "!bg-[#3f3f46]",
              dividerText: "!text-zinc-500",
              identityPreviewText: "!text-white",
              identityPreviewEditButton: "!text-[#c9a227]",
              otpCodeFieldInput: "!bg-[#18181b] !border-[#3f3f46] !text-white",
              formResendCodeLink: "!text-[#c9a227]",
              alertText: "!text-zinc-300",
              alternativeMethodsBlockButton: "!bg-[#18181b] !border-[#3f3f46] !text-white hover:!bg-[#27272a]",
            },
          }}
        />
      </div>
    </div>
  );
}

/* ── صفحة إنشاء الحساب ── */
function SignUpPage() {
  // To update login providers, app branding, or OAuth settings use the Auth
  // pane in the workspace toolbar. More information can be found in the Replit docs.
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden" dir="rtl">
      <AuthBackground />
      <div className="relative z-10 w-full max-w-md px-4">
        <AuthHeader />
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={{
            variables: {
              colorBackground: "#09090b",
              colorPrimary: "#c9a227",
              colorText: "#fafafa",
              colorTextSecondary: "#a1a1aa",
              colorInputBackground: "#18181b",
              colorInputText: "#fafafa",
              colorNeutral: "#3f3f46",
              colorDanger: "#f87171",
              colorSuccess: "#4ade80",
              borderRadius: "0.75rem",
              fontFamily: "Cairo, sans-serif",
              fontSize: "0.9rem",
            },
            elements: {
              rootBox: "w-full",
              card: "!bg-[#09090b] !border !border-[#27272a] !shadow-2xl w-full",
              headerTitle: "!text-white !font-bold",
              headerSubtitle: "!text-zinc-400",
              socialButtonsBlockButton: "!bg-[#18181b] !border !border-[#3f3f46] hover:!bg-[#27272a] !text-white !font-semibold",
              socialButtonsBlockButtonText: "!text-white",
              formFieldInput: "!bg-[#18181b] !border-[#3f3f46] !text-white placeholder:!text-zinc-500 focus:!ring-[#c9a227]/50 focus:!border-[#c9a227]",
              formFieldLabel: "!text-zinc-300 !font-semibold",
              formButtonPrimary: "!bg-[#c9a227] hover:!bg-[#b8911f] !text-black !font-bold !shadow-[0_0_20px_rgba(201,162,39,0.3)] hover:!shadow-[0_0_30px_rgba(201,162,39,0.5)]",
              footerActionLink: "!text-[#c9a227] hover:!text-[#e6b82e]",
              dividerLine: "!bg-[#3f3f46]",
              dividerText: "!text-zinc-500",
              identityPreviewText: "!text-white",
              identityPreviewEditButton: "!text-[#c9a227]",
              otpCodeFieldInput: "!bg-[#18181b] !border-[#3f3f46] !text-white",
              formResendCodeLink: "!text-[#c9a227]",
              alertText: "!text-zinc-300",
            },
          }}
        />
      </div>
    </div>
  );
}

/* ── الصفحة الرئيسية (توجيه بناءً على حالة الدخول) ── */
function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <HomePage />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

/* ── حماية الصفحات الداخلية ── */
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

/* ── مزامنة Clerk مع cache التنزيلات ── */
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevIdRef.current !== undefined && prevIdRef.current !== id) {
        qc.clear();
      }
      prevIdRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/history">
              <ProtectedPage><HistoryPage /></ProtectedPage>
            </Route>
            <Route path="/analysis/:id">
              {(params) => (
                <ProtectedPage><AnalysisDetailPage /></ProtectedPage>
              )}
            </Route>
            <Route path="/news">
              <ProtectedPage><NewsPage /></ProtectedPage>
            </Route>
            <Route path="/risk">
              <ProtectedPage><RiskCalculatorPage /></ProtectedPage>
            </Route>
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
