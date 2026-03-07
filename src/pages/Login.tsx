import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";

const Login = () => {
  const [accessCode, setAccessCode] = useState("");
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast.error("Please enter an access code");
      return;
    }

    try {
      const company = await login(accessCode.trim());
      if (company) {
        toast.success(`Welcome, ${company.company_name}!`);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong border-accent/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-60 h-32 flex items-center justify-center">
            <img 
              src="/Light background logo.png" 
              alt="Corevo Logo" 
              className="h-full w-auto object-contain"
            />
          </div>
                      <CardDescription className="text-base font-poppins text-accent/80">
              Track your company's sustainability activities and carbon emissions
            </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode">Company Access Code</Label>
              <Input
                id="accessCode"
                type="password"
                placeholder="Enter your access code"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;