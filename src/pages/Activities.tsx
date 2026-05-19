import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layout } from "@/components/Layout";
import { Plus, Calendar, Tag, TrendingDown, Edit2, Check, X, Scan, ImageIcon, Loader2 } from "lucide-react";
import { useActivities, Activity, ActivityCreate, ActivityCreateResponse, useAuth, useBusinessCategories } from "@/hooks/use-api";
import { toast } from "sonner";
import { FollowUpQuestionsModal } from "@/components/FollowUpQuestionsModal";
import { buildApiUrl } from "@/lib/api";

const Activities = () => {
  const [newActivity, setNewActivity] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]); // Add date state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [preparedActivityData, setPreparedActivityData] = useState<any>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  
  // New state for inline editing
  const [editingActivity, setEditingActivity] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'date' | null>(null);
  const [editValues, setEditValues] = useState<{name: string, date: string}>({name: "", date: ""});

  // OCR state
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>("");
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activities,
    loading: fetchLoading,
    createLoading,
    fetchActivities,
    createActivity,
    updateActivity,
    answersActivity,
    createCompleteActivity,
    sendQuestions,
  } = useActivities();

  const { getCurrentCompany } = useAuth();
  const { businessCategories, fetchBusinessCategories } = useBusinessCategories();
  const currentCompany = getCurrentCompany();
  const currentCompanyId = currentCompany?.id || 1;
  const currentCompanyLocation = currentCompany?.location || 'Hong Kong';

  useEffect(() => {
    if (currentCompanyId) {
      fetchActivities({ company_id: currentCompanyId });
    }
    // Fetch business categories
    fetchBusinessCategories();
  }, [fetchActivities, currentCompanyId, fetchBusinessCategories]);

  const handleSubmit = async () => {
    if (!newActivity.trim()) {
      return;
    }

    try {
      const activityData: ActivityCreate = {
        company_id: currentCompanyId,
        activity_name: newActivity,
        category: "", // Will be set by AI
        description: newActivity,
        emissions: 0, // Will be calculated later
        date: activityDate, // Use the selected date instead of current date
        location: currentCompanyLocation,
      };

      const result = await createActivity(activityData);
      console.log(result);
      
      if (result) {
        // Check if follow-up questions are empty and category is 'N/A'
        const hasEmptyQuestions = !result.followup_questions || 
                                !result.followup_questions.questions || 
                                result.followup_questions.questions.length === 0;
        
        const hasNACategory = result.prepared_activity && 
                            (result.prepared_activity.category === 'N/A' || 
                             result.prepared_activity.category === '' ||
                             !result.prepared_activity.category);

        if (hasEmptyQuestions && hasNACategory) {
          // Show category selection instead of follow-up questions
          setPreparedActivityData(result.prepared_activity);
          setCategoriesData(result.followup_questions); // This should contain the categories JSON
          setShowCategorySelection(true);
          setSelectedCategory("");
          setSelectedSubcategory("");
        } else if (result.followup_questions && result.followup_questions.questions) {
          // Normal flow with follow-up questions
          setPreparedActivityData(result.prepared_activity);
          setFollowUpQuestions(result.followup_questions);
          setShowFollowUpModal(true);
        } else {
        // Not needed with new flow
        setNewActivity("");
        setActivityDate(new Date().toISOString().split('T')[0]);
          toast.success("Activity created successfully!");
          fetchActivities({ company_id: currentCompanyId });
        }
      }
    } catch (error) {
      console.error("Error preparing activity:", error);
      toast.error("Failed to prepare activity");
    }
  };

  const handleCategorySelection = async () => {
    if (!selectedCategory || !preparedActivityData) {
      toast.error("Please select a category");
      return;
    }

    try {
      // Step 1: Call sendQuestions API with category + location
      const questionsConfig = await sendQuestions(selectedCategory, currentCompanyLocation);

      if (questionsConfig && Object.keys(questionsConfig).length > 0) {
        // Step 2: Save prepared activity with chosen category
        setPreparedActivityData({
          ...preparedActivityData,
          category: selectedCategory,
          subcategory: selectedSubcategory || "",
        });

        // Step 3: Open follow-up modal with returned questions
        setShowCategorySelection(false);
        setFollowUpQuestions(questionsConfig.followup_questions);
        setShowFollowUpModal(true);
      } else {
        // If no questions are returned, create the activity directly
        const createdActivity = await createCompleteActivity({
          prepared_activity: {
            ...preparedActivityData,
            category: selectedCategory,
            subcategory: selectedSubcategory || "",
          },
          location: currentCompanyLocation,
          followup_answers: {},
        });

        if (createdActivity) {
          toast.success("Activity created successfully!");
          handleCategorySelectionCancel();
          fetchActivities({ company_id: currentCompanyId });
        } else {
          toast.error("Failed to create activity");
        }
      }
    } catch (error) {
      console.error("Error sending questions:", error);
      toast.error("Failed to send questions");
    }
  };


  const handleCategorySelectionCancel = () => {
    setShowCategorySelection(false);
    setNewActivity("");
    setPreparedActivityData(null);
    setCategoriesData(null);
    setSelectedCategory("");
    setSelectedSubcategory("");
  };

  const handleFollowUpComplete = async (answers: Record<string, any>) => {
    if (!preparedActivityData || !currentCompanyLocation) return;

    try {
      // Create the complete activity with answers in a single transaction
      const createdActivity = await createCompleteActivity({
        prepared_activity: preparedActivityData,
        location: currentCompanyLocation,
        followup_answers: answers
      });

      if (createdActivity) {
        toast.success("Activity created successfully!");
        handleFollowUpCancel(); // Reset state
        fetchActivities({ company_id: currentCompanyId });
      } else {
        toast.error("Failed to create activity");
      }
    } catch (error) {
      console.error("Error creating complete activity:", error);
      toast.error("Failed to create activity");
    }
  };

  const handleFollowUpCancel = () => {
    // Reset all state when follow-up is cancelled
    setShowFollowUpModal(false);
    setNewActivity("");
    setPreparedActivityData(null);
    setFollowUpQuestions(null);
  };

  // New functions for inline editing
  const startEditing = (activityId: number, field: 'name' | 'date', currentValue: string) => {
    setEditingActivity(activityId);
    setEditingField(field);
    setEditValues(prev => ({
      ...prev,
      [field]: currentValue
    }));
  };

  const cancelEditing = () => {
    setEditingActivity(null);
    setEditingField(null);
    setEditValues({name: "", date: ""});
  };

  const saveEdit = async (activityId: number) => {
    if (!editingField) return;

    try {
      const updateData: any = {};
      if (editingField === 'name') {
        updateData.activity_name = editValues.name;
      } else if (editingField === 'date') {
        updateData.date = editValues.date;
      }

      const updatedActivity = await updateActivity(activityId, updateData);

      if (updatedActivity) {
        toast.success(`Activity ${editingField} updated successfully!`);
        cancelEditing();
        fetchActivities({ company_id: currentCompanyId });
      } else {
        toast.error(`Failed to update activity ${editingField}`);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error(`Failed to update activity ${editingField}`);
    }
  };

  // OCR Functions
  const handleOCRImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOcrImagePreview(result);
      setOcrImage(result);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async () => {
    if (!ocrImage) {
      toast.error('Please upload an image first');
      return;
    }

    setOcrProcessing(true);
    setOcrResult("");

    try {
      // Call OCR API with base64 image
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/api/activities/ocr/base64'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: ocrImage })
      });

      if (!response.ok) {
        throw new Error('OCR processing failed');
      }

      const data = await response.json();

      if (data.text) {
        setOcrResult(data.text);
        setOcrConfidence(data.confidence);
        toast.success(`Text extracted successfully! Confidence: ${(data.confidence * 100).toFixed(1)}%`);
      } else {
        toast.warning('No text detected in the image');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Failed to extract text from image');
    } finally {
      setOcrProcessing(false);
    }
  };

  const useOCRResult = () => {
    if (ocrResult) {
      setNewActivity(ocrResult);
      setShowOCRModal(false);
      // Reset OCR state
      setOcrImage(null);
      setOcrImagePreview(null);
      setOcrResult("");
      setOcrConfidence(0);
      toast.success('OCR text added to activity description');
    }
  };

  const closeOCRModal = () => {
    setShowOCRModal(false);
    // Reset OCR state
    setOcrImage(null);
    setOcrImagePreview(null);
    setOcrResult("");
    setOcrConfidence(0);
  };

  const getCategoryColor = (category: string) => {
    // Dynamic color mapping based on category name
    const colors = {
      "Electricity": "bg-primary/10 text-primary",
      "Business Flights": "bg-blue-500/10 text-blue-500",
      "Employee Commute": "bg-accent/10 text-accent",
      "Purchased Goods": "bg-success/10 text-success",
      "Paper Usage": "bg-orange-500/10 text-orange-500",
      "Refrigerators and Air-Conditioning Equipment": "bg-purple-500/10 text-purple-500",
      "Agriculture": "bg-green-500/10 text-green-500",
      "Industrial Process and Product Use": "bg-indigo-500/10 text-indigo-500",
      "Waste": "bg-red-500/10 text-red-500"
    };
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
  };

  // Get available subcategories for selected category
  const getSubcategories = () => {
    if (!businessCategories || !selectedCategory) return [];
    const locationCategories = businessCategories[currentCompanyLocation] || {};
    return locationCategories[selectedCategory] || [];
  };

  const getSubcategoriesFromAPI = () => {
    if (!categoriesData || !categoriesData.Categories || !selectedCategory) {
      return [];
    }
    
    // Return the array of subcategories for the selected category
    return categoriesData.Categories[selectedCategory] || [];
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ESG Activities</h1>
          <p className="text-muted-foreground">
            Log your sustainability activities and track their environmental impact
          </p>
        </div>

        {/* Add Activity Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log New Activity
            </CardTitle>
            <CardDescription>
              Describe your sustainability activity and our AI will categorize it and calculate emissions impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="activity">Activity Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOCRModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Scan Image
                  </Button>
                </div>
                <Textarea
                  id="activity"
                  placeholder="e.g., Installed LED lighting in office building, Organized employee carpooling program..."
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              {/* Add Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="activity-date">When did this activity occur?</Label>
                <Input
                  id="activity-date"
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full sm:w-auto"
                  max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={createLoading || !newActivity.trim()}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {createLoading ? "Processing with AI..." : "Add Activity"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* OCR Modal */}
        <Dialog open={showOCRModal} onOpenChange={closeOCRModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                OCR Text Extraction
              </DialogTitle>
              <DialogDescription>
                Upload an image to extract text using AI-powered OCR
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Image Upload Area */}
              <div className="space-y-2">
                <Label>Upload Image</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleOCRImageUpload}
                    disabled={ocrProcessing}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrProcessing}
                    className="flex items-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Choose Image
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    PNG, JPG up to 10MB
                  </span>
                </div>
              </div>

              {/* Image Preview */}
              {ocrImagePreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img
                      src={ocrImagePreview}
                      alt="Preview"
                      className="max-w-full max-h-[300px] mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              {/* Process Button */}
              {ocrImagePreview && !ocrResult && (
                <Button
                  onClick={processOCR}
                  disabled={ocrProcessing}
                  className="w-full"
                >
                  {ocrProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing OCR...
                    </>
                  ) : (
                    <>
                      <Scan className="h-4 w-4 mr-2" />
                      Extract Text
                    </>
                  )}
                </Button>
              )}

              {/* OCR Result */}
              {ocrResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Extracted Text</Label>
                    <Badge variant="outline" className="text-xs">
                      Confidence: {(ocrConfidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Textarea
                    value={ocrResult}
                    onChange={(e) => setOcrResult(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Extracted text will appear here..."
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={useOCRResult}
                      className="flex-1"
                    >
                      Use This Text
                    </Button>
                    <Button
                      onClick={() => {
                        setOcrResult("");
                        setOcrImage(null);
                        setOcrImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCategorySelection} onOpenChange={setShowCategorySelection}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Select Activity Category</DialogTitle>
              <DialogDescription>
                Our AI couldn't automatically categorize this activity.  
                Please select the appropriate category and subcategory.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedSubcategory(""); // reset subcategory
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesData && categoriesData.Categories &&
                      Object.keys(categoriesData.Categories).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory && getSubcategoriesFromAPI().length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select
                    value={selectedSubcategory}
                    onValueChange={setSelectedSubcategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubcategoriesFromAPI().map((subcategory) => (
                        <SelectItem key={subcategory} value={subcategory}>
                          {subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCategorySelectionCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleCategorySelection}
                disabled={!selectedCategory}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Create Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activities List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your logged ESG activities and their calculated impact</CardDescription>
          </CardHeader>
          <CardContent>
            {fetchLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading activities...</p>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-accent/10 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Editable Activity Name */}
                        <div className="flex items-center gap-2 mb-2">
                          {editingActivity === activity.id && editingField === 'name' ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editValues.name}
                                onChange={(e) => setEditValues(prev => ({...prev, name: e.target.value}))}
                                className="flex-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    saveEdit(activity.id);
                                  } else if (e.key === 'Escape') {
                                    cancelEditing();
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => saveEdit(activity.id)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1 group">
                              <p className="font-medium flex-1">{activity.activity_name}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(activity.id, 'name', activity.activity_name)}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {/* Editable Date */}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {editingActivity === activity.id && editingField === 'date' ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="date"
                                  value={editValues.date}
                                  onChange={(e) => setEditValues(prev => ({...prev, date: e.target.value}))}
                                  className="w-auto text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveEdit(activity.id);
                                    } else if (e.key === 'Escape') {
                                      cancelEditing();
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => saveEdit(activity.id)}
                                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEditing}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 group cursor-pointer"
                                   onClick={() => startEditing(activity.id, 'date', activity.date)}>
                                <span>{new Date(activity.date).toLocaleDateString()}</span>
                                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            <Badge variant="secondary" className={getCategoryColor(activity.category)}>
                              {activity.category}
                            </Badge>
                          </div>
                          {activity.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {activity.subcategory}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-success font-medium">
                          <TrendingDown className="h-4 w-4" />
                          {Math.abs(activity.emissions)} kg CO₂e
                        </div>
                        <p className="text-xs text-muted-foreground">Carbon impact</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activities found. Create your first activity above!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-up Questions Modal */}
        <FollowUpQuestionsModal
          isOpen={showFollowUpModal}
          onClose={handleFollowUpCancel}
          questionsConfig={followUpQuestions}
          onComplete={handleFollowUpComplete}
        />
      </div>
    </Layout>
  );
};

export default Activities;