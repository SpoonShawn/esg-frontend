import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-api";

const Index = () => {
  const navigate = useNavigate();
  const { getCurrentCompany } = useAuth();

  useEffect(() => {
    const company = getCurrentCompany();
    if (company) {
      // User is authenticated, redirect to dashboard
      navigate("/dashboard");
    } else {
      // User is not authenticated, redirect to login
      navigate("/login");
    }
  }, [navigate, getCurrentCompany]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index; 