/**
 * Catch-all route component for 404 pages
 */
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4 font-mono">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">الصفحة غير موجودة</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يرجى التحقق من الرابط أو العودة للرئيسية.
      </p>
      <Link href="/">
        <Button className="font-bold text-lg px-8 py-6 h-auto">
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
