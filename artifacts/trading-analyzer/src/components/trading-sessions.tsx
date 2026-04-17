import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  flag: string;
  name: string;
  city: string;
  startH: number;
  endH: number;
  note: string;
  strength: "low" | "medium" | "high";
}

const SESSIONS: Session[] = [
  {
    flag: "🇦🇺",
    name: "جلسة سيدني",
    city: "Sydney",
    startH: 0,
    endH: 9,
    note: "هادئة نسبيًا وفرص قليلة",
    strength: "low",
  },
  {
    flag: "🇯🇵",
    name: "جلسة طوكيو",
    city: "Tokyo",
    startH: 2,
    endH: 11,
    note: "حركة متوسطة — مناسبة للتداول المبكر",
    strength: "medium",
  },
  {
    flag: "🇬🇧",
    name: "جلسة لندن",
    city: "London",
    startH: 10,
    endH: 19,
    note: "🔥 أقوى جلسة — سيولة عالية وفرص كثيرة",
    strength: "high",
  },
  {
    flag: "🇺🇸",
    name: "جلسة نيويورك",
    city: "New York",
    startH: 15,
    endH: 24,
    note: "حركة قوية — خصوصًا في بداية الجلسة",
    strength: "high",
  },
];

function getEgyptTime(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 2 * 3600000);
}

function isActive(session: Session, h: number, m: number): boolean {
  const totalMins = h * 60 + m;
  const start = session.startH * 60;
  const end = session.endH * 60;
  return totalMins >= start && totalMins < end;
}

function formatHour(h: number): string {
  if (h === 0) return "12 صباحًا";
  if (h === 12) return "12 ظهرًا";
  if (h === 24) return "12 صباحًا";
  if (h < 12) return `${h} صباحًا`;
  return `${h - 12} مساءً`;
}

function progressPercent(session: Session, h: number, m: number): number {
  const totalMins = h * 60 + m;
  const start = session.startH * 60;
  const end = session.endH * 60;
  if (totalMins < start || totalMins >= end) return 0;
  return Math.round(((totalMins - start) / (end - start)) * 100);
}

const STRENGTH_COLORS = {
  low: {
    border: "border-slate-500/40",
    activeBorder: "border-slate-400",
    bg: "bg-slate-500/10",
    bar: "bg-slate-400",
    dot: "bg-slate-400",
    badge: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  },
  medium: {
    border: "border-blue-500/40",
    activeBorder: "border-blue-400",
    bg: "bg-blue-500/10",
    bar: "bg-blue-400",
    dot: "bg-blue-400",
    badge: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  },
  high: {
    border: "border-primary/40",
    activeBorder: "border-primary",
    bg: "bg-primary/10",
    bar: "bg-primary",
    dot: "bg-primary",
    badge: "text-primary border-primary/40 bg-primary/10",
  },
};

export function TradingSessions() {
  const [egyptTime, setEgyptTime] = useState(getEgyptTime());

  useEffect(() => {
    const id = setInterval(() => setEgyptTime(getEgyptTime()), 10000);
    return () => clearInterval(id);
  }, []);

  const h = egyptTime.getHours();
  const m = egyptTime.getMinutes();
  const activeSessions = SESSIONS.filter((s) => isActive(s, h, m));

  const timeStr = egyptTime.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Card className="border-border bg-card shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-0.5 bg-gradient-to-r from-primary/60 via-blue-500/40 to-transparent" />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            جلسات التداول — بتوقيت مصر
          </CardTitle>
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
            <span className="text-xs text-muted-foreground">توقيت مصر</span>
            <span className="font-bold text-foreground tabular-nums">{timeStr}</span>
          </div>
        </div>
        {activeSessions.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-500 font-semibold">
              {activeSessions.map((s) => s.name).join(" + ")} — نشطة الآن
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SESSIONS.map((session) => {
            const active = isActive(session, h, m);
            const pct = progressPercent(session, h, m);
            const colors = STRENGTH_COLORS[session.strength];

            return (
              <div
                key={session.city}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  active
                    ? `${colors.activeBorder} ${colors.bg} shadow-md`
                    : `${colors.border} bg-background/50 opacity-70`
                }`}
              >
                {active && (
                  <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
                )}

                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl leading-none">{session.flag}</span>
                  {active && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors.badge}`}>
                      نشطة
                    </span>
                  )}
                </div>

                <div className="font-bold text-sm mb-0.5">{session.name}</div>

                <div className="text-xs text-muted-foreground font-mono mb-2" dir="ltr">
                  {formatHour(session.startH)} – {formatHour(session.endH)}
                </div>

                <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                  {session.note}
                </div>

                <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-1 rounded-full transition-all duration-700 ${active ? colors.bar : "bg-transparent"}`}
                    style={{ width: active ? `${pct}%` : "0%" }}
                  />
                </div>
                {active && (
                  <div className="text-[10px] text-muted-foreground text-left mt-1 tabular-nums" dir="ltr">
                    {pct}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
