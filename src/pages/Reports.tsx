import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import { FileText, AlertTriangle, CheckCircle, Globe, Download, Printer, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";
import { buildApiUrl } from "@/lib/api";

const Reports = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'pdf' | 'html'>('pdf');
  const [htmlReportContent, setHtmlReportContent] = useState<string | null>(null);
  const [showHtmlReport, setShowHtmlReport] = useState(false);

  // Chapter selection
  const [availableChapters, setAvailableChapters] = useState<any>(null);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([
    'executive_summary', 'about_report', 'about_us',
    'sustainability_targets', 'emissions_disclosure',
    'ai_recommendations', 'performance_tables'
  ]);

  // Theme customization
  const [availableThemes, setAvailableThemes] = useState<any>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('corporate_blue');
  const [headingFont, setHeadingFont] = useState<string>('times_new_roman');
  const [bodyFont, setBodyFont] = useState<string>('times_new_roman');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('');
  const [customAccentColor, setCustomAccentColor] = useState<string>('');

  // Saved reports
  const [savedReports, setSavedReports] = useState<any[]>([]);

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

  // Define loadSavedReports BEFORE useEffect to avoid reference errors
  const loadSavedReports = useCallback(() => {
    if (!currentCompany?.id) return;

    try {
      // Load all saved reports for this company with safety limits
      const allReports: any[] = [];
      const maxItems = Math.min(localStorage.length, 100); // Safety limit
      let processedItems = 0;

      for (let i = 0; i < maxItems; i++) {
        try {
          const key = localStorage.key(i);
          if (!key) continue;

          if (key.startsWith(`reports_generated_html_${currentCompany.id}`)) {
            const data = localStorage.getItem(key);
            if (data) {
              try {
                const reportData = JSON.parse(data);
                allReports.push({
                  ...reportData,
                  storageKey: key
                });
                processedItems++;

                // Limit to 10 most recent reports to prevent performance issues
                if (processedItems >= 10) break;
              } catch (e) {
                console.error('Failed to parse report data:', e);
                // Remove corrupted data
                localStorage.removeItem(key);
              }
            }
          }
        } catch (e) {
          console.error('Error processing localStorage item:', e);
          continue;
        }
      }

      // Sort by generation time (newest first)
      allReports.sort((a, b) => {
        try {
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
        } catch {
          return 0;
        }
      });

      setSavedReports(allReports);
      console.log(`Loaded ${allReports.length} saved reports`);
    } catch (error) {
      console.error('Error loading saved reports:', error);
      setSavedReports([]); // Set empty array on error
    }
  }, [currentCompany?.id]);

  // Load company details on component mount
  useEffect(() => {
    if (currentCompany?.id) {
      loadCompanyDetails();
      loadAvailableChapters();
      loadAvailableThemes();
      loadSavedReports();
    }
  }, [currentCompany?.id, loadSavedReports]);

  const loadAvailableThemes = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/reports/themes'));
      if (response.ok) {
        const data = await response.json();
        setAvailableThemes(data);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const loadAvailableChapters = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/reports/chapters'));
      if (response.ok) {
        const data = await response.json();
        setAvailableChapters(data);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapterId)
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const isChapterSelected = (chapterId: string) => selectedChapters.includes(chapterId);

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
      // Call backend API to generate PDF report with selected chapters and theme
      const chaptersParam = selectedChapters.join(',');
      const params = new URLSearchParams({
        company_id: currentCompany?.id.toString(),
        as_of_date: asOfDate,
        fy_date: fyDate,
        chapters: chaptersParam,
        theme: selectedTheme,
        heading_font: headingFont,
        body_font: bodyFont,
      });

      // Add custom colors if provided
      if (customPrimaryColor) params.append('custom_primary_color', customPrimaryColor);
      if (customAccentColor) params.append('custom_accent_color', customAccentColor);

      const response = await fetch(
        buildApiUrl(`/api/reports/generate?${params.toString()}`),
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
      // Call backend API to generate HTML report with selected chapters and theme
      const chaptersParam = selectedChapters.join(',');
      const params = new URLSearchParams({
        company_id: currentCompany?.id.toString(),
        as_of_date: asOfDate,
        fy_date: fyDate,
        chapters: chaptersParam,
        theme: selectedTheme,
        heading_font: headingFont,
        body_font: bodyFont,
      });

      // Add custom colors if provided
      if (customPrimaryColor) params.append('custom_primary_color', customPrimaryColor);
      if (customAccentColor) params.append('custom_accent_color', customAccentColor);

      const response = await fetch(
        buildApiUrl(`/api/reports/generate-html?${params.toString()}`),
        {
          method: 'GET',
        }
      );

      if (response.ok) {
        // Display HTML report in dialog instead of popup
        const htmlContent = await response.text();
        setHtmlReportContent(htmlContent);
        setShowHtmlReport(true);

        // Auto-save to localStorage for editor
        try {
          const storageKey = `reports_generated_html_${currentCompany?.id}_${Date.now()}`;
          const reportData = {
            html: htmlContent,
            config: {
              asOfDate,
              fyDate,
              selectedTheme,
              headingFont,
              bodyFont,
              selectedChapters
            },
            generatedAt: new Date().toISOString()
          };
          localStorage.setItem(storageKey, JSON.stringify(reportData));
          console.log('Report auto-saved to localStorage:', storageKey);

          // Reload saved reports list
          loadSavedReports();
        } catch (error) {
          console.error('Failed to save report:', error);
        }

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

  const printToPdf = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // Trigger browser print dialog
        iframeRef.current.contentWindow.print();

        toast.info("Printing dialog opened. Select 'Save as PDF' to download.");
      } catch (error) {
        console.error("Error opening print dialog:", error);
        toast.error("Failed to open print dialog. Please try using Ctrl/Cmd+P manually.");
      }
    }
  };

  const openInEditor = (html?: string) => {
    // Store the HTML content in sessionStorage for the editor to retrieve
    const htmlToOpen = html || htmlReportContent;
    if (htmlToOpen) {
      sessionStorage.setItem('editorImportHtml', htmlToOpen);
      sessionStorage.setItem('editorImportSource', 'report');
      sessionStorage.setItem('editorImportConfig', JSON.stringify({
        asOfDate,
        fyDate,
        selectedTheme,
        selectedChapters,
        companyData: companyDetails
      }));

      // Close the dialog and navigate to editor
      setShowHtmlReport(false);
      navigate('/reports/editor');

      toast.success("Report opened in editor. You can now customize it!");
    }
  };

  const deleteSavedReport = (storageKey: string) => {
    localStorage.removeItem(storageKey);
    loadSavedReports(); // Reload the list
    toast.success("Report deleted");
  };

  const openSavedReportInEditor = (report: any) => {
    sessionStorage.setItem('editorImportHtml', report.html);
    sessionStorage.setItem('editorImportSource', 'saved_report');
    sessionStorage.setItem('editorImportConfig', JSON.stringify(report.config));

    navigate('/reports/editor');
    toast.success("Saved report opened in editor");
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

        {/* Saved Reports */}
        {savedReports.length > 0 && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Saved Reports ({savedReports.length})
              </CardTitle>
              <CardDescription>
                Your previously generated reports - click to edit or delete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedReports.map((report, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">
                          {report.config?.fyDate || 'N/A'} - {report.config?.selectedTheme || 'Default'} Theme
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Generated: {new Date(report.generatedAt).toLocaleString()} •
                        Chapters: {report.config?.selectedChapters?.length || 0}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openSavedReportInEditor(report)}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSavedReport(report.storageKey)}
                        className="flex items-center gap-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Dates Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate {reportType.toUpperCase()} Report</DialogTitle>
              <DialogDescription>
                Choose the key dates and customize your {reportType === 'pdf' ? 'PDF' : 'HTML'} ESG report.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asOfDate">As Of Date (DD/MM/YYYY)</Label>
                  <Input
                    id="asOfDate"
                    placeholder="30/08/2025"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fyDate">Financial Year (YYYY)</Label>
                  <Input
                    id="fyDate"
                    placeholder="2025"
                    value={fyDate}
                    onChange={(e) => setFyDate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                <p><strong>As Of Date:</strong> Report publication date</p>
                <p><strong>Financial Year:</strong> Main reporting year</p>
              </div>

              {/* Chapter Selection */}
              {availableChapters && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Customize Report Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Select which chapters to include in your report
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {Object.entries(availableChapters.available_chapters).map(([id, name]) => (
                      <div key={id} className="flex items-center space-x-2 p-2 rounded hover:bg-secondary/50">
                        <input
                          type="checkbox"
                          id={id}
                          checked={isChapterSelected(id)}
                          onChange={() => toggleChapter(id)}
                          className="w-4 h-4 rounded border-gray-300 flex-shrink-0"
                        />
                        <label
                          htmlFor={id}
                          className="text-sm cursor-pointer flex-1 truncate"
                          title={name as string}
                        >
                          {name as string}
                        </label>
                        {availableChapters.default_chapters.includes(id) && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">Default</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedChapters.length} of {Object.keys(availableChapters.available_chapters).length} chapters selected
                  </p>
                </div>
              )}

              {/* Theme Customization - Only for HTML reports */}
              {reportType === 'html' && availableThemes && (
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-semibold">Customize Report Style</Label>
                  <p className="text-sm text-muted-foreground">
                    Personalize your report's appearance
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Theme Selection */}
                    <div className="space-y-1">
                      <Label htmlFor="theme" className="text-sm">Theme</Label>
                      <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                        <SelectTrigger id="theme" className="h-9">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(availableThemes.themes).map((theme: any) => (
                            <SelectItem key={theme.id} value={theme.id}>
                              <span className="mr-2">{theme.preview}</span>
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Selection - Compact */}
                    <div className="space-y-1">
                      <Label htmlFor="headingFont" className="text-sm">Fonts</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="headingFont" className="text-xs text-muted-foreground mb-1 block">标题 Heading</Label>
                          <Select value={headingFont} onValueChange={setHeadingFont}>
                            <SelectTrigger id="headingFont" className="h-9">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(availableThemes.fonts).map(([fontId, font]: [string, any]) => (
                                <SelectItem key={fontId} value={fontId}>
                                  {font.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="bodyFont" className="text-xs text-muted-foreground mb-1 block">正文 Body</Label>
                          <Select value={bodyFont} onValueChange={setBodyFont}>
                            <SelectTrigger id="bodyFont" className="h-9">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(availableThemes.fonts).map(([fontId, font]: [string, any]) => (
                                <SelectItem key={fontId} value={fontId}>
                                  {font.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Custom Colors - Compact */}
                    <div className="space-y-1">
                      <Label className="text-sm">Custom Colors</Label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="primaryColor" className="text-xs text-muted-foreground mb-1 block">主色 Primary</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              id="primaryColor"
                              type="color"
                              value={customPrimaryColor}
                              onChange={(e) => setCustomPrimaryColor(e.target.value)}
                              className="w-8 h-9 p-0.5 cursor-pointer rounded flex-shrink-0"
                              title="Primary color - Main headings and borders"
                            />
                            <Input
                              type="text"
                              placeholder="#1e40af"
                              value={customPrimaryColor}
                              onChange={(e) => setCustomPrimaryColor(e.target.value)}
                              className="flex-1 h-9 text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="accentColor" className="text-xs text-muted-foreground mb-1 block">强调色 Accent</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              id="accentColor"
                              type="color"
                              value={customAccentColor}
                              onChange={(e) => setCustomAccentColor(e.target.value)}
                              className="w-8 h-9 p-0.5 cursor-pointer rounded flex-shrink-0"
                              title="Accent color - Highlights and progress bars"
                            />
                            <Input
                              type="text"
                              placeholder="#3b82f6"
                              value={customAccentColor}
                              onChange={(e) => setCustomAccentColor(e.target.value)}
                              className="flex-1 h-9 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                <div>
                  <DialogTitle>ESG Sustainability Report</DialogTitle>
                  <DialogDescription>
                    Interactive HTML report preview
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={openInEditor}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit in Editor
                  </Button>
                  <Button
                    onClick={printToPdf}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => setShowHtmlReport(false)}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                {htmlReportContent && (
                  <iframe
                    ref={iframeRef}
                    srcDoc={htmlReportContent}
                    className="w-full h-full border-0"
                    title="ESG Report"
                  />
                )}
              </div>
              <div className="px-6 py-3 border-t bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 <strong>Tip:</strong> Click "Download PDF" and select "Save as PDF" in the print dialog.
                </p>
                <p className="text-xs text-muted-foreground">
                  ⚠️ <strong>Important:</strong> Uncheck "Headers and Footers" (页眉和页脚) in the print settings to remove dates, page numbers, and URL from your PDF.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </Layout>
  );
};

export default Reports;
