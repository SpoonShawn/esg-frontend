import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { ArrowLeft, Save, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ReportEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    toast.success('Report saved successfully');
  };

  const handlePreview = () => {
    toast.info('Preview coming soon');
  };

  const handleExport = () => {
    toast.info('Export coming soon');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Report Editor</h1>
              <p className="text-muted-foreground">
                Create and customize your ESG sustainability report
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Report Content</CardTitle>
            <CardDescription>Build your ESG report chapter by chapter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Report editor functionality coming soon
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/reports')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportEditor;
