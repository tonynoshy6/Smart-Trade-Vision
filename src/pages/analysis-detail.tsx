import { useGetAnalysisById, getGetAnalysisByIdQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { AnalysisResultView } from "@/components/analysis-result-view";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AnalysisDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const { data: analysis, isLoading, error } = useGetAnalysisById(id, {
    query: { 
      enabled: !isNaN(id) && id > 0, 
      queryKey: getGetAnalysisByIdQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">جاري تحميل تفاصيل التحليل...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Card className="bg-card border-border p-10">
          <h2 className="text-2xl font-bold text-destructive mb-4">خطأ في التحميل</h2>
          <p className="text-muted-foreground mb-8">لم نتمكن من العثور على التحليل المطلوب. قد يكون تم حذفه أو أن الرابط غير صحيح.</p>
          <Link href="/history">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              العودة إلى السجل
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <Link href="/history">
            <Button variant="ghost" size="icon" className="hover:bg-accent/20">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            تفاصيل التحليل <span className="text-primary font-mono">#{analysis.id}</span>
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {analysis.createdAt && new Intl.DateTimeFormat('ar-EG', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }).format(new Date(analysis.createdAt))}
        </div>
      </div>

      <AnalysisResultView analysis={analysis} />
    </div>
  );
}
