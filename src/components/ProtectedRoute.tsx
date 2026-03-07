import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-api";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const { getCurrentCompany } = useAuth();

  useEffect(() => {
    const validateToken = () => {
      const company = getCurrentCompany();
      if (!company) {
        navigate("/");
        return;
      }
      setIsValidating(false);
    };

    validateToken();
  }, [navigate, getCurrentCompany]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};