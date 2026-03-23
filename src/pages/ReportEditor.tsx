import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import {
  Eye, Download, Save, Undo, Redo, Type, Image, BarChart3,
  Table, Text, Palette, Settings, Plus, Trash2, FolderOpen, Sparkles, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";
import { buildApiUrl } from "@/lib/api";
import { Responsive as ResponsiveGridLayout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Component types
interface ReportComponent {
  id: string;
  type: "header" | "text" | "chart" | "table" | "image";
  content: string;
  style: React.CSSProperties;
  data?: any;
}

interface ReportTheme {
  components: ReportComponent[];
  theme: string;
  styles: Record<string, any>;
}

// Sortable component wrapper
function SortableComponent({
  id,
  children,
  onEdit,
  onDelete,
  isSelected,
  onSelect
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={() => onSelect(id)}
        className={`
          relative p-4 border-2 rounded-lg cursor-move transition-all
          ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        {/* Hover actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(id); }}
            className="p-1 bg-white rounded shadow hover:bg-blue-50"
            title="Edit"
          >
            <Settings className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            className="p-1 bg-white rounded shadow hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-red-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Component templates
const COMPONENT_TEMPLATES = {
  header: {
    id: "header",
    type: "header",
    content: "ESG Sustainability Report 2025",
    style: { fontSize: "32px", fontWeight: "bold", color: "#1e40af" }
  },
  title: {
    id: "title",
    type: "text",
    content: "Environmental Performance",
    style: { fontSize: "24px", fontWeight: "600", color: "#333" }
  },
  paragraph: {
    id: "paragraph",
    type: "text",
    content: "This report presents our company's environmental performance and sustainability initiatives for the fiscal year 2025.",
    style: { fontSize: "16px", lineHeight: "1.6", color: "#666" }
  },
  chart: {
    id: "chart",
    type: "chart",
    content: "Carbon Emissions Chart",
    style: { minHeight: "300px", background: "#f8f9fa", borderRadius: "8px" }
  },
  table: {
    id: "table",
    type: "table",
    content: "Emissions Data Table",
    style: { minHeight: "200px", background: "#f8f9fa", borderRadius: "8px" }
  },
  image: {
    id: "image",
    type: "image",
    content: "Company Logo",
    style: { minHeight: "200px", background: "#f3f4f6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }
  }
};

const ReportEditor = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const navigate = useNavigate();
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("components");
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [history, setHistory] = useState<ReportComponent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [importedFromReports, setImportedFromReports] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Layout state
  const [layouts, setLayouts] = useState<any>({
    lg: generateLayouts(components)
  });

  // Theme state
  const [theme, setTheme] = useState({
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    font: "Arial, sans-serif",
    backgroundColor: "#ffffff"
  });

  // Load saved templates and company data
  useEffect(() => {
    if (currentCompany?.id) {
      loadTemplates();
      loadCompanyData();

      // Check if HTML was imported from Reports page
      const importedHtml = sessionStorage.getItem('editorImportHtml');
      if (importedHtml) {
        parseAndImportHtml(importedHtml);
        // Clear the imported HTML from sessionStorage
        sessionStorage.removeItem('editorImportHtml');
      }
    }
  }, [currentCompany?.id]);

  // Save to history when components change
  useEffect(() => {
    if (components.length > 0) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push([...components]);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [components]);

  const loadTemplates = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/reports/templates'));
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadCompanyData = async () => {
    if (!currentCompany?.id) return;

    try {
      const response = await fetch(buildApiUrl(`/api/company-details/${currentCompany.id}`));
      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    }
  };

  const parseAndImportHtml = (htmlContent: string) => {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const importedComponents: ReportComponent[] = [];
    let componentIndex = 0;

    // Find all major sections in the HTML
    const container = doc.querySelector('.container') || doc.body;

    // Process child elements
    Array.from(container.children).forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const tagName = htmlElement.tagName.toLowerCase();
      const text = htmlElement.textContent || '';
      const style = window.getComputedStyle(htmlElement);

      // Skip empty elements
      if (!text.trim() && tagName !== 'img') return;

      let componentType: ReportComponent['type'] = 'text';
      let componentContent = text;

      // Detect component type based on HTML structure and content
      if (tagName === 'h1') {
        componentType = 'header';
        componentContent = htmlElement.textContent || 'Report Title';
      } else if (tagName === 'h2' || tagName === 'h3') {
        componentType = 'text';
        componentContent = htmlElement.textContent || 'Section Title';
      } else if (tagName === 'p') {
        componentType = 'text';
        componentContent = htmlElement.textContent || 'Paragraph content';
      } else if (htmlElement.querySelector('table')) {
        componentType = 'table';
        componentContent = 'Data Table';
      } else if (htmlElement.classList.contains('chart') || text.includes('Chart') || text.includes('Emissions')) {
        componentType = 'chart';
        componentContent = text.substring(0, 50) || 'Chart';
      } else if (tagName === 'img' || htmlElement.querySelector('img')) {
        componentType = 'image';
        componentContent = 'Image';
      }

      // Extract styles
      const componentStyle: React.CSSProperties = {
        fontSize: style.fontSize || '16px',
        color: style.color || '#333',
        fontWeight: style.fontWeight || 'normal',
        minHeight: componentType === 'chart' || componentType === 'table' ? '250px' : undefined
      };

      // Create component
      importedComponents.push({
        id: `imported_${Date.now()}_${componentIndex++}`,
        type: componentType,
        content: componentContent,
        style: componentStyle
      });
    });

    // If no components found, add a default header
    if (importedComponents.length === 0) {
      importedComponents.push({
        id: `imported_${Date.now()}_0`,
        type: 'header',
        content: 'Imported Report',
        style: { fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }
      });
    }

    // Set the imported components and flag
    setComponents(importedComponents);
    setImportedFromReports(true);

    // Update layouts
    const newLayouts = importedComponents.map((comp, i) => ({
      i: comp.id,
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: comp.type === 'chart' || comp.type === 'table' ? 6 : 4,
      minW: 3,
      minH: 2
    }));
    setLayouts({ lg: newLayouts });

    toast.success(`Imported ${importedComponents.length} components from report`);
  };

  // Generate initial layouts
  function generateLayouts(components: ReportComponent[]) {
    return components.map((comp, i) => ({
      i: comp.id,
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 4,
      w: 6,
      h: 4,
      minW: 3,
      minH: 2
    }));
  }

  // Add component
  const addComponent = (template: any) => {
    const newComponent: ReportComponent = {
      ...template,
      id: `${template.type}_${Date.now()}`
    };

    setComponents([...components, newComponent]);
    setLayouts({
      lg: [...layouts.lg, {
        i: newComponent.id,
        x: (components.length % 2) * 6,
        y: Math.floor(components.length / 2) * 4,
        w: 6,
        h: 4,
        minW: 3,
        minH: 2
      }]
    });

    toast.success(`Added ${template.type} component`);
  };

  // Delete component
  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    setLayouts({
      lg: layouts.lg.filter((l: any) => l.i !== id)
    });
    if (selectedId === id) setSelectedId(null);
  };

  // Update component content
  const updateComponent = (id: string, updates: Partial<ReportComponent>) => {
    setComponents(components.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Save template
  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/reports/templates'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          components: components,
          theme: theme
        })
      });

      if (response.ok) {
        toast.success("Template saved successfully!");
        setShowTemplateDialog(false);
        setTemplateName("");
        loadTemplates();
      } else {
        toast.error("Failed to save template");
      }
    } catch (error) {
      toast.error("Error saving template");
    } finally {
      setIsLoading(false);
    }
  };

  // Load template
  const loadTemplate = (template: any) => {
    setComponents(template.components || []);
    if (template.theme) {
      setTheme(template.theme);
    }
    toast.success(`Template "${template.name}" loaded`);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setComponents([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setComponents([...history[historyIndex + 1]]);
    }
  };

  // Insert company data placeholder
  const insertCompanyData = (dataType: string) => {
    const placeholders: Record<string, any> = {
      company_name: {
        id: `data_${Date.now()}`,
        type: "text",
        content: companyData?.company_name || "Company Name",
        style: { fontSize: "24px", fontWeight: "600", color: "#1e40af" }
      },
      emissions_summary: {
        id: `data_${Date.now()}`,
        type: "chart",
        content: "Emissions Summary Chart",
        style: { minHeight: "300px", background: "#f8f9fa", borderRadius: "8px" },
        data: { type: "emissions", source: "company" }
      },
      sustainability_targets: {
        id: `data_${Date.now()}`,
        type: "table",
        content: "Sustainability Targets",
        style: { minHeight: "250px", background: "#f8f9fa", borderRadius: "8px" },
        data: { type: "targets", source: "company" }
      }
    };

    const placeholder = placeholders[dataType];
    if (placeholder) {
      setComponents([...components, placeholder]);
      toast.success(`Added ${dataType} component`);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle layout change
  const handleLayoutChange = (layout: any) => {
    setLayouts({ lg: layout });
  };

  // Export HTML
  const exportHtml = async () => {
    const htmlContent = generateHtml();

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Report exported successfully!");
  };

  // Export PDF using backend API
  const exportPdf = async () => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }

    setIsLoading(true);
    try {
      const htmlContent = generateHtml();

      // Use Gotenberg/PDF service
      const response = await fetch(buildApiUrl('/api/reports/html-to-pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          filename: `custom-report-${Date.now()}.pdf`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `custom-report-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("PDF exported successfully!");
      } else {
        throw new Error("Failed to generate PDF");
      }
    } catch (error) {
      toast.error("Failed to export PDF");
      console.error("Error exporting PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate HTML from current state
  const generateHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom ESG Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${theme.font};
            background-color: ${theme.backgroundColor};
            color: #333;
            padding: 40px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .component { margin-bottom: 20px; }
        .header { font-size: 32px; font-weight: bold; color: ${theme.primaryColor}; }
        .title { font-size: 24px; font-weight: 600; color: ${theme.primaryColor}; }
        .text { font-size: 16px; line-height: 1.6; color: #666; }
        .chart { min-height: 300px; background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .table { min-height: 200px; background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .image { min-height: 200px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="container">
        ${components.map(comp => `
            <div class="component ${comp.type}">
                ${renderComponentContent(comp)}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  };

  const renderComponentContent = (comp: ReportComponent) => {
    switch (comp.type) {
      case "header":
        return `<h1 class="header">${comp.content}</h1>`;
      case "text":
        return comp.content.length > 50
          ? `<p class="text">${comp.content}</p>`
          : `<h2 class="title">${comp.content}</h2>`;
      case "chart":
        return `<div class="chart"><h3>📊 ${comp.content}</h3><p>Chart will be rendered here</p></div>`;
      case "table":
        return `<div class="table"><h3>📋 ${comp.content}</h3><p>Table data will be rendered here</p></div>`;
      case "image":
        return `<div class="image"><h3>🖼️ ${comp.content}</h3></div>`;
      default:
        return `<p>${comp.content}</p>`;
    }
  };

  // Render component in React for editor preview
  const renderComponentPreview = (comp: ReportComponent) => {
    const baseStyle = {
      ...comp.style,
      minHeight: comp.style?.minHeight || 'auto'
    };

    switch (comp.type) {
      case "header":
        return <h1 style={baseStyle}>{comp.content}</h1>;
      case "text":
        const isTitle = comp.content.length <= 50;
        return isTitle ? (
          <h2 style={baseStyle}>{comp.content}</h2>
        ) : (
          <p style={baseStyle}>{comp.content}</p>
        );
      case "chart":
        return (
          <div style={baseStyle} className="flex flex-col items-center justify-center p-4">
            <BarChart3 className="h-8 w-8 mb-2 text-blue-500" />
            <h3 className="text-sm font-medium">{comp.content}</h3>
            <p className="text-xs text-muted-foreground mt-1">Chart placeholder</p>
          </div>
        );
      case "table":
        return (
          <div style={baseStyle} className="flex flex-col items-center justify-center p-4">
            <Table className="h-8 w-8 mb-2 text-green-500" />
            <h3 className="text-sm font-medium">{comp.content}</h3>
            <p className="text-xs text-muted-foreground mt-1">Table placeholder</p>
          </div>
        );
      case "image":
        return (
          <div style={baseStyle} className="flex flex-col items-center justify-center p-4">
            <Image className="h-8 w-8 mb-2 text-purple-500" />
            <h3 className="text-sm font-medium">{comp.content}</h3>
            <p className="text-xs text-muted-foreground mt-1">Image placeholder</p>
          </div>
        );
      default:
        return <p style={baseStyle}>{comp.content}</p>;
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {importedFromReports && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Reports
                </Button>
              )}
              <h1 className="text-3xl font-bold">
                {importedFromReports ? 'Edit Generated Report' : 'Visual Report Editor'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {importedFromReports
                ? `Customize your ESG report (${components.length} components imported)`
                : 'Drag, drop, and customize your ESG report'}
            </p>
            {importedFromReports && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                <Sparkles className="h-3 w-3" />
                Report imported from generator - Edit content and export
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" onClick={exportHtml}>
              <Download className="h-4 w-4 mr-2" />
              HTML
            </Button>
            <Button variant="outline" onClick={exportPdf} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => setShowTemplateDialog(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {!previewMode && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Panel - Components */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Data Section */}
                {companyData && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Company Data
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertCompanyData('company_name')}
                        className="justify-start"
                      >
                        <Text className="h-4 w-4 mr-2" />
                        Company Name
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertCompanyData('emissions_summary')}
                        className="justify-start"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Emissions Chart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => insertCompanyData('sustainability_targets')}
                        className="justify-start"
                      >
                        <Table className="h-4 w-4 mr-2" />
                        Targets Table
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Label className="text-sm mb-2 block">Basic Components</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.header)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <Type className="h-6 w-6" />
                      <span className="text-xs">Header</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.title)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <Text className="h-6 w-6" />
                      <span className="text-xs">Title</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.paragraph)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <Type className="h-6 w-6" />
                      <span className="text-xs">Text</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.chart)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-xs">Chart</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.table)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <Table className="h-6 w-6" />
                      <span className="text-xs">Table</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addComponent(COMPONENT_TEMPLATES.image)}
                      className="h-20 flex flex-col gap-1"
                    >
                      <Image className="h-6 w-6" />
                      <span className="text-xs">Image</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Panel - Properties */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedId ? (
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="style">Style</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Input
                          value={components.find(c => c.id === selectedId)?.content || ""}
                          onChange={(e) => updateComponent(selectedId, { content: e.target.value })}
                          placeholder="Enter content..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Select
                          value={components.find(c => c.id === selectedId)?.style?.fontSize?.replace('px', '') || "16"}
                          onValueChange={(value) => updateComponent(selectedId, {
                            style: {
                              ...components.find(c => c.id === selectedId)?.style,
                              fontSize: `${value}px`
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="14">Small</SelectItem>
                            <SelectItem value="16">Normal</SelectItem>
                            <SelectItem value="18">Medium</SelectItem>
                            <SelectItem value="24">Large</SelectItem>
                            <SelectItem value="32">XLarge</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={components.find(c => c.id === selectedId)?.style?.color || "#000000"}
                            onChange={(e) => updateComponent(selectedId, {
                              style: {
                                ...components.find(c => c.id === selectedId)?.style,
                                color: e.target.value
                              }
                            })}
                            className="w-12 h-10"
                          />
                          <Input
                            type="text"
                            value={components.find(c => c.id === selectedId)?.style?.color || "#000000"}
                            onChange={(e) => updateComponent(selectedId, {
                              style: {
                                ...components.find(c => c.id === selectedId)?.style,
                                color: e.target.value
                              }
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Select a component to edit its properties
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Center Panel - Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Canvas</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Undo className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Redo className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {components.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No components yet</p>
                    <p className="text-sm">Add components from the left panel to start building your report</p>
                  </div>
                ) : (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <ResponsiveGridLayout
                      className="layout"
                      layouts={layouts}
                      onLayoutChange={handleLayoutChange}
                      isDraggable={!previewMode}
                      isResizable={!previewMode}
                      useCSSTransform={true}
                    >
                      {components.map((comp) => (
                        <div
                          key={comp.id}
                          onClick={() => setSelectedId(comp.id)}
                          className={`bg-white rounded-lg shadow-sm p-4 border cursor-pointer transition-all ${
                            selectedId === comp.id
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {renderComponentPreview(comp)}
                        </div>
                      ))}
                    </ResponsiveGridLayout>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Mode */}
        {previewMode && (
          <Card>
            <CardContent className="p-8">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateHtml()
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Template Management Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report Templates</DialogTitle>
            <DialogDescription>
              Save your current layout or load a previously saved template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Save Template Section */}
            <div className="space-y-2">
              <Label>Save Current Layout</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Template name..."
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveTemplate()}
                />
                <Button onClick={saveTemplate} disabled={isLoading || !templateName.trim()}>
                  Save
                </Button>
              </div>
            </div>

            {/* Load Template Section */}
            {templates.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <Label>Load Template</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {templates.map((template: any) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-secondary/50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {template.components?.length || 0} components
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadTemplate(template)}
                      >
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ReportEditor;
