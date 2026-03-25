import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Table, Text, Palette, Settings, Plus, Trash2, FolderOpen, Sparkles, ArrowLeft, FileText
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
  type: "header" | "text" | "chart" | "table" | "image" | "html";
  content: string;
  htmlContent?: string; // Store raw HTML for html type
  style: React.CSSProperties;
  data?: any;
}

interface ReportTheme {
  components: ReportComponent[];
  theme: string;
  styles: Record<string, any>;
}

// HTML Renderer Component - Renders HTML with editable support
interface HtmlRendererProps {
  html: string;
  style?: React.CSSProperties;
  onChange?: (html: string) => void;
  isEditable?: boolean;
}

const HtmlRenderer: React.FC<HtmlRendererProps> = ({ html, style, onChange, isEditable = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHtml, setEditedHtml] = useState(html);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleBlur = () => {
    if (isEditing && onChange && contentRef.current) {
      const newHtml = contentRef.current.innerHTML;
      onChange(newHtml);
      setIsEditing(false);
    }
  };

  const handleDoubleClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  return (
    <div
      ref={contentRef}
      style={style}
      className={`${isEditable ? 'cursor-pointer hover:ring-2 hover:ring-blue-200' : ''} transition-all`}
      dangerouslySetInnerHTML={{ __html: isEditing ? editedHtml : html }}
      onDoubleClick={handleDoubleClick}
      onBlur={handleBlur}
      contentEditable={isEditing}
      suppressContentEditableWarning
    />
  );
};

// Editable Table Component
interface EditableTableProps {
  data: {
    headers: string[];
    rows: string[][];
  };
  onChange: (data: any) => void;
  style?: React.CSSProperties;
}

const EditableTable: React.FC<EditableTableProps> = ({ data, onChange, style }) => {
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; cellIndex: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCellClick = (rowIndex: number, cellIndex: number, value: string) => {
    setEditingCell({ rowIndex, cellIndex });
    setEditValue(value);
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const newData = { ...data };
      if (editingCell.rowIndex === -1) {
        // Editing header
        newData.headers[editingCell.cellIndex] = editValue;
      } else {
        // Editing row cell
        newData.rows[editingCell.rowIndex][editingCell.cellIndex] = editValue;
      }
      onChange(newData);
      setEditingCell(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const addRow = () => {
    const newRow = new Array(data.headers.length).fill('');
    onChange({
      ...data,
      rows: [...data.rows, newRow]
    });
  };

  const deleteRow = (rowIndex: number) => {
    const newRows = data.rows.filter((_, i) => i !== rowIndex);
    onChange({
      ...data,
      rows: newRows
    });
  };

  const addColumn = () => {
    const newHeader = `Column ${data.headers.length + 1}`;
    onChange({
      headers: [...data.headers, newHeader],
      rows: data.rows.map(row => [...row, ''])
    });
  };

  return (
    <div style={style} className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Table className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Click any cell to edit • Enter to save
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={addColumn}
            className="h-7 px-2 text-xs"
          >
            + Column
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={addRow}
            className="h-7 px-2 text-xs"
          >
            + Row
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-green-200">
              {data.headers.map((header, cellIndex) => (
                <th
                  key={cellIndex}
                  className="border border-green-100 py-2 px-3 bg-green-50 font-semibold text-gray-700 cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => handleCellClick(-1, cellIndex, header)}
                >
                  {editingCell?.rowIndex === -1 && editingCell?.cellIndex === cellIndex ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => handleCellChange(e.target.value)}
                      onBlur={handleCellBlur}
                      onKeyDown={handleKeyPress}
                      className="w-full bg-white border border-green-300 rounded px-1 py-0.5 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span className="flex items-center justify-between">
                      {header}
                      <span className="ml-2 text-xs text-gray-400">✏️</span>
                    </span>
                  )}
                </th>
              ))}
              <th className="border border-green-100 py-2 px-2 bg-green-50 w-10">
                <span className="text-xs text-gray-400">#</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-green-100 hover:bg-green-50/50">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-green-100 py-2 px-3 cursor-pointer hover:bg-white transition-colors"
                    onClick={() => handleCellClick(rowIndex, cellIndex, cell)}
                  >
                    {editingCell?.rowIndex === rowIndex && editingCell?.cellIndex === cellIndex ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => handleCellChange(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-white border border-green-300 rounded px-1 py-0.5 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span>{cell || <span className="text-gray-300">Click to edit</span>}</span>
                    )}
                  </td>
                ))}
                <td className="border border-green-100 py-2 px-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRow(rowIndex)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.rows.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No rows yet. Click "+ Row" to add data.
        </div>
      )}
    </div>
  );
};

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
  },
  html: {
    id: "html",
    type: "html",
    content: "Custom HTML Content",
    htmlContent: `<div style="padding: 20px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">Custom HTML Section</h3>
      <p style="margin: 0; color: #6b7280;">Double-click to edit this HTML content</p>
    </div>`,
    style: { minHeight: "150px" }
  }
};

