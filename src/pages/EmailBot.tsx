import { useState, useCallback, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-api";
import { toast } from "sonner";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Mail, Send, Users, BarChart3, FileText, Plus, Trash2,
  Eye, RefreshCw, Loader2, CheckCircle2, Clock, AlertCircle,
  Brain, ChevronDown, ChevronUp,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname.includes('vercel.app') ? 'https://esg-backend-one.vercel.app' : 'http://localhost:8000');

async function apiCall(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

interface Contact {
  id: number; name: string; email: string; department?: string;
  position?: string; notes?: string; is_active: boolean;
}
interface Campaign {
  id: number; name: string; description?: string; subject: string;
  email_body: string; status: string; categories?: string[];
  questions?: any[]; sent_at?: string; created_at: string;
}
interface EmailResponse {
  id: number; raw_content?: string; parsed_data?: any;
  is_analyzed: boolean; analysis_result?: any; response_type: string;
  received_at: string; email_contacts?: { name: string; email: string };
  email_campaigns?: { name: string };
}
interface AnalysisReport {
  id: number; title: string; summary?: string; detailed_analysis?: any;
  total_responses: number; response_rate: number; status: string;
  created_at: string;
}

export default function EmailBot() {
  const { getCurrentCompany } = useAuth();
  const company = getCurrentCompany();
  const companyId = company?.id;

  if (!companyId) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please log in to use Email Bot.</p>
        </div>
      </Layout>
    );
  }

  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [responses, setResponses] = useState<EmailResponse[]>([]);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loading, setLoading] = useState(false);

  // Contact form
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', department: '', position: '', notes: '' });

  // Campaign form
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '', description: '', subject: '', email_body: '', categories: '',
    questions: [] as any[],
  });
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'text', options: '' });

  // Send dialog
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

  // Report dialog
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCampaignId, setReportCampaignId] = useState<number | null>(null);

  // Analysis detail
  const [expandedResponse, setExpandedResponse] = useState<number | null>(null);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/email-bot/contacts?company_id=${companyId}`);
      setContacts(data || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [companyId]);

  const fetchCampaigns = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/email-bot/campaigns?company_id=${companyId}`);
      setCampaigns(data || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [companyId]);

  const fetchResponses = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/email-bot/responses?company_id=${companyId}`);
      setResponses(data || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [companyId]);

  const fetchReports = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const data = await apiCall(`/api/email-bot/analysis-reports?company_id=${companyId}`);
      setReports(data || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchContacts();
      fetchCampaigns();
      fetchResponses();
      fetchReports();
    }
  }, [companyId, fetchContacts, fetchCampaigns, fetchResponses, fetchReports]);

  // --- Contact CRUD ---
  const createContact = async () => {
    if (!companyId) return;
    try {
      await apiCall('/api/email-bot/contacts', {
        method: 'POST',
        body: JSON.stringify({ ...contactForm, company_id: companyId }),
      });
      toast.success('Contact added');
      setShowContactDialog(false);
      setContactForm({ name: '', email: '', department: '', position: '', notes: '' });
      fetchContacts();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteContact = async (id: number) => {
    try {
      await apiCall(`/api/email-bot/contacts/${id}`, { method: 'DELETE' });
      toast.success('Contact deleted');
      fetchContacts();
    } catch (e: any) { toast.error(e.message); }
  };

  // --- Campaign CRUD ---
  const addQuestion = () => {
    if (!newQuestion.question) return;
    const q: any = { question: newQuestion.question, type: newQuestion.type, id: `q_${Date.now()}` };
    if (newQuestion.type === 'select' && newQuestion.options) {
      q.options = newQuestion.options.split(',').map(o => o.trim());
    }
    setCampaignForm(prev => ({ ...prev, questions: [...prev.questions, q] }));
    setNewQuestion({ question: '', type: 'text', options: '' });
  };

  const removeQuestion = (idx: number) => {
    setCampaignForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== idx) }));
  };

  const createCampaign = async () => {
    if (!companyId) return;
    try {
      const categories = campaignForm.categories
        ? campaignForm.categories.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      await apiCall('/api/email-bot/campaigns', {
        method: 'POST',
        body: JSON.stringify({ ...campaignForm, company_id: companyId, categories }),
      });
      toast.success('Campaign created');
      setShowCampaignDialog(false);
      setCampaignForm({ name: '', description: '', subject: '', email_body: '', categories: '', questions: [] });
      fetchCampaigns();
    } catch (e: any) { toast.error(e.message); }
  };

  const deleteCampaign = async (id: number) => {
    try {
      await apiCall(`/api/email-bot/campaigns/${id}`, { method: 'DELETE' });
      toast.success('Campaign deleted');
      fetchCampaigns();
    } catch (e: any) { toast.error(e.message); }
  };

  // --- Send Campaign ---
  const openSendDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setSelectedContactIds([]);
    setShowSendDialog(true);
  };

  const toggleContactSelection = (id: number) => {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sendCampaign = async () => {
    if (!selectedCampaign || selectedContactIds.length === 0) {
      toast.error('Select at least one contact');
      return;
    }
    try {
      const result = await apiCall('/api/email-bot/send', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          contact_ids: selectedContactIds,
        }),
      });
      toast.success(`Sent ${result.sent} emails, ${result.failed} failed`);
      setShowSendDialog(false);
      fetchCampaigns();
    } catch (e: any) { toast.error(e.message); }
  };

  // --- Check Replies ---
  const checkReplies = async () => {
    if (!companyId) return;
    try {
      const result = await apiCall(`/api/email-bot/check-replies?company_id=${companyId}`, { method: 'POST' });
      toast.success(result.checked ? `Found ${result.new_replies} new replies` : result.message);
      fetchResponses();
    } catch (e: any) { toast.error(e.message); }
  };

  // --- Analyze ---
  const analyzeResponse = async (id: number) => {
    try {
      await apiCall(`/api/email-bot/responses/${id}/analyze`, { method: 'POST' });
      toast.success('Analysis complete');
      fetchResponses();
    } catch (e: any) { toast.error(e.message); }
  };

  const generateReport = async () => {
    if (!companyId) return;
    try {
      await apiCall('/api/email-bot/analysis-reports', {
        method: 'POST',
        body: JSON.stringify({
          company_id: companyId,
          campaign_id: reportCampaignId,
          title: reportTitle || 'ESG Data Analysis Report',
        }),
      });
      toast.success('Report generated');
      setShowReportDialog(false);
      setReportTitle('');
      setReportCampaignId(null);
      fetchReports();
    } catch (e: any) { toast.error(e.message); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'sent': case 'delivered': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sending': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'failed': case 'bounced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderJson = (data: any) => {
    if (!data) return null;
    try {
      const obj = typeof data === 'string' ? JSON.parse(data) : data;
      return (
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-60 whitespace-pre-wrap">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <p className="text-sm text-muted-foreground">{String(data)}</p>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bot className="h-8 w-8 text-blue-600" /> Email Bot
            </h1>
            <p className="text-muted-foreground mt-1">
              Automate ESG data collection via email surveys
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={checkReplies}>
              <RefreshCw className="h-4 w-4 mr-1" /> Check Replies
            </Button>
            <Button onClick={() => setShowReportDialog(true)}>
              <Brain className="h-4 w-4 mr-1" /> Generate Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{contacts.filter(c => c.is_active).length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Campaigns</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{campaigns.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Responses</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{responses.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{reports.length}</p></CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contacts"><Users className="h-4 w-4 mr-1" /> Contacts</TabsTrigger>
            <TabsTrigger value="campaigns"><Mail className="h-4 w-4 mr-1" /> Campaigns</TabsTrigger>
            <TabsTrigger value="responses"><FileText className="h-4 w-4 mr-1" /> Responses</TabsTrigger>
            <TabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-1" /> Reports</TabsTrigger>
          </TabsList>

          {/* === Contacts Tab === */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Contact</DialogTitle>
                    <DialogDescription>Add a new contact for email campaigns.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Name *</Label><Input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><Label>Email *</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} /></div>
                    <div><Label>Department</Label><Input value={contactForm.department} onChange={e => setContactForm(p => ({ ...p, department: e.target.value }))} /></div>
                    <div><Label>Position</Label><Input value={contactForm.position} onChange={e => setContactForm(p => ({ ...p, position: e.target.value }))} /></div>
                    <div><Label>Notes</Label><Textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))} /></div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
                    <Button onClick={createContact} disabled={!contactForm.name || !contactForm.email}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No contacts yet. Add your first contact.</TableCell></TableRow>
                    ) : contacts.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email}</TableCell>
                        <TableCell>{c.department || '-'}</TableCell>
                        <TableCell>{c.position || '-'}</TableCell>
                        <TableCell><Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteContact(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === Campaigns Tab === */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Create Campaign</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Campaign</DialogTitle>
                    <DialogDescription>Create an email campaign with survey questions.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div><Label>Campaign Name *</Label><Input value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Q1 2024 ESG Data Collection" /></div>
                    <div><Label>Description</Label><Textarea value={campaignForm.description} onChange={e => setCampaignForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description for email recipients" /></div>
                    <div><Label>Subject *</Label><Input value={campaignForm.subject} onChange={e => setCampaignForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject line" /></div>
                    <div><Label>Email Body</Label><Textarea rows={4} value={campaignForm.email_body} onChange={e => setCampaignForm(p => ({ ...p, email_body: e.target.value }))} placeholder="Custom email body (questions will be appended automatically)" /></div>
                    <div><Label>Categories (comma separated)</Label><Input value={campaignForm.categories} onChange={e => setCampaignForm(p => ({ ...p, categories: e.target.value }))} placeholder="e.g., Electricity, Business Flights" /></div>

                    {/* Questions builder */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <Label className="text-base font-semibold">Survey Questions</Label>
                      {campaignForm.questions.map((q, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm"><strong>{idx + 1}.</strong> {q.question} <Badge variant="outline" className="ml-1">{q.type}</Badge></span>
                          <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 gap-2">
                        <Input className="col-span-5" placeholder="Question text" value={newQuestion.question} onChange={e => setNewQuestion(p => ({ ...p, question: e.target.value }))} />
                        <select className="col-span-3 border rounded px-2 text-sm" value={newQuestion.type} onChange={e => setNewQuestion(p => ({ ...p, type: e.target.value }))}>
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Yes/No</option>
                          <option value="select">Select</option>
                        </select>
                        {newQuestion.type === 'select' && (
                          <Input className="col-span-3" placeholder="Options (comma sep)" value={newQuestion.options} onChange={e => setNewQuestion(p => ({ ...p, options: e.target.value }))} />
                        )}
                        <Button className="col-span-1" size="sm" onClick={addQuestion} disabled={!newQuestion.question}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCampaignDialog(false)}>Cancel</Button>
                    <Button onClick={createCampaign} disabled={!campaignForm.name || !campaignForm.subject}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {campaigns.length === 0 ? (
                <Card><CardContent className="text-center text-muted-foreground py-8">No campaigns yet. Create your first campaign.</CardContent></Card>
              ) : campaigns.map(c => (
                <Card key={c.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{c.name}</CardTitle>
                        <CardDescription>{c.subject}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={statusColor(c.status)}>{c.status}</Badge>
                        {c.status === 'draft' && (
                          <Button size="sm" onClick={() => openSendDialog(c)}><Send className="h-3 w-3 mr-1" /> Send</Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {c.description && <p className="text-sm text-muted-foreground mb-2">{c.description}</p>}
                    {c.categories && c.categories.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {c.categories.map((cat, i) => <Badge key={i} variant="outline">{cat}</Badge>)}
                      </div>
                    )}
                    {c.questions && c.questions.length > 0 && (
                      <p className="text-xs text-muted-foreground">{c.questions.length} question(s) included</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Created: {new Date(c.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* === Responses Tab === */}
          <TabsContent value="responses" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { fetchResponses(); }}>
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
            {responses.length === 0 ? (
              <Card><CardContent className="text-center text-muted-foreground py-8">No responses yet. Send campaigns and check replies.</CardContent></Card>
            ) : responses.map(r => (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.response_type}</Badge>
                      <span className="font-medium">{r.email_contacts?.name || 'Unknown'}</span>
                      <span className="text-sm text-muted-foreground">({r.email_contacts?.email})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.is_analyzed ? (
                        <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" /> Analyzed</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => analyzeResponse(r.id)}>
                          <Brain className="h-3 w-3 mr-1" /> Analyze
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setExpandedResponse(expandedResponse === r.id ? null : r.id)}>
                        {expandedResponse === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Campaign: {r.email_campaigns?.name || 'Unknown'} | Received: {r.received_at ? new Date(r.received_at).toLocaleString() : 'N/A'}
                  </p>
                  {expandedResponse === r.id && (
                    <div className="mt-3 space-y-3">
                      {r.raw_content && (
                        <div>
                          <Label className="text-sm font-semibold">Raw Content</Label>
                          <div className="bg-gray-50 p-3 rounded text-sm mt-1 whitespace-pre-wrap">{r.raw_content}</div>
                        </div>
                      )}
                      {r.analysis_result && (
                        <div>
                          <Label className="text-sm font-semibold">AI Analysis</Label>
                          {renderJson(r.analysis_result)}
                        </div>
                      )}
                      {r.parsed_data && (
                        <div>
                          <Label className="text-sm font-semibold">Parsed Data</Label>
                          {renderJson(r.parsed_data)}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* === Reports Tab === */}
          <TabsContent value="reports" className="space-y-4">
            {reports.length === 0 ? (
              <Card><CardContent className="text-center text-muted-foreground py-8">No reports yet. Generate a report from collected responses.</CardContent></Card>
            ) : reports.map(r => (
              <Card key={r.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{r.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {r.total_responses} responses | Response rate: {r.response_rate}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColor(r.status)}>{r.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setExpandedReport(expandedReport === r.id ? null : r.id)}>
                        {expandedReport === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {r.summary && <p className="text-sm text-muted-foreground mb-2">{r.summary}</p>}
                  <p className="text-xs text-muted-foreground">Created: {new Date(r.created_at).toLocaleString()}</p>
                  {expandedReport === r.id && r.detailed_analysis && (
                    <div className="mt-3">
                      <Label className="text-sm font-semibold">Detailed Analysis</Label>
                      {renderJson(r.detailed_analysis)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Send Campaign Dialog */}
        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send Campaign: {selectedCampaign?.name}</DialogTitle>
              <DialogDescription>Select contacts to send this campaign to.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedContactIds(contacts.filter(c => c.is_active).map(c => c.id))}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedContactIds([])}>
                  Clear
                </Button>
              </div>
              {contacts.filter(c => c.is_active).map(c => (
                <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContactIds.includes(c.id)}
                    onChange={() => toggleContactSelection(c.id)}
                    className="rounded"
                  />
                  <span className="text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.email}</span>
                </label>
              ))}
              {contacts.filter(c => c.is_active).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No active contacts. Add contacts first.</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
              <Button onClick={sendCampaign} disabled={selectedContactIds.length === 0}>
                <Send className="h-4 w-4 mr-1" /> Send to {selectedContactIds.length} contact(s)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Generate Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Analysis Report</DialogTitle>
              <DialogDescription>AI will analyze all collected responses and generate a comprehensive ESG report.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Report Title</Label><Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} placeholder="ESG Data Analysis Report" /></div>
              <div>
                <Label>Campaign (optional - leave empty for all)</Label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={reportCampaignId || ''}
                  onChange={e => setReportCampaignId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All campaigns</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
              <Button onClick={generateReport}><Brain className="h-4 w-4 mr-1" /> Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading && (
          <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        )}
      </div>
    </Layout>
  );
}
