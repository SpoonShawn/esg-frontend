import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity as ActivityIcon, FileText, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-api";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";

interface DashboardData {
  total_activities: number;
  total_emissions: number;
  recent_activities: Array<{
    activity_name: string;
    category?: string | null;
    emissions: number;
    date: string;
  }>;
}

const Dashboard = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const companyId = currentCompany?.id;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const res = await fetch(buildApiUrl(API_ENDPOINTS.dashboard(companyId)));
        if (!res.ok) throw new Error("Failed to load dashboard");
        const json = await res.json();
        setData(json);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [companyId]);

  const statCards = useMemo(() => {
    return [
      {
        title: "Total Activities",
        value: data ? String(data.total_activities) : "—",
        description: "All-time",
        icon: ActivityIcon,
        color: "text-accent",
      },
      {
        title: "Total Carbon Emissions",
        value: data ? `${(data.total_emissions || 0).toFixed(1)} kg CO₂e` : "—",
        description: "All-time",
        icon: ActivityIcon,
        color: "text-warning",
      },
    ];
  }, [data]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins">
            Welcome, {currentCompany?.company_name || 'Company'}
          </h1>
          <p className="text-muted-foreground font-poppins">
            Overview of your company's ESG activities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow border-accent/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '…' : stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest ESG activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
                {!loading && (!data || data.recent_activities.length === 0) && (
                  <div className="text-sm text-muted-foreground">No recent activities.</div>
                )}
                {!loading && data && data.recent_activities.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/5 border border-accent/10 rounded-lg">
                    <div>
                      <p className="font-medium">{item.activity_name}</p>
                      <p className="text-sm text-muted-foreground">{item.category || 'Uncategorized'} • {new Date(item.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-success">{(Number(item.emissions) || 0).toFixed(1)} kg CO₂e</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Frequently used features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg cursor-pointer hover:bg-accent/15 transition-colors border border-accent/20">
                  <ActivityIcon className="h-6 w-6 text-accent mb-2" />
                  <Link to="/activities">
                    <p className="font-medium text-accent">Add Activity</p>
                    <p className="text-xs text-muted-foreground">Log new ESG activity</p>
                  </Link>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg cursor-pointer hover:bg-accent/15 transition-colors border border-accent/20">
                  <FileText className="h-6 w-6 text-accent mb-2" />
                  <Link to="/reports">
                    <p className="font-medium text-accent">Generate Report</p>
                    <p className="text-xs text-muted-foreground">Generate and view reports</p>
                  </Link>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg cursor-pointer hover:bg-accent/15 transition-colors border border-accent/20">
                  <Brain className="h-6 w-6 text-accent mb-2" />
                  <Link to="/ai">
                    <p className="font-medium text-accent">Chat with AI</p>
                    <p className="text-xs text-muted-foreground">Use AI to analyze data</p>
                  </Link>
                </div>
                <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg cursor-pointer hover:bg-accent/15 transition-colors border border-accent/20">
                  <FileText className="h-6 w-6 text-accent mb-2" />
                  <Link to="/company-info">
                    <p className="font-medium text-accent">Company Info</p>
                    <p className="text-xs text-muted-foreground">View company information</p>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;