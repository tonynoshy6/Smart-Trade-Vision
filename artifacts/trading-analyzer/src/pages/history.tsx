import {
  useGetAnalysisHistory, getGetAnalysisHistoryQueryKey,
  useGetAnalysisStats, getGetAnalysisStatsQueryKey,
  useDeleteAnalysis
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, Trash2, CalendarDays, Crosshair, Loader2, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SCHOOL_LABELS: Record<string, { label: string; color: string }> = {
  combined: { label: "كل المدارس", color: "border-primary/40 text-primary bg-primary/5" },
  smc:      { label: "SMC",        color: "border-amber-500/40 text-amber-400 bg-amber-500/5" },
  ict:      { label: "ICT",        color: "border-blue-500/40 text-blue-400 bg-blue-500/5" },
  sk:       { label: "كلاسيكي SK", color: "border-violet-500/40 text-violet-400 bg-violet-500/5" },
  mersal:   { label: "مرسال",      color: "border-teal-500/40 text-teal-400 bg-teal-500/5" },
};

export function HistoryPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useGetAnalysisStats({
    query: { queryKey: getGetAnalysisStatsQueryKey() }
  });
  const { data: history, isLoading: historyLoading } = useGetAnalysisHistory(undefined, {
    query: { queryKey: getGetAnalysisHistoryQueryKey() }
  });
  const deleteMutation = useDeleteAnalysis();

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("هل أنت متأكد من حذف هذا التحليل؟")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("تم الحذف بنجاح");
        queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
      },
      onError: () => toast.error("حدث خطأ أثناء الحذف"),
    });
  };

  const fmt = (d: string) =>
    new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">السجل والإحصائيات</h1>
        <p className="text-muted-foreground">نظرة شاملة على جميع التحليلات السابقة وأدائها</p>
      </div>

      {/* ── بطاقات الإحصائيات الرئيسية ── */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl bg-card" />)}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<BarChart3 className="w-6 h-6" />} label="إجمالي التحليلات" value={stats.totalAnalyses} color="text-primary bg-primary/10" />
            <StatCard icon={<TrendingUp className="w-6 h-6" />} label="إشارات الشراء" value={stats.buySignals} color="text-emerald-500 bg-emerald-500/10" valueColor="text-emerald-500" />
            <StatCard icon={<TrendingDown className="w-6 h-6" />} label="إشارات البيع" value={stats.sellSignals} color="text-rose-500 bg-rose-500/10" valueColor="text-rose-500" />
            <StatCard icon={<Crosshair className="w-6 h-6" />} label="متوسط النجاح الكلي" value={`${Math.round(stats.avgSuccessProbability)}%`} color="text-primary bg-primary/10" />
          </div>

          {/* ── نسبة نجاح الشراء والبيع بالتفصيل ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">نسبة نجاح الشراء</p>
                      <p className="text-xs text-muted-foreground">{stats.buySignals} صفقة</p>
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-emerald-500">{Math.round(stats.avgBuyProbability)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${stats.avgBuyProbability}%` }} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-rose-500/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/10 rounded-lg"><TrendingDown className="w-5 h-5 text-rose-500" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">نسبة نجاح البيع</p>
                      <p className="text-xs text-muted-foreground">{stats.sellSignals} صفقة</p>
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold text-rose-500">{Math.round(stats.avgSellProbability)}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-700" style={{ width: `${stats.avgSellProbability}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      ) : null}

      {/* ── جدول السجل ── */}
      <Card className="bg-card border-border shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            السجل التاريخي
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right font-bold text-muted-foreground">التاريخ</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">الرمز / السوق</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">الإطار</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">المدرسة</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">نوع الصفقة</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">نقطة الدخول</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">نسبة النجاح</TableHead>
                <TableHead className="text-left font-bold text-muted-foreground">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell colSpan={8}><Skeleton className="h-6 w-full bg-muted/50" /></TableCell>
                    </TableRow>
                  ))
                : history?.length === 0
                ? (
                  <TableRow className="border-border hover:bg-transparent">
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      لا يوجد سجل تحليلات بعد. ابدأ بتحليل شارت جديد!
                    </TableCell>
                  </TableRow>
                )
                : history?.map((item) => {
                  const schoolMeta = SCHOOL_LABELS[item.analysisSchool] ?? SCHOOL_LABELS.smc;
                  return (
                    <TableRow
                      key={item.id}
                      className="border-border hover:bg-accent/10 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/analysis/${item.id}`)}
                    >
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmt(item.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground font-mono">{item.symbol || "---"}</span>
                          <span className="text-xs text-muted-foreground">{item.market === "forex" ? "فوركس" : item.market === "gold" ? "ذهب" : "كريبتو"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary font-mono bg-primary/5">{item.timeframe}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${schoolMeta.color}`}>{schoolMeta.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.successProbability === 0 ? (
                          <Badge className="bg-muted text-muted-foreground border-border">
                            لا صفقة
                          </Badge>
                        ) : item.tradeType === "buy" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                            شراء <TrendingUp className="w-3 h-3 mr-1 inline" />
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                            بيع <TrendingDown className="w-3 h-3 mr-1 inline" />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {item.successProbability === 0 ? <span className="text-muted-foreground">—</span> : item.entryPoint}
                      </TableCell>
                      <TableCell>
                        {item.successProbability === 0 ? (
                          <span className="text-xs text-muted-foreground">لا صفقة</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${
                              item.successProbability >= 90 ? "text-emerald-400" :
                              item.successProbability >= 80 ? "text-emerald-500" :
                              item.successProbability >= 68 ? "text-primary" :
                              "text-rose-500"
                            }`}>
                              {item.successProbability}%
                            </span>
                            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.successProbability >= 90 ? "bg-emerald-400" :
                                  item.successProbability >= 80 ? "bg-emerald-500" :
                                  "bg-primary"
                                }`}
                                style={{ width: `${Math.min(100, ((item.successProbability - 68) / 27) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="ghost" size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(e, item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color, valueColor }: { icon: React.ReactNode; label: string; value: string | number; color: string; valueColor?: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <h3 className={`text-3xl font-bold ${valueColor ?? "text-foreground"}`}>{value}</h3>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