const ReportEditor = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [componentsPerPage] = useState(6);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const importedTaskIdRef = useRef<string | null>(null); // Track which task has been imported

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
      } else {
        // Try to restore from localStorage (auto-save)
        restoreFromStorage();
      }
    }
  }, [currentCompany?.id]);

  // Load report from navigation state (when clicking Edit button from Reports page)
  useEffect(() => {
    if (location.state?.taskId) {
      const currentTaskId = location.state.taskId;

      // Only import if this is a different task than the one already imported
      if (importedTaskIdRef.current === currentTaskId) {
        console.log('⏭️ Skipping import, same task already loaded:', currentTaskId);
        return;
      }

      console.log('📝 Loading report from navigation state:', location.state);

      // First, check if there's a more recent local save
      const storageKey = `editor_draft_${currentCompany?.id}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.lastSaved && data.components.length > 0) {
            const savedTime = new Date(data.lastSaved).getTime();
            const now = Date.now();
            // If saved within last 10 minutes, prefer local save
            if (now - savedTime < 10 * 60 * 1000) {
              console.log('✅ Found recent local save, restoring:', new Date(data.lastSaved));
              setComponents(data.components);
              setCurrentPage(data.currentPage || 1);
              setImportedFromReports(data.importedFromReports || false);
              if (data.lastSaved) {
                setLastSavedTime(new Date(data.lastSaved));
              }
              // Update layouts
              const newLayouts = data.components.map((comp: ReportComponent, i: number) => ({
                i: comp.id,
                x: (i % 2) * 6,
                y: Math.floor(i / 2) * 4,
                w: 6,
                h: comp.type === 'chart' || comp.type === 'table' ? 6 : 4,
                minW: 3,
                minH: 2
              }));
              setLayouts({ lg: newLayouts });
              importedTaskIdRef.current = currentTaskId;
              toast.success('Restored your recent edits');
              return;
            }
          }
        } catch (error) {
          console.error('Failed to restore local save:', error);
        }
      }

      // Check if there are unsaved changes
      if (hasUnsavedChanges && components.length > 0) {
        console.log('⚠️ Has unsaved changes, prompting user...');
        const shouldContinue = window.confirm(
          'You have unsaved changes. Do you want to discard them and load the new report?'
        );
        if (!shouldContinue) {
          console.log('❌ User cancelled, not loading new report');
          return;
        }
      }

      // Get the task data from localStorage
      const REPORTS_STORAGE_KEY = 'esg_report_tasks';
      const stored = localStorage.getItem(REPORTS_STORAGE_KEY);

      if (stored) {
        try {
          const tasks = JSON.parse(stored);
          const task = tasks.find((t: any) => t.id === currentTaskId);

          if (task && task.htmlContent) {
            console.log('✅ Found HTML content for task:', task.id);
            // Reset state before importing new report
            handleResetEditor();
            // Import the HTML content
            parseAndImportHtml(task.htmlContent);
            setImportedFromReports(true);
            // Record that we've imported this task
            importedTaskIdRef.current = currentTaskId;
            toast.success(`Loaded ${task.reportType.toUpperCase()} report for FY ${task.fyDate}`);
          } else {
            console.warn('⚠️ Task not found or no HTML content:', currentTaskId);
            toast.error('Report content not found');
          }
        } catch (error) {
          console.error('❌ Error loading report from localStorage:', error);
          toast.error('Failed to load report');
        }
      }
    }
  }, [location.state, hasUnsavedChanges, components]); // Re-run when location.state changes

  // Auto-save components when they change
  useEffect(() => {
    if (components.length > 0) {
      setHasUnsavedChanges(true);

      // Clear previous timer
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      // Set new timer for auto-save (debounce 2 seconds)
      autoSaveRef.current = setTimeout(() => {
        saveToStorage();
      }, 2000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [components]);

  // Save to localStorage
  const saveToStorage = () => {
    if (!currentCompany?.id) return;

    try {
      const storageKey = `editor_draft_${currentCompany.id}`;
      const data = {
        components,
        theme,
        currentPage,
        importedFromReports,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
      setLastSavedTime(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  };

  // Restore from localStorage
  const restoreFromStorage = () => {
    if (!currentCompany?.id) return;

    try {
      const storageKey = `editor_draft_${currentCompany.id}`;
      const savedData = localStorage.getItem(storageKey);

      if (savedData) {
        const data = JSON.parse(savedData);
        setComponents(data.components || []);
        setCurrentPage(data.currentPage || 1);
        setImportedFromReports(data.importedFromReports || false);

        if (data.lastSaved) {
          setLastSavedTime(new Date(data.lastSaved));
        }

        // Update layouts
        const newLayouts = (data.components || []).map((comp: ReportComponent, i: number) => ({
          i: comp.id,
          x: (i % 2) * 6,
          y: Math.floor(i / 2) * 4,
          w: 6,
          h: comp.type === 'chart' || comp.type === 'table' ? 6 : 4,
          minW: 3,
          minH: 2
        }));
        setLayouts({ lg: newLayouts });

        toast.success(`Restored draft from ${data.lastSaved ? new Date(data.lastSaved).toLocaleString() : 'previous session'}`);
      }
    } catch (error) {
      console.error('Failed to restore from storage:', error);
    }
  };

  // Clear storage
  const clearStorage = () => {
    if (!currentCompany?.id) return;

    try {
      const storageKey = `editor_draft_${currentCompany.id}`;
      localStorage.removeItem(storageKey);
      setLastSavedTime(null);
      toast.success('Draft cleared');
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  };

  const createNewReport = () => {
    if (!currentCompany?.id) return;

    // Clear localStorage
    const storageKey = `editor_draft_${currentCompany.id}`;
    localStorage.removeItem(storageKey);

    // Reset all state
    setComponents([]);
    setImportedFromReports(false);
    setCurrentPage(1);
    setLastSavedTime(null);
    setHasUnsavedChanges(false);
    setHistory([]);
    setHistoryIndex(0);
    importedTaskIdRef.current = null; // Reset imported task ID

    toast.success('New blank report created');
  };

  // Reset editor state before loading new report
  const handleResetEditor = () => {
    console.log('🔄 Resetting editor state...');
    setComponents([]);
    setImportedFromReports(false);
    setCurrentPage(1);
    setLastSavedTime(null);
    setHasUnsavedChanges(false);
    setHistory([]);
    setHistoryIndex(0);
    setSelectedId(null);
    setPreviewMode(false);
    // Don't reset importedTaskIdRef here - it will be set when new report loads
  };

  // Pagination
  const totalPages = Math.ceil(components.length / componentsPerPage);
  const indexOfLastComponent = currentPage * componentsPerPage;
  const indexOfFirstComponent = indexOfLastComponent - componentsPerPage;
  const currentComponents = components.slice(indexOfFirstComponent, indexOfLastComponent);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedId(null); // Clear selection when changing pages
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

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

    // Find the main content container
    const container = doc.querySelector('.container') || doc.body;

    // Process all direct children of the container
    Array.from(container.children).forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const tagName = htmlElement.tagName.toLowerCase();
      const classList = htmlElement.classList;
      const text = htmlElement.textContent || '';
      const innerHTML = htmlElement.innerHTML;

      // Skip if completely empty
      if (!text.trim() && !htmlElement.querySelector('img')) {
        console.log('Skipping empty element:', tagName, htmlElement.className);
        return;
      }

      // Get the outer HTML to preserve everything
      const outerHTML = htmlElement.outerHTML;

      // Determine component type
      let componentType: ReportComponent['type'] = 'html';
      let componentContent = text.substring(0, 100) || 'Content';
      let componentData: any = undefined;

      // Check if this is a simple text element
      if (tagName === 'h1') {
        componentType = 'header';
        componentContent = htmlElement.textContent?.trim() || 'Report Title';
      } else if (tagName === 'h2' || tagName === 'h3') {
        componentType = 'text';
        componentContent = htmlElement.textContent?.trim() || 'Section Title';
      } else if (tagName === 'p' && !innerHTML.includes('<') && htmlElement.textContent?.trim()) {
        // Simple paragraph without nested HTML
        componentType = 'text';
        componentContent = htmlElement.textContent?.trim() || 'Paragraph';
      } else if (tagName === 'table') {
        componentType = 'table';
        const table = htmlElement;
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '');
        const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
        );
        componentData = { headers, rows };
        componentContent = htmlElement.querySelector('h3')?.textContent?.trim() || 'Data Table';
      } else if (classList.contains('chart') || text.includes('Chart') || text.includes('Emissions')) {
        componentType = 'chart';
        componentContent = htmlElement.querySelector('h3')?.textContent?.trim() || text.substring(0, 50) || 'Chart';
      } else if (tagName === 'img' || htmlElement.querySelector('img')) {
        componentType = 'image';
        componentContent = htmlElement.querySelector('h3')?.textContent?.trim() || 'Image';
      } else {
        // For everything else, save as HTML to preserve all content
        componentType = 'html';
        componentContent = htmlElement.querySelector('h1, h2, h3')?.textContent?.trim() || text.substring(0, 100) || 'Section';
      }

      // Extract inline styles safely
      let componentStyle: React.CSSProperties = {
        fontSize: '16px',
        color: '#333',
        fontWeight: 'normal',
        minHeight: componentType === 'chart' || componentType === 'table' || componentType === 'html' ? '200px' : undefined
      };

      // Try to get computed styles, with fallback
      try {
        const computedStyle = window.getComputedStyle(htmlElement);
        componentStyle = {
          fontSize: computedStyle.fontSize || '16px',
          color: computedStyle.color || '#333',
          fontWeight: computedStyle.fontWeight || 'normal',
          minHeight: componentType === 'chart' || componentType === 'table' || componentType === 'html' ? '200px' : undefined,
          backgroundColor: htmlElement.style.backgroundColor || undefined,
          padding: htmlElement.style.padding || undefined,
          margin: htmlElement.style.margin || undefined,
          borderRadius: htmlElement.style.borderRadius || undefined
        };
      } catch (e) {
        console.warn('Could not get computed styles, using defaults:', e);
      }

      // Create component
      const newComponent: ReportComponent = {
        id: `imported_${Date.now()}_${componentIndex++}`,
        type: componentType,
        content: componentContent,
        style: componentStyle,
        data: componentData
      };

      // For HTML type, store the raw HTML
      if (componentType === 'html') {
        newComponent.htmlContent = outerHTML;
      }

      importedComponents.push(newComponent);
      console.log('Imported component:', componentType, componentContent.substring(0, 30));
    });

    console.log(`Total components imported: ${importedComponents.length}`);

    // If no components found, add a default header
    if (importedComponents.length === 0) {
      importedComponents.push({
        id: `imported_${Date.now()}_0`,
        type: 'header',
        content: 'Imported Report',
        style: { fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }
      });
    }

    // Store the complete original HTML in the first component
    if (importedComponents.length > 0) {
      importedComponents[0].originalHtml = htmlContent;
      console.log('✓ Complete original HTML stored in first component');
    }

    // Set the imported components and flag with error handling
    try {
      setComponents(importedComponents);
      setImportedFromReports(true);
    } catch (error) {
      console.error('Error setting components:', error);
      toast.error('Failed to import report. Please try again.');
      return;
    }

    // Update layouts with proper positions
    try {
      const newLayouts = importedComponents.map((comp, i) => ({
        i: comp.id,
        x: (i % 2) * 6,
        y: Math.floor(i / 2) * 4,
        w: 6,
        h: comp.type === 'chart' || comp.type === 'table' || comp.type === 'html' ? 6 : 4,
        minW: 3,
        minH: 2
      }));
      setLayouts({ lg: newLayouts });
    } catch (error) {
      console.error('Error setting layouts:', error);
    }

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

  // Get the original HTML if available (for imported reports), otherwise generate new HTML
  const getDisplayHtml = () => {
    // For imported reports, use the original complete HTML
    if (importedFromReports && components.length > 0 && components[0].originalHtml) {
      // Simply return the original HTML without any modifications
      return components[0].originalHtml;
    }
    // Otherwise, generate HTML from components
    return generateHtml();
  };

  // Generate HTML from current state
  const generateHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG Sustainability Report</title>
    <style>
        /* Scoped styles - only affect .report-preview-container */
        .report-preview-container * { margin: 0; padding: 0; box-sizing: border-box; }
        .report-preview-container {
            font-family: ${theme.font};
            background-color: ${theme.backgroundColor};
            color: #333;
            padding: 40px;
        }
        .report-preview-container .container { max-width: 1200px; margin: 0 auto; }
        .report-preview-container .component { margin-bottom: 20px; }
        .report-preview-container .header { font-size: 32px; font-weight: bold; color: ${theme.primaryColor}; }
        .report-preview-container .title { font-size: 24px; font-weight: 600; color: ${theme.primaryColor}; }
        .report-preview-container .text { font-size: 16px; line-height: 1.6; color: #666; }
        .report-preview-container .chart { min-height: 300px; background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .report-preview-container .table { min-height: 200px; background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .report-preview-container .image { min-height: 200px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="report-preview-container">
        <div class="container">
            ${components.map(comp => `
                <div class="component ${comp.type}">
                    ${renderComponentContent(comp)}
                </div>
            `).join('')}
        </div>
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
      case "html":
        // Return original HTML content
        return comp.htmlContent || comp.content;
      case "chart":
        return `
          <div class="chart" style="min-height: 300px; background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%); border-radius: 8px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <span style="font-size: 24px;">📊</span>
              <h3 style="margin: 0; color: #1e40af;">${comp.content}</h3>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #4b5563; width: 80px;">Scope 1</span>
                <div style="flex: 1; height: 16px; background: white; border-radius: 8px; overflow: hidden;">
                  <div style="height: 100%; background: #3b82f6; width: 65%;"></div>
                </div>
                <span style="font-size: 12px; color: #4b5563;">65%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #4b5563; width: 80px;">Scope 2</span>
                <div style="flex: 1; height: 16px; background: white; border-radius: 8px; overflow: hidden;">
                  <div style="height: 100%; background: #6366f1; width: 45%;"></div>
                </div>
                <span style="font-size: 12px; color: #4b5563;">45%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; color: #4b5563; width: 80px;">Scope 3</span>
                <div style="flex: 1; height: 16px; background: white; border-radius: 8px; overflow: hidden;">
                  <div style="height: 100%; background: #8b5cf6; width: 80%;"></div>
                </div>
                <span style="font-size: 12px; color: #4b5563;">80%</span>
              </div>
            </div>
          </div>
        `;
      case "table":
        // Get table data from component
        const tableData = comp.data || {
          headers: ["Category", "Value", "Unit"],
          rows: [
            ["Total Emissions", "1,234", "tCO₂e"],
            ["Revenue", "5.6", "M HKD"],
            ["Intensity", "0.22", "tCO₂e/M HKD"]
          ]
        };

        return `
          <div class="table" style="min-height: 200px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
              <span style="font-size: 24px;">📋</span>
              <h3 style="margin: 0; color: #166534;">${comp.content}</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #86efac;">
                  ${tableData.headers.map((h: string) =>
                    `<th style="text-align: left; padding: 8px; color: #14532d; font-weight: 600;">${h}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableData.rows.map((row: string[]) =>
                  `<tr style="border-bottom: 1px solid #bbf7d0;">
                    ${row.map((cell: string) =>
                      `<td style="padding: 8px;">${cell}</td>`
                    ).join('')}
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>
        `;
      case "image":
        return `
          <div class="image" style="min-height: 200px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px;">
            <span style="font-size: 48px;">🖼️</span>
            <h3 style="margin: 0; color: #7c3aed;">${comp.content}</h3>
          </div>
        `;
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

    // Parse component content for structured data
    const getComponentData = () => {
      if (comp.data) return comp.data;

      // Try to parse JSON content
      try {
        return JSON.parse(comp.content);
      } catch {
        return null;
      }
    };

    const componentData = getComponentData();

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
      case "html":
        // Render HTML directly with editable support
        return (
          <HtmlRenderer
            html={comp.htmlContent || comp.content}
            style={baseStyle}
            onChange={(newHtml) => updateComponent(comp.id, { htmlContent: newHtml })}
            isEditable={true}
          />
        );
      case "chart":
        return (
          <div style={baseStyle} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">{comp.content}</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Scope 1</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-xs text-gray-600">65%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Scope 2</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-xs text-gray-600">45%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-20">Scope 3</span>
                <div className="flex-1 h-4 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <span className="text-xs text-gray-600">80%</span>
              </div>
            </div>
          </div>
        );
      case "table":
        // Check if content has table data structure
        const tableData = componentData || {
          headers: ["Category", "Value", "Unit"],
          rows: [
            ["Total Emissions", "1,234", "tCO₂e"],
            ["Revenue", "5.6", "M HKD"],
            ["Intensity", "0.22", "tCO₂e/M HKD"]
          ]
        };

        return (
          <EditableTable
            data={tableData}
            onChange={(newData) => updateComponent(comp.id, { data: newData })}
            style={baseStyle}
          />
        );
      case "image":
        return (
          <div style={baseStyle} className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <Image className="h-12 w-12 mb-3 text-purple-500" />
            <h3 className="text-base font-semibold text-gray-800">{comp.content}</h3>
            <p className="text-sm text-gray-600 mt-1">Image placeholder - Click to upload</p>
          </div>
        );
      default:
        return <p style={baseStyle}>{comp.content}</p>;
    }
  };

  return (
    <Layout>
      <style>{`
        /* Fix: Prevent injected HTML styles from affecting the app */
        .html-renderer-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        }

        /* Override any body styles that might be in injected HTML */
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        }
      `}</style>
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
            <div className="flex items-center gap-3 mb-2">
              <p className="text-muted-foreground">
                {importedFromReports
                  ? `Customize your ESG report (${components.length} components imported)`
                  : 'Drag, drop, and customize your ESG report'}
              </p>
              {lastSavedTime && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Saved {lastSavedTime.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                  Saving...
                </span>
              )}
            </div>
            {importedFromReports && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                <Sparkles className="h-3 w-3" />
                Report imported from generator - Edit content and export
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={createNewReport}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
            <Button variant="outline" onClick={saveToStorage} title="Quick save (Ctrl+S)">
              <Save className="h-4 w-4" />
            </Button>
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
            <Button onClick={saveToStorage}>
              <Save className="h-4 w-4 mr-2" />
              Save Now
            </Button>
          </div>
        </div>

        {/* Report View - Display imported or generated report */}
        {/* Edit/Preview Mode - Always show, editable based on mode */}
        <Card>
          <CardContent className="p-8">
            {components.length === 0 ? (
              // Empty state
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <FileText className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Report Content</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  {importedFromReports
                    ? 'The imported report has no content. Try generating a new report from the Reports page.'
                    : 'Start by generating a report from the Reports page, or create a new blank report.'}
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => navigate('/reports')}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Go to Reports
                  </Button>
                  {!importedFromReports && (
                    <Button variant="outline" onClick={createNewReport}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Blank Report
                    </Button>
                  )}
                </div>
              </div>
            ) : previewMode ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: getDisplayHtml()
                }}
              />
            ) : (
              <div
                contentEditable={true}
                suppressContentEditableWarning
                className="min-h-[400px] outline-none html-renderer-container"
                onBlur={(e) => {
                  if (components.length > 0 && importedFromReports) {
                    const newHtml = e.target.innerHTML;
                    const updatedComponents = [...components];
                    updatedComponents[0].originalHtml = newHtml;
                    setComponents(updatedComponents);

                    const parser = new DOMParser();
                    const doc = parser.parseFromString(newHtml, 'text/html');
                    const container = doc.querySelector('.container') || doc.body;
                    const elements = Array.from(container.children);

                    elements.forEach((el, i) => {
                      if (updatedComponents[i]) {
                        updatedComponents[i].htmlContent = el.outerHTML;
                      }
                    });

                    setComponents(updatedComponents);
                    setHasUnsavedChanges(true);
                  }
                }}
                dangerouslySetInnerHTML={{
                  __html: getDisplayHtml()
                }}
              />
            )}
            {!previewMode && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>💡 Click any content to edit • Changes are auto-saved</p>
              </div>
            )}
          </CardContent>
        </Card>
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
