import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";

interface ErrorComponentProps {
  error: Error;
  reset?: () => void;
}

export default function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  // Log error for debugging
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  const handleRetry = () => {
    if (reset) {
      reset();
    } else {
      // Fallback to router invalidation
      router.invalidate();
    }
  };

  const handleGoHome = () => {
    router.navigate({ to: "/" });
  };

  return (
    <StatusPanel
      variant="destructive"
      eyebrow="Storefront error"
      icon={<AlertTriangle className="h-5 w-5" />}
      title="Something interrupted the storefront"
      description="This is usually temporary. Retry the action or return to the home page."
      actions={
        <>
          <Button type="button" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
          <Button type="button" variant="outline" onClick={handleGoHome}>
            <ArrowLeft className="h-4 w-4" />
            Go home
          </Button>
        </>
      }
    />
  );
}
