import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { FileText, AlertTriangle, CheckCircle, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";
import { buildApiUrl } from "@/lib/api";

const Reports = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'pdf' | 'html'>('pdf');
  const [htmlReportContent, setHtmlReportContent] = useState<string | null>(null);
  const [showHtmlReport, setShowHtmlReport] = useState(false);
  // Get current date and year for defaults
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
  const currentDay = String(today.getDate()).padStart(2, '0');
  const currentDate = `${currentDay}/${currentMonth}/${currentYear}`;
  
  const [asOfDate, setAsOfDate] = useState(currentDate);
  const [fyDate, setFyDate] = useState(currentYear.toString());
  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);



  // Load company details on component mount
  useEffect(() => {
    if (currentCompany?.id) {
      loadCompanyDetails();
    }
  }, [currentCompany?.id]);

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
    
    // Check basic company info
    if (!website || !description) {
      return {
        isValid: false,
        message: "Please complete company website and description in the Company Info page."
      };
    }

    // Check workforce data
    if (!workforce_data) {
      return {
        isValid: false,
        message: "Please complete workforce information in the Company Info page."
      };
    }

    const { age_bands, gender, employment_type, turnover, training } = workforce_data;

    // Check age bands
    if (!age_bands || Object.values(age_bands).some(val => val === null || val === undefined)) {
      return {
        isValid: false,
        message: "Please complete all age band information in the Company Info page."
      };
    }

    // Check gender
    if (!gender || (!gender.male && !gender.female && !gender.non_binary)) {
      return {
        isValid: false,
        message: "Please complete gender distribution in the Company Info page. At least one gender category must have a value."
      };
    }

    // Check employment type
    if (!employment_type || !employment_type.full_time || !employment_type.part_time) {
      return {
        isValid: false,
        message: "Please complete employment type information in the Company Info page."
      };
    }

    // Check turnover
    if (!turnover || Object.values(turnover).some(val => val === null || val === undefined)) {
      return {
        isValid: false,
        message: "Please complete all turnover information in the Company Info page."
      };
    }

    // Check training
    if (!training || !training.trained_total || !training.employees_end_fy) {
      return {
        isValid: false,
        message: "Please complete training information in the Company Info page."
      };
    }

    return { isValid: true, message: "" };
  };

  const handleGenerateReport = async () => {
    if (reportType === 'pdf') {
      await generatePdfReport();
    } else {
      await generateHtmlReport();
    }
  };

  const generatePdfReport = async () => {
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

    // Validate FY date format (YYYY)
    const fyDateRegex = /^\d{4}$/;
    if (!fyDateRegex.test(fyDate)) {
      toast.error("Please use YYYY format for Financial Year");
      return;
    }

    setIsGenerating(true);
    setIsModalOpen(false);
    
    try {
      // Call backend API to generate report
      const response = await fetch(
        buildApiUrl(`/api/reports/generate?company_id=${currentCompany?.id}&as_of_date=${asOfDate}&fy_date=${fyDate}`),
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sustainability-report-${fyDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success(`PDF Report generated successfully for FY ${fyDate}!`);
        
        // Reset form
        setAsOfDate("");
        setFyDate("");
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate report' }));
        throw new Error(errorData.detail || 'Failed to generate report');
      }
    } catch (error) {
      toast.error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Error generating PDF report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHtmlReport = async () => {
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

    // Validate FY date format (YYYY)
    const fyDateRegex = /^\d{4}$/;
    if (!fyDateRegex.test(fyDate)) {
      toast.error("Please use YYYY format for Financial Year");
      return;
    }

    setIsGeneratingHtml(true);
    setIsModalOpen(false);

    try {
      // Call backend API to generate HTML report
      const response = await fetch(
        buildApiUrl(`/api/reports/generate-html?company_id=${currentCompany?.id}&as_of_date=${asOfDate}&fy_date=${fyDate}`),
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        // Display HTML report in dialog instead of popup
        const htmlContent = await response.text();
        setHtmlReportContent(htmlContent);
        setShowHtmlReport(true);
        toast.success(`HTML Report generated successfully for FY ${fyDate}!`);

        // Reset form
        setAsOfDate("");
        setFyDate("");
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to generate HTML report' }));
        throw new Error(errorData.detail || 'Failed to generate HTML report');
      }
    } catch (error) {
      toast.error(`Failed to generate HTML report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Error generating HTML report:", error);
    } finally {
      setIsGeneratingHtml(false);
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
                  disabled={isGenerating || isGeneratingHtml}
                  className="w-full sm:w-auto"
                >
                  {isGenerating || isGeneratingHtml ? "Generating Report..." : `Generate ${reportType.toUpperCase()} Report`}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-2">
                  Complete your company information to generate reports
                </p>
                <Button 
                  variant="outline" 
                  disabled
                  className="w-full sm:w-auto"
                >
                  Generate Report
                </Button>
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
              <Button onClick={handleGenerateReport} disabled={loadingDetails || isGenerating || isGeneratingHtml}>
                Generate Report
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
