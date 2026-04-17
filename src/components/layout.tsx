import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, History, LineChart, Wifi, WifiOff, Newspaper, Calculator, LogOut, Menu, X, Shield } from "lucide-react";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: health, isError } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000,
    },
  });
  const { user } = useUser();
  const { signOut } = useClerk();

  const displayName = user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] || "مستخدم";

  const navItems = [
    { href: "/", label: "تحليل جديد", icon: <LineChart className="w-4 h-4" />, match: (l: string) => l === "/" },
    { href: "/news", label: "الأخبار", icon: <Newspaper className="w-4 h-4" />, match: (l: string) => l === "/news" },
    { href: "/risk", label: "إدارة المخاطر", icon: <Calculator className="w-4 h-4" />, match: (l: string) => l === "/risk" },
    {
      href: "/history",
      label: "السجل",
      icon: <History className="w-4 h-4" />,
      match: (l: string) => l.startsWith("/history") || l.startsWith("/analysis/"),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative" dir="rtl">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-wide">
            <Activity className="w-6 h-6" />
            <span className="hidden sm:inline">محلل التداول الذكي</span>
            <span className="sm:hidden">المحلل</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors px-3 py-2 rounded-lg ${
                  item.match(location)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} className="hidden sm:block w-7 h-7 rounded-full object-cover border border-primary/30" />
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 text-xs font-medium text-muted-foreground">
                <Shield className="w-3 h-3 text-primary" />
                <span>{displayName}</span>
              </div>
            )}
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-400/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              خروج
            </button>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-accent"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors px-3 py-2.5 rounded-lg ${
                    item.match(location)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={() => { setMenuOpen(false); signOut({ redirectUrl: "/" }); }}
                className="w-full flex items-center gap-2 text-sm font-semibold text-red-400 px-3 py-2.5 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 pb-20">
        {children}
      </main>

      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur border border-border shadow-lg text-xs font-medium">
        {isError || health?.status !== "ok" ? (
          <>
            <WifiOff className="w-3 h-3 text-destructive" />
            <span className="text-destructive">غير متصل</span>
          </>
        ) : (
          <>
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-500">متصل</span>
          </>
        )}
      </div>
    </div>
  );
}
