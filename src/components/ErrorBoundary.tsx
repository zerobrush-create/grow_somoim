import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-sm w-full text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">문제가 발생했어요</h1>
          <p className="text-sm text-muted-foreground mb-5">잠시 후 다시 시도해주세요</p>
          <Button onClick={() => window.location.reload()} className="gap-1.5">
            <RefreshCcw className="h-4 w-4" />새로고침
          </Button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;