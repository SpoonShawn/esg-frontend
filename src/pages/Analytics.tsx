import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { TrendingDown, TrendingUp, BarChart3, PieChart, Users, Activity as ActivityIcon, AlertCircle } from "lucide-react";
import { useActivities, useAuth } from "@/hooks/use-api";
import { buildApiUrl } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';

// Dynamic category colors - will be populated from backend
const CATEGORY_COLORS = [
  '#eab308', '#3b82f6', '#22c55e', '#a855f7', '#f97316', 
  '#06b6d4', '#10b981', '#6366f1', '#ef4444', '#8b5cf6',
  '#ec4899', '#f59e0b', '#84cc16', '#06b6d4', '#f97316'
];

// Helper function to get category color dynamically
const getCategoryColor = (category: string, categoryIndex: number = 0) => {
  return CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length] || '#6b7280';
};

const Analytics = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const { activities, fetchActivities } = useActivities();
  
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Record<string, string[]>>({});

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!currentCompany?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch activities
        await fetchActivities({ company_id: currentCompany.id });
        
        // Fetch company details
        try {
          const response = await fetch(buildApiUrl(`/api/company-details/${currentCompany.id}`));
          if (response.ok) {
            const data = await response.json();
            setCompanyDetails(data);
          }
        } catch (detailsError) {
          console.warn("Error loading company details:", detailsError);
        }

        // Fetch available categories from backend
        try {
          const categoriesResponse = await fetch(buildApiUrl('/api/activities/categories/list'));
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            setAvailableCategories(categoriesData.categories);
          }
        } catch (categoriesError) {
          console.warn("Error loading categories:", categoriesError);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCompany?.id, fetchActivities]);

  // Calculate analytics from real data
  const analytics = useMemo(() => {
    if (!activities || activities.length === 0) {
      return null;
    }

    // Total emissions and activities
    const totalEmissions = activities.reduce((sum, activity) => sum + (activity.emissions || 0), 0);
    const totalActivities = activities.length;

    // Get valid categories for the current company's location
    const locationCategories = availableCategories[currentCompany?.location || ''] || {};
    const validCategories = Object.keys(locationCategories);

    // Emissions by category
    const categoryMap: Record<string, { total: number; count: number }> = {};
    activities.forEach(activity => {
      const category = activity.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = { total: 0, count: 0 };
      }
      categoryMap[category].total += activity.emissions || 0;
      categoryMap[category].count += 1;
    });

    const emissionsByCategory = Object.entries(categoryMap)
      .map(([category, data], index) => ({
        category,
        emissions: data.total,
        activityCount: data.count,
        percentage: totalEmissions > 0 ? (data.total / totalEmissions) * 100 : 0,
        color: getCategoryColor(category, index),
        isValid: validCategories.includes(category)
      }))
      .sort((a, b) => b.emissions - a.emissions);

    // Monthly emissions
    const monthlyMap: Record<string, number> = {};
    activities.forEach(activity => {
      const date = new Date(activity.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = 0;
      }
      monthlyMap[monthKey] += activity.emissions || 0;
    });

    const monthlyEmissions = Object.entries(monthlyMap)
      .map(([month, emissions]) => ({ month, emissions }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Prepare data for stacked area chart - emissions by category over time
    const monthlyCategoryMap: Record<string, Record<string, number>> = {};
    activities.forEach(activity => {
      const date = new Date(activity.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const category = activity.category || 'Uncategorized';
      
      if (!monthlyCategoryMap[monthKey]) {
        monthlyCategoryMap[monthKey] = {};
      }
      if (!monthlyCategoryMap[monthKey][category]) {
        monthlyCategoryMap[monthKey][category] = 0;
      }
      monthlyCategoryMap[monthKey][category] += activity.emissions || 0;
    });

    // Convert to array format for stacked area chart
    const stackedAreaData = Object.entries(monthlyCategoryMap)
      .map(([month, categories]) => {
        const dataPoint: any = { month };
        Object.entries(categories).forEach(([category, emissions]) => {
          dataPoint[category] = emissions;
        });
        return dataPoint;
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Workforce metrics
    let workforceMetrics = null;
    if (companyDetails?.workforce_data?.age_bands) {
      const ageBands = companyDetails.workforce_data.age_bands as Record<string, any>;
      const totalEmployees = Object.values(ageBands).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
      
      if (totalEmployees > 0) {
        const trainingData = companyDetails.workforce_data.training;
        const employeesEndFY = Number(trainingData?.employees_end_fy) || 0;
        const trainedTotal = Number(trainingData?.trained_total) || 0;
        
        workforceMetrics = {
          totalEmployees,
          emissionsPerEmployee: totalEmissions / totalEmployees,
          activitiesPerEmployee: totalActivities / totalEmployees,
          trainingPercentage: employeesEndFY > 0 ? (trainedTotal / employeesEndFY) * 100 : 0
        };
      }
    }

    return {
      totalEmissions,
      totalActivities,
      averageEmissionsPerActivity: totalActivities > 0 ? totalEmissions / totalActivities : 0,
      emissionsByCategory,
      monthlyEmissions,
      stackedAreaData,
      topCategory: emissionsByCategory[0]?.category || 'N/A',
      workforceMetrics,
      validCategories
    };
  }, [activities, companyDetails, availableCategories, currentCompany?.location]);

  // Show loading state
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Loading your analytics data...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Analytics dashboard for your sustainability data</p>
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Show no data state
  if (!analytics || !activities || activities.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Analytics dashboard for your sustainability data</p>
          </div>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">
                Add some sustainability activities to see your analytics dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your carbon emissions and ESG performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Emissions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalEmissions.toFixed(1)} kg CO₂e</div>
              <p className="text-xs text-muted-foreground">
                From {analytics.totalActivities} activities
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalActivities}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {analytics.averageEmissionsPerActivity.toFixed(1)} kg CO₂e per activity
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.topCategory}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.emissionsByCategory[0]?.percentage.toFixed(1)}% of total emissions
              </p>
            </CardContent>
          </Card>

          {analytics.workforceMetrics && (
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Per Employee</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.workforceMetrics.emissionsPerEmployee.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">
                  kg CO₂e per employee ({analytics.workforceMetrics.totalEmployees} total)
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Emissions Trend */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Monthly Emissions Trend</CardTitle>
              <CardDescription>Carbon emissions over recent months</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.monthlyEmissions.length > 0 ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.monthlyEmissions}>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#e5e7eb" 
                        opacity={0.3} 
                      />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value.toFixed(0)}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)} kg CO₂e`, 'Emissions']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="emissions" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ 
                          fill: '#3b82f6', 
                          strokeWidth: 2, 
                          stroke: 'white', 
                          r: 4 
                        }}
                        activeDot={{ 
                          r: 6, 
                          stroke: '#3b82f6',
                          strokeWidth: 2,
                          fill: 'white'
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No monthly data available yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Emissions by Category */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Emissions by Category</CardTitle>
              <CardDescription>Breakdown of carbon emissions by activity type</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.emissionsByCategory.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Pie Chart */}
                  <div className="w-full lg:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.emissionsByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="emissions"
                        >
                          {analytics.emissionsByCategory.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number, name: string, props: any) => [
                            `${value.toFixed(1)} kg CO₂e`, 
                            props.payload.category
                          ]}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend */}
                  <div className="w-full lg:w-1/2 space-y-3">
                    {analytics.emissionsByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <div>
                            <div className="font-medium text-sm">{category.category}</div>
                            <div className="text-xs text-muted-foreground">
                              {category.activityCount} {category.activityCount === 1 ? 'activity' : 'activities'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{category.emissions.toFixed(1)} kg CO₂e</div>
                          <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No category data available yet
                </p>
              )}
              
              {/* Performance Insight */}
              {analytics.emissionsByCategory.length > 0 && (
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <BarChart3 className="h-4 w-4" />
                    Category Performance
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.topCategory} accounts for the largest share of your emissions. 
                    Focus efforts here for maximum impact.
                  </p>
                </div>
              )}

              {/* Invalid Categories Warning */}
              {analytics.emissionsByCategory.some(cat => !cat.isValid) && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium">
                    <AlertCircle className="h-4 w-4" />
                    Category Validation Warning
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some activities use categories that are not recognized for your location. 
                    These activities may not be properly categorized in future updates.
                  </p>
                  <div className="mt-2 text-xs text-yellow-600">
                    Invalid categories: {analytics.emissionsByCategory.filter(cat => !cat.isValid).map(cat => cat.category).join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emissions Trend Over Time */}
        {analytics.stackedAreaData && analytics.stackedAreaData.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Emissions Trend Over Time</CardTitle>
              <CardDescription>Cumulative emissions by category over recent months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.stackedAreaData}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#e5e7eb" 
                      opacity={0.3} 
                    />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(1)} kg CO₂e`, 
                        name
                      ]}
                    />
                    {analytics.emissionsByCategory.map((category, index) => (
                      <Bar
                        key={category.category}
                        dataKey={category.category}
                        stackId="emissions"
                        fill={category.color}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Chart Legend */}
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {analytics.emissionsByCategory.map((category, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-muted-foreground">{category.category}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workforce Analytics */}
        {analytics.workforceMetrics && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Workforce Impact</CardTitle>
              <CardDescription>Per-employee sustainability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.workforceMetrics.emissionsPerEmployee.toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground">kg CO₂e per employee</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {analytics.workforceMetrics.activitiesPerEmployee.toFixed(1)}
                  </div>
                  <p className="text-sm text-muted-foreground">Activities per employee</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {analytics.workforceMetrics.trainingPercentage.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Employees trained</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Insights */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Key highlights from your sustainability data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-medium text-primary mb-2">Emissions Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Total of {analytics.totalEmissions.toFixed(1)} kg CO₂e from {analytics.totalActivities} activities. 
                  Average of {analytics.averageEmissionsPerActivity.toFixed(1)} kg CO₂e per activity.
                </p>
              </div>
              <div className="p-4 bg-accent/10 rounded-lg">
                <h4 className="font-medium text-accent mb-2">Top Focus Area</h4>
                <p className="text-sm text-muted-foreground">
                  {analytics.topCategory} is your largest emission source at {analytics.emissionsByCategory[0]?.percentage.toFixed(1)}% of total. 
                  Consider prioritizing initiatives in this category.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Analytics;