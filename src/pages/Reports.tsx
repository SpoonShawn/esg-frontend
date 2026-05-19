import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { FileText, AlertTriangle, CheckCircle, Globe, Download, Trash2, Clock, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";
import { buildApiUrl } from "@/lib/api";

// Types for report tasks
interface ReportTask {
  id: string;
  companyId: number;
  reportType: 'pdf' | 'html';
  asOfDate: string;
  fyDate: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  htmlContent?: string;
  error?: string;
}

const REPORTS_STORAGE_KEY = 'esg_report_tasks';
const POLLING_INTERVAL = 2000; // 2 seconds

const Reports = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'pdf' | 'html'>('pdf');
  const [htmlReportContent, setHtmlReportContent] = useState<string | null>(null);
  const [showHtmlReport, setShowHtmlReport] = useState(false);
  
  // Dates
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');
  const currentDate = `${currentDay}/${currentMonth}/${currentYear}`;
  
  const [asOfDate, setAsOfDate] = useState(currentDate);
  const [fyDate, setFyDate] = useState(currentYear.toString());
  
  // Company details
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Report tasks
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const tasksRef = useRef<ReportTask[]>([]);

  // Keep tasksRef in sync with tasks
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Load tasks from localStorage on mount
  useEffect(() => {
    loadTasks();
    startPolling();
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Load company details
  useEffect(() => {
    if (currentCompany?.id) {
      loadCompanyDetails();
    }
  }, [currentCompany?.id]);

  // Start polling for task updates
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    console.log('🔄 Starting report generation polling...');

    pollingRef.current = setInterval(() => {
      // Use ref to get latest tasks
      const currentTasks = tasksRef.current;
      const pendingTasks = currentTasks.filter(task => 
        task.status === 'pending' || task.status === 'generating'
      );

      if (pendingTasks.length > 0) {
        console.log(`📊 Processing ${pendingTasks.length} pending/generating tasks...`);
        pendingTasks.forEach(task => {
          generateReportInBackground(task);
        });
      }
    }, POLLING_INTERVAL);
  };

  // Load tasks from localStorage
  const loadTasks = () => {
    try {
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (stored) {
        const parsedTasks: ReportTask[] = JSON.parse(stored);
        // Filter out old tasks (older than 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const validTasks = parsedTasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          return taskDate > weekAgo;
        });
        
        setTasks(validTasks);
        tasksRef.current = validTasks;
        
        // Clean up old tasks in storage
        if (validTasks.length !== parsedTasks.length) {
          localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(validTasks));
        }

        console.log(`📋 Loaded ${validTasks.length} tasks from storage`);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Save tasks to localStorage
  const saveTasks = (updatedTasks: ReportTask[]) => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
      tasksRef.current = updatedTasks;
    } catch (error) {
      console.error('Error saving tasks:', error);
      toast.error('Failed to save report task');
    }
  };

  // Generate report in background
  const generateReportInBackground = async (task: ReportTask) => {
    // Prevent duplicate generation for already completed/failed tasks
    const currentTasks = tasksRef.current;
    const currentTask = currentTasks.find(t => t.id === task.id);
    
    if (!currentTask || currentTask.status === 'completed' || currentTask.status === 'failed') {
      return;
    }

    console.log(`🚀 Starting generation for task ${task.id} (${task.reportType})`);

    try {
      const updateTask = (updates: Partial<ReportTask>) => {
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, ...updates } : t
          )
        );
        
        // Also update in localStorage
        const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
        if (stored) {
          const parsedTasks: ReportTask[] = JSON.parse(stored);
          const updatedTasks = parsedTasks.map(t => 
            t.id === task.id ? { ...t, ...updates } : t
          );
          localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updatedTasks));
          tasksRef.current = updatedTasks;
        }
      };

      // Mark as generating
      updateTask({ status: 'generating', progress: 10 });

      // Call the appropriate API based on report type
      let apiUrl: string;
      if (task.reportType === 'pdf') {
        apiUrl = buildApiUrl(`/api/reports/generate?company_id=${task.companyId}&as_of_date=${task.asOfDate}&fy_date=${task.fyDate}`);
      } else {
        apiUrl = buildApiUrl(`/api/reports/generate-html?company_id=${task.companyId}&as_of_date=${task.asOfDate}&fy_date=${task.fyDate}`);
      }

      updateTask({ progress: 50 });

      console.log(`📡 Calling API: ${apiUrl}`);

      const response = await fetch(apiUrl, { method: 'GET' });
      updateTask({ progress: 80 });

      console.log(`📡 API Response status: ${response.status}`);

      if (response.ok) {
        if (task.reportType === 'pdf') {
          // Get the PDF blob
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          updateTask({
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            downloadUrl: url
          });

          console.log(`✅ PDF Report completed for ${task.fyDate}`);
          toast.success(`PDF Report for ${task.fyDate} is ready!`);
        } else {
          // Get HTML content
          const htmlContent = await response.text();
          
          updateTask({
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            htmlContent: htmlContent
          });

          console.log(`✅ HTML Report completed for ${task.fyDate}`);
          toast.success(`HTML Report for ${task.fyDate} is ready!`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Generation failed' }));
        throw new Error(errorData.detail || 'Report generation failed');
      }
    } catch (error) {
      console.error('❌ Error generating report in background:', error);
      
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id 
            ? { 
                ...t, 
                status: 'failed' as const, 
                error: error instanceof Error ? error.message : 'Unknown error',
                progress: 0
              } 
            : t
        )
      );

      // Update localStorage
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (stored) {
        const parsedTasks: ReportTask[] = JSON.parse(stored);
        const updatedTasks = parsedTasks.map(t => 
          t.id === task.id 
            ? { 
                ...t, 
                status: 'failed' as const, 
                error: error instanceof Error ? error.message : 'Unknown error',
                progress: 0
              } 
            : t
        );
        localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updatedTasks));
        tasksRef.current = updatedTasks;
      }

      toast.error(`Failed to generate ${task.reportType.toUpperCase()} report`);
    }
  };

  const loadCompanyDetails = async () => {
    if (!currentCompany?.id) return;
    
    setLoadingDetails(true);
    try {
      const response = await fetch(buildApiUrl(`/api/company-details/${currentCompany.id}`));
      if (response.ok) {
        const data = await response.json();
        setCompanyDetails(data);
      } else if (response.status === 404) {
        setCompanyDetails(null);
      } else {
        toast.error("Failed to load company details");
      }
    } catch (error) {
      console.error("Error loading company details:", error);
      toast.error("Failed to load company details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const validateCompanyInfo = () => {
    if (!companyDetails) {
      return {
        isValid: false,
        message: "Company information is not complete. Please fill out all required fields in the Company Info page first."
      };
    }

    const { website, description, workforce_data } = companyDetails;
    
    if (!website || !description) {
      return {
        isValid: false,
        message: "Please complete company website and description in the Company Info page."
      };
    }

    if (!workforce_data) {
      return {
        isValid: false,
        message: "Please complete workforce information in the Company Info page."
      };
    }

    const { age_bands, gender, employment_type, turnover, training } = workforce_data;

    if (!age_bands || Object.values(age_bands).some(val => val === null || val === undefined)) {
      return {
        isValid: false,
        message: "Please complete all age band information in the Company Info page."
      };
    }

    if (!gender || (!gender.male && !gender.female && !gender.non_binary)) {
      return {
        isValid: false,
        message: "Please complete gender distribution in the Company Info page. At least one gender category must have a value."
      };
    }

    if (!employment_type || !employment_type.full_time || !employment_type.part_time) {
      return {
        isValid: false,
        message: "Please complete employment type information in the Company Info page."
      };
    }

    if (!turnover || Object.values(turnover).some(val => val === null || val === undefined)) {
      return {
        isValid: false,
        message: "Please complete all turnover information in the Company Info page."
      };
    }

    if (!training || !training.trained_total || !training.employees_end_fy) {
      return {
        isValid: false,
        message: "Please complete training information in the Company Info page."
      };
    }

    return { isValid: true, message: "" };
  };

  const handleGenerateReport = async () => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }

    // Validate date formats
    const asOfDateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!asOfDateRegex.test(asOfDate)) {
      toast.error("Please use DD/MM/YYYY format for As Of Date");
      return;
    }

    const fyDateRegex = /^\d{4}$/;
    if (!fyDateRegex.test(fyDate)) {
      toast.error("Please use YYYY format for Financial Year");
      return;
    }

    // Create new task
    const newTask: ReportTask = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      companyId: currentCompany.id,
      reportType,
      asOfDate,
      fyDate,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    console.log('📝 Creating new report task:', newTask);

    // Add to tasks
    const updatedTasks = [newTask, ...tasks];
    saveTasks(updatedTasks);

    setIsModalOpen(false);
    
    // Start background generation immediately
    setTimeout(() => {
      generateReportInBackground(newTask);
    }, 100);
    
    toast.info(`${reportType.toUpperCase()} report generation started. You can navigate away and come back later!`);
    
    // Reset form
    setAsOfDate(currentDate);
    setFyDate(currentYear.toString());
  };

  const handleDownload = (task: ReportTask) => {
    if (task.downloadUrl) {
      const a = document.createElement('a');
      a.href = task.downloadUrl;
      a.download = `sustainability-report-${task.fyDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    }
  };

  const handleViewHtml = (task: ReportTask) => {
    if (task.htmlContent) {
      setHtmlReportContent(task.htmlContent);
      setShowHtmlReport(true);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    saveTasks(updatedTasks);
    toast.success('Report removed from history');
  };

  const handleEdit = (task: ReportTask) => {
    // Navigate to report editor with task data
    navigate('/reports/editor', {
      state: {
        taskId: task.id,
        reportType: task.reportType,
        fyDate: task.fyDate,
        asOfDate: task.asOfDate
      }
    });
  };

  const getTaskStatusBadge = (task: ReportTask) => {
    switch (task.status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'generating':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Generating {task.progress}%</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ESG Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage your sustainability and carbon emissions reports
          </p>
        </div>

        {/* Company Info Validation Status */}
        {loadingDetails ? (
          <Card className="shadow-soft border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Checking company information...</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className={`shadow-soft ${validateCompanyInfo().isValid ? 'border-green-200' : 'border-orange-200'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {validateCompanyInfo().isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Company information is complete</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="text-orange-600 font-medium">Company information incomplete</span>
                  </>
                )}
              </div>
              {!validateCompanyInfo().isValid && (
                <p className="text-sm text-muted-foreground mt-2">
                  {validateCompanyInfo().message}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate New Report */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Create comprehensive ESG reports for stakeholders and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary/30 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Report Will Include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Sustainability Targets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Corporate Carbon Emission disclosure
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Appendix - Performance Table
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Global Reporting Initiative Content Index
                </li>
              </ul>
            </div>

            {validateCompanyInfo().isValid ? (
              <div className="space-y-4">
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Choose Report Format:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      variant={reportType === 'pdf' ? "default" : "outline"}
                      onClick={() => setReportType('pdf')}
                      className="flex items-center gap-2 justify-start h-auto p-4"
                    >
                      <FileText className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">PDF Report</div>
                        <div className="text-xs opacity-80">Downloadable document</div>
                      </div>
                    </Button>
                    <Button 
                      variant={reportType === 'html' ? "default" : "outline"}
                      onClick={() => setReportType('html')}
                      className="flex items-center gap-2 justify-start h-auto p-4"
                    >
                      <Globe className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">HTML Report</div>
                        <div className="text-xs opacity-80">Interactive web format</div>
                      </div>
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Generate {reportType.toUpperCase()} Report
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">
                  Complete your company information to generate reports
                </p>
                <Button variant="outline" disabled className="w-full sm:w-auto">
                  Generate Report
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report History */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Report History
            </CardTitle>
            <CardDescription>
              View and download previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="border border-accent/10 rounded-lg p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {task.reportType === 'pdf' ? 'PDF' : 'HTML'} Report - FY {task.fyDate}
                          </h3>
                          {getTaskStatusBadge(task)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>As of: {task.asOfDate}</p>
                          <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                          {task.error && (
                            <p className="text-destructive">Error: {task.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'completed' && (
                          <>
                            {task.reportType === 'pdf' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(task)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewHtml(task)}
                              >
                                <Globe className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(task)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {task.status === 'generating' && (
                      <div className="mt-3">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full transition-all" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Dates Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate {reportType.toUpperCase()} Report</DialogTitle>
              <DialogDescription>
                Choose the key dates for your {reportType === 'pdf' ? 'PDF' : 'HTML'} ESG report.
                <br /><br />
                <span className="text-sm text-accent">✨ The report will generate in the background. You can navigate away and come back later!</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asOfDate">As Of Date (DD/MM/YYYY)</Label>
                  <Input
                    id="asOfDate"
                    placeholder="30/08/2025"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fyDate">Financial Year (YYYY)</Label>
                  <Input
                    id="fyDate"
                    placeholder="2025"
                    value={fyDate}
                    onChange={(e) => setFyDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>As Of Date:</strong> Report publication date</p>
                <p><strong>Financial Year:</strong> Main reporting year</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateReport} disabled={loadingDetails}>
                Start Generation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* HTML Report Viewer Modal */}
        <Dialog open={showHtmlReport} onOpenChange={setShowHtmlReport}>
          <DialogContent className="max-w-5xl h-[90vh] p-0">
            <div className="h-full flex flex-col">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle>ESG Sustainability Report</DialogTitle>
                <DialogDescription>
                  Interactive HTML report preview
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {htmlReportContent && (
                  <iframe
                    srcDoc={htmlReportContent}
                    className="w-full h-full border-0"
                    title="ESG Report"
                  />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Reports;
