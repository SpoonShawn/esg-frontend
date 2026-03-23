import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Activity,
  FileText,
  LogOut,
  Leaf,
  Menu,
  X,
  Brain,
  Building2,
  TrendingUp,
  Mail,
  Edit3
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Activities", href: "/activities", icon: Activity },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Report Editor", href: "/reports/editor", icon: Edit3 },
    { name: "AI", href: "/ai", icon: Brain },
  ];


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/20">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-card"
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-sm border-r border-accent/20 shadow-lg transform transition-transform lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center p-6 border-b border-accent/20">
            <img 
              src="/Light background logo.png" 
              alt="Corevo Logo" 
              className="h-10 mb-2"
            />
            <p className="text-xs text-muted-foreground font-poppins text-center">
              {currentCompany?.company_name || "Your Company"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Company Info (bottom, above contact and logout) */}
          <div className="p-4">
            <Link
              to="/company-info"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/company-info'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Building2 className="h-4 w-4" />
              Company Info
            </Link>
          </div>

          {/* Contact Us link */}
          <div className="p-4 pt-0">
            <Link
              to="/contact"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/contact'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              }`}
              onClick={() => setIsSidebarOpen(false)}
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </Link>
          </div>

          {/* Logout button */}
          <div className="p-4 border-t border-accent/20">
            <Button
              variant="outline"
              className="w-full justify-start border-accent/30 hover:bg-accent/10 hover:border-accent/50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};