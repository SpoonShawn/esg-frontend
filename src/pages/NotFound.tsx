import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Company Logo */}
        <div className="mb-8">
          <img 
            src="/Light background logo.png" 
            alt="Corevo Logo" 
            className="h-16 mx-auto mb-4"
          />
        </div>

        {/* 404 Content */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-accent/20">
          <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
          
          <h2 className="text-xl font-semibold text-foreground mb-3">
            Page Not Found
          </h2>
          
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
