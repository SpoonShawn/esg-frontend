import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Key, Calendar, Edit, Trash2, Copy } from "lucide-react";
import { useCompanies, CompanyCreate } from "@/hooks/use-api";
import { toast } from "sonner";

const Admin = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<CompanyCreate>({
    company_name: "",
    location: ""
  });

  const {
    companies,
    loading,
    fetchCompanies,
    createCompany,
    deleteCompany,
  } = useCompanies();

  const handleCreateCompany = async () => {
    const result = await createCompany(newCompany);
    if (result) {
      setNewCompany({ company_name: "", location: "" });
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    await deleteCompany(companyId);
  };



  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-secondary/20 p-4 lg:p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-poppins">Corevo Admin Panel</h1>
            <p className="text-muted-foreground font-poppins">
              Manage companies and their access codes
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Add a new company to the system. An access code will be automatically generated.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newCompany.company_name}
                    onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={newCompany.location}
                    onValueChange={(value) => setNewCompany({ ...newCompany, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hong Kong">Hong Kong</SelectItem>
                      <SelectItem value="New Zealand">New Zealand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCompany}
                  disabled={!newCompany.company_name || !newCompany.location}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  Create Company
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Companies
            </CardTitle>
            <CardDescription>
              {companies?.length || 0} companies registered in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading companies...</p>
              </div>
            ) : !companies || companies.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No companies found</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Company
                </Button>
              </div>
            ) : companies ? (
              <div className="space-y-4">
                {companies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{company.company_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {company.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created {formatDate(company.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <Key className="h-3 w-3" />
                          <div className="flex items-center gap-1">
                            <span 
                              className="font-mono text-xs bg-secondary px-2 py-1 rounded cursor-pointer hover:bg-secondary/80 active:bg-secondary/60 transition-colors select-none"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(company.access_code);
                                  toast.success('Access code copied to clipboard');
                                } catch (error) {
                                  toast.error('Failed to copy access code');
                                }
                              }}
                              title="Click to copy access code"
                            >
                              {company.access_code}
                            </span>
                            <Copy className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          title="Delete company"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin; 