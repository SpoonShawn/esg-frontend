import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/Layout";
import { 
  Brain, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  TrendingUp, 
  Lightbulb,
  Calendar,
  BarChart3
} from "lucide-react";
import { useActivities, useAuth } from "@/hooks/use-api";
import { toast } from "sonner";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Analysis {
  id: number;
  company_id: number;
  analysis_text: string;
  created_at: string;
  updated_at: string;
}

interface StructuredAnalysis {
  executive_summary: {
    overall_performance: string;
    key_metrics: {
      total_activities: number;
      total_emissions: number;
      average_emissions_per_activity: number;
      top_emission_category: string;
    };
    performance_rating: string;
  };
  activity_breakdown: {
    category_analysis: Array<{
      category: string;
      activity_count: number;
      total_emissions: number;
      percentage_of_total: number;
      insights: string;
    }>;
    emission_distribution: string;
  };
  emission_patterns: {
    trends: string;
    seasonal_variations: string;
    anomalies: string;
  };
  strengths: string[];
  areas_for_improvement: Array<{
    area: string;
    current_impact: string;
    recommendation: string;
    potential_savings: string;
  }>;
  strategic_recommendations: Array<{
    priority: string;
    recommendation: string;
    implementation_steps: string[];
    expected_impact: string;
    timeline: string;
  }>;
  benchmarking: {
    industry_comparison: string;
    best_practices: string;
    improvement_potential: string;
  };
  sources: Array<{
    title: string;
    url: string;
    type: string;
    relevance: string;
  }>;
  next_steps: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AI = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [structuredAnalysis, setStructuredAnalysis] = useState<StructuredAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { activities, fetchActivities } = useActivities();
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const currentCompanyId = currentCompany?.id || 1;

  useEffect(() => {
    if (currentCompanyId) {
      fetchActivities({ company_id: currentCompanyId });
      fetchAnalysis();
    }
  }, [currentCompanyId]);

  // Load chat history when company is available
  useEffect(() => {
    if (currentCompanyId) {
      loadChatHistory();
    }
  }, [currentCompanyId]);

  const loadChatHistory = useCallback(async () => {
    console.log("Loading chat history for company:", currentCompanyId);
    setHistoryLoading(true);
    
    try {
      const response = await fetch(buildApiUrl(`/api/chat/${currentCompanyId}/history`));
      console.log("Chat history response status:", response.status);
      
      if (response.ok) {
        const history = await response.json();
        console.log("Chat history loaded:", history.length, "messages");
        console.log("History data:", history);
        
        if (history.length > 0) {
          const messages: ChatMessage[] = history.map((msg: any, index: number) => ({
            id: `${index}-${msg.id}`,
            role: msg.message_role as 'user' | 'assistant',
            content: msg.message_content,
            timestamp: new Date(msg.created_at),
          }));
          console.log("Converted messages:", messages);
          setChatMessages(messages);
        } else {
          console.log("No messages in history, keeping empty state");
          setChatMessages([]);
        }
      } else {
        console.log("No chat history found or error:", response.status);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Don't show error toast for chat history loading failures
    } finally {
      setHistoryLoading(false);
    }
  }, [currentCompanyId]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.analysis(currentCompanyId)));
      if (response.ok) {
        const data = await response.json();
        
        // Handle the new response format
        if (data.analysis === null) {
          setAnalysis(null);
          setStructuredAnalysis(null);
          return;
        }
        
        setAnalysis(data);
        
        // Parse structured analysis
        try {
          const parsed = JSON.parse(data.analysis_text);
          setStructuredAnalysis(parsed);
        } catch (e) {
          console.error("Error parsing structured analysis:", e);
          setStructuredAnalysis(null);
        }
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
    }
  };

  const generateAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.analysis(currentCompanyId)), {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        
        // Parse structured analysis
        try {
          const parsed = JSON.parse(data.analysis_text);
          setStructuredAnalysis(parsed);
        } catch (e) {
          console.error("Error parsing structured analysis:", e);
          setStructuredAnalysis(null);
        }
        
        toast.success("Analysis generated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to generate analysis");
      }
    } catch (error) {
      toast.error("Failed to generate analysis");
      console.error("Error generating analysis:", error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const resetAnalysis = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.analysis(currentCompanyId)), {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAnalysis(null);
        setStructuredAnalysis(null);
        toast.success("Analysis reset successfully!");
      } else {
        throw new Error("Failed to reset analysis");
      }
    } catch (error) {
      toast.error("Failed to reset analysis");
      console.error("Error resetting analysis:", error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.chat(currentCompanyId)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          activities: activities || [],
        }),
      });

      console.log("Chat response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Chat response data:", data);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Error sending chat message:", error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins">AI Assistant</h1>
          <p className="text-muted-foreground font-poppins">
            Get AI-powered insights about your sustainability activities
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {/*
          <Button
            variant={activeTab === 'analysis' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('analysis')}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Analysis
          </Button>
          */}
          <Button
            variant={activeTab === 'chat' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </div>

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* Analysis Controls */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  Generate comprehensive analysis of your sustainability activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={generateAnalysis}
                    disabled={analysisLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {analysisLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                  {analysis && (
                    <Button
                      variant="outline"
                      onClick={resetAnalysis}
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reset Analysis
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analysis Display */}
            {analysis && structuredAnalysis ? (
              <div className="space-y-6">
                {/* Executive Summary */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Executive Summary
                      </CardTitle>
                      <Badge 
                        variant={
                          structuredAnalysis.executive_summary.performance_rating === 'Excellent' ? 'default' :
                          structuredAnalysis.executive_summary.performance_rating === 'Good' ? 'secondary' :
                          structuredAnalysis.executive_summary.performance_rating === 'Fair' ? 'outline' : 'destructive'
                        }
                        className="flex items-center gap-1"
                      >
                        <BarChart3 className="h-3 w-3" />
                        {structuredAnalysis.executive_summary.performance_rating}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {structuredAnalysis.executive_summary.overall_performance}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-accent">
                          {structuredAnalysis.executive_summary.key_metrics.total_activities}
                        </div>
                        <div className="text-xs text-muted-foreground">Activities</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-accent">
                          {structuredAnalysis.executive_summary.key_metrics.total_emissions.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">kg CO₂e</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-accent">
                          {structuredAnalysis.executive_summary.key_metrics.average_emissions_per_activity.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Avg/Activity</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm font-semibold text-accent">
                          {structuredAnalysis.executive_summary.key_metrics.top_emission_category}
                        </div>
                        <div className="text-xs text-muted-foreground">Top Category</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Breakdown */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Activity Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      {structuredAnalysis.activity_breakdown.emission_distribution}
                    </p>
                    
                    <div className="space-y-3">
                      {structuredAnalysis.activity_breakdown.category_analysis.map((category, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{category.category}</h4>
                            <div className="text-right">
                              <div className="font-semibold">{category.total_emissions.toFixed(1)} kg CO₂e</div>
                              <div className="text-sm text-muted-foreground">
                                {category.percentage_of_total.toFixed(1)}% of total
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>{category.activity_count} activities</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{category.insights}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Emission Patterns */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Emission Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">Trends</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.emission_patterns.trends}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Seasonal Variations</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.emission_patterns.seasonal_variations}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Anomalies</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.emission_patterns.anomalies}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Lightbulb className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {structuredAnalysis.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Areas for Improvement */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <TrendingUp className="h-5 w-5" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredAnalysis.areas_for_improvement.map((area, index) => (
                      <div key={index} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <h4 className="font-semibold text-orange-800 mb-2">{area.area}</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Current Impact:</span> {area.current_impact}
                          </div>
                          <div>
                            <span className="font-medium">Recommendation:</span> {area.recommendation}
                          </div>
                          <div>
                            <span className="font-medium">Potential Savings:</span> {area.potential_savings}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Lightbulb className="h-5 w-5" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredAnalysis.strategic_recommendations.map((rec, index) => (
                      <div key={index} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-800">{rec.recommendation}</h4>
                          <Badge 
                            variant={
                              rec.priority === 'High' ? 'destructive' :
                              rec.priority === 'Medium' ? 'secondary' : 'outline'
                            }
                          >
                            {rec.priority} Priority
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Expected Impact:</span> {rec.expected_impact}
                          </div>
                          <div>
                            <span className="font-medium">Timeline:</span> {rec.timeline}
                          </div>
                          <div>
                            <span className="font-medium">Implementation Steps:</span>
                            <ol className="list-decimal list-inside mt-1 space-y-1">
                              {rec.implementation_steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-muted-foreground">{step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Benchmarking */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Benchmarking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-1">Industry Comparison</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.benchmarking.industry_comparison}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Best Practices</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.benchmarking.best_practices}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Improvement Potential</h4>
                        <p className="text-sm text-muted-foreground">{structuredAnalysis.benchmarking.improvement_potential}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sources */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-indigo-600">
                      <BarChart3 className="h-5 w-5" />
                      Sources & References
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredAnalysis.sources.map((source, index) => (
                      <div key={index} className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-indigo-800">{source.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{source.relevance}</p>
                        {source.url && (
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                          >
                            <span>View Source</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <TrendingUp className="h-5 w-5" />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {structuredAnalysis.next_steps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Analysis Metadata */}
                <Card className="shadow-soft">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Analysis generated on {new Date(analysis.created_at).toLocaleDateString()} at {new Date(analysis.created_at).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-soft">
                <CardContent className="text-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate your first AI analysis to get insights about your sustainability activities.
                  </p>
                  <Button
                    onClick={generateAnalysis}
                    disabled={analysisLoading}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <Card className="shadow-soft flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Chat Assistant
              </CardTitle>
              <CardDescription>
                Ask questions about your sustainability activities and get AI-powered insights
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Loading Chat History</h3>
                    <p className="text-muted-foreground">
                      Fetching your previous conversations...
                    </p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground">
                      Ask me anything about your sustainability activities, emissions, or recommendations.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="text-sm space-y-2">
                            {message.content.split('\n\n').map((paragraph, index) => {
                              // Check if paragraph contains markdown-like formatting
                              if (paragraph.includes('**') || paragraph.includes('[') || paragraph.includes('#')) {
                                return (
                                  <ReactMarkdown 
                                    key={index}
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({children}) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                                      strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                                      a: ({href, children}) => (
                                        <a 
                                          href={href} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                          {children}
                                        </a>
                                      ),
                                      h3: ({children}) => <h3 className="text-base font-semibold text-foreground mt-3 mb-2">{children}</h3>,
                                      ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-4">{children}</ul>,
                                      li: ({children}) => <li className="text-sm text-muted-foreground">{children}</li>,
                                    }}
                                  >
                                    {paragraph}
                                  </ReactMarkdown>
                                );
                              } else {
                                // Plain text - just render as paragraph
                                return (
                                  <p key={index} className="text-sm text-muted-foreground">
                                    {paragraph}
                                  </p>
                                );
                              }
                            })}
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                        <span className="text-sm text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder={historyLoading ? "Loading chat history..." : "Ask about your sustainability activities..."}
                  disabled={chatLoading || historyLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={chatLoading || historyLoading || !chatInput.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AI; 