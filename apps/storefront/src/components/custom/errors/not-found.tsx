import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { StatusPanel } from "@/components/custom/layout/status-panel";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.navigate({ to: "/" });
  };

  const handleGoBack = () => {
    router.history.back();
  };

  return (
    <StatusPanel
      eyebrow="404"
      icon={<SearchX className="h-5 w-5" />}
      title="Page not found"
      description="The page may have moved, been deleted, or the URL may be incorrect."
      actions={
        <>
          <Button type="button" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          <Button type="button" variant="outline" onClick={handleGoHome}>
            <Home className="h-4 w-4" />
            Go home
          </Button>
        </>
      }
    />
  );
}
