import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn("404:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary-soft flex items-center justify-center mb-5">
          <Compass className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">길을 잃으셨나요?</h1>
        <p className="text-sm text-muted-foreground mb-6">찾으시는 페이지가 존재하지 않거나<br />이동되었을 수 있어요</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />뒤로
          </Button>
          <Button asChild className="gap-1.5">
            <Link to="/"><Home className="h-4 w-4" />홈으로</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
