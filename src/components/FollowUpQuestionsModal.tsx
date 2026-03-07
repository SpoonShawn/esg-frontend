import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface FollowUpQuestion {
  id: string;
  question: string;
  type: "boolean" | "number" | "select" | "text";
  checkbox?: boolean; // New property to indicate multi-select with checkboxes
  unit_options?: string[]; // New property for unit selection
  required: boolean;
  description: string;
  options?: Array<{
    label: string;
    value: string;
  }> | string[]; // Support both formats
  followup_questions?: {
    [key: string]: FollowUpQuestion | FollowUpQuestion[];
    true?: FollowUpQuestion | FollowUpQuestion[];
    false?: FollowUpQuestion | FollowUpQuestion[];
    id?: string;
    question?: string;
    type?: string;
    required?: boolean;
    description?: string;
  };
}

interface FollowUpQuestionsConfig {
  questions: FollowUpQuestion[];
}

interface FollowUpQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionsConfig: FollowUpQuestionsConfig | null;
  onComplete: (answers: Record<string, any>) => void;
}

interface QuestionAnswer {
  [key: string]: any;
}

export const FollowUpQuestionsModal = ({
  isOpen,
  onClose,
  questionsConfig,
  onComplete
}: FollowUpQuestionsModalProps) => {
  const [answers, setAnswers] = useState<QuestionAnswer>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [visibleQuestions, setVisibleQuestions] = useState<FollowUpQuestion[]>([]);

  // Initialize visible questions when config changes
  useEffect(() => {
    if (questionsConfig?.questions) {
      setVisibleQuestions(questionsConfig.questions);
      setCurrentQuestionIndex(0);
      setAnswers({});
    }
  }, [questionsConfig]);

  const currentQuestion = visibleQuestions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleUnitAnswerChange = (questionId: string, field: 'amount' | 'unit', value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (questionId: string, optionValue: string, checked: boolean) => {
    setAnswers(prev => {
      const currentSelections = prev[questionId] || {};
      if (checked) {
        return {
          ...prev,
          [questionId]: {
            ...currentSelections,
            [optionValue]: { selected: true, amount: 0 }
          }
        };
      } else {
        const newSelections = { ...currentSelections };
        delete newSelections[optionValue];
        return {
          ...prev,
          [questionId]: newSelections
        };
      }
    });
  };

  const handleCheckboxAmountChange = (questionId: string, optionValue: string, amount: string) => {
    const numValue = parseFloat(amount) || 0;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [optionValue]: {
          ...prev[questionId]?.[optionValue],
          amount: numValue
        }
      }
    }));
  };

  const handleEquipmentCountChange = (questionId: string, equipmentType: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [equipmentType]: numValue
      }
    }));
  };

  const getNextQuestions = (question: FollowUpQuestion, answer: any): FollowUpQuestion[] => {
    if (!question.followup_questions) return [];

    // Handle object-style followup questions (for checkbox questions)
    if (question.followup_questions.id) {
      return [question.followup_questions as FollowUpQuestion];
    }

    // Handle boolean-style followup questions
    if (typeof answer === 'boolean') {
      const key = answer === true ? "true" : "false";
      const followupQuestion = question.followup_questions[key];
      
      if (!followupQuestion) return [];
      
      // If followupQuestion is an array, return it directly
      if (Array.isArray(followupQuestion)) {
        return followupQuestion;
      }
      
      // If followupQuestion is a single object, return it as an array
      if (typeof followupQuestion === 'object' && followupQuestion.id) {
        return [followupQuestion as FollowUpQuestion];
      }
    }

    // Handle select-based followup questions (like industrial process)
    if (typeof answer === 'string' && question.followup_questions[answer]) {
      const followupQuestion = question.followup_questions[answer];
      
      // If followupQuestion is an array, return it directly
      if (Array.isArray(followupQuestion)) {
        return followupQuestion;
      }
      
      // If followupQuestion is a single object, return it as an array
      if (typeof followupQuestion === 'object' && followupQuestion.id) {
        return [followupQuestion as FollowUpQuestion];
      }
    }
    
    return [];
  };

  const validateCurrentAnswer = (question: FollowUpQuestion, answer: any): boolean => {
    if (!question.required) return true;

    // Special validation for equipment_counts question
    if (question.id === "equipment_counts") {
      return answer && (answer.refrigerators > 0 || answer.air_conditioners > 0);
    }

    // Special validation for checkbox questions
    if (question.checkbox && question.type === "select") {
      if (!answer || Object.keys(answer).length === 0) {
        return false;
      }
      // Check if at least one option is selected with a valid amount
      return Object.values(answer).some((item: any) => item.selected && item.amount > 0);
    }

    // Special validation for questions with units
    if (question.unit_options && question.type === "number") {
      return answer && answer.amount !== undefined && answer.amount !== "" && answer.amount > 0 && answer.unit;
    }

    // Standard validation for other questions
    return answer !== undefined && answer !== "" && answer !== null;
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.id];

    if (!validateCurrentAnswer(currentQuestion, currentAnswer)) {
      if (currentQuestion.checkbox && currentQuestion.type === "select") {
        toast.error("Please select at least one option and provide a valid amount");
      } else if (currentQuestion.id === "equipment_counts") {
        toast.error("Please enter at least one piece of equipment");
      } else {
        toast.error("This question is required");
      }
      return;
    }

    const followUpQuestions = getNextQuestions(currentQuestion, currentAnswer);

    let newVisibleQuestions = [...visibleQuestions];
    const nextIndex = currentQuestionIndex + 1;

    if (followUpQuestions.length > 0) {
      newVisibleQuestions = [
        ...visibleQuestions.slice(0, nextIndex),
        ...followUpQuestions,
        ...visibleQuestions.slice(nextIndex)
      ];
      setVisibleQuestions(newVisibleQuestions);
    }

    if (currentQuestionIndex < newVisibleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleComplete = () => {
    // Validate all required questions are answered
    const requiredQuestions = visibleQuestions.filter(q => q.required);
    const unansweredRequired = requiredQuestions.filter(q => {
      const answer = answers[q.id];
      return !validateCurrentAnswer(q, answer);
    });

    if (unansweredRequired.length > 0) {
      toast.error("Please answer all required questions");
      return;
    }

    onComplete(answers);
    onClose();
  };

  const renderEquipmentCountsInput = (question: FollowUpQuestion) => {
    const equipmentCounts = answers[question.id] || { refrigerators: 0, air_conditioners: 0 };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="refrigerators" className="text-sm font-medium">
              Number of Refrigerators
            </Label>
            <Input
              id="refrigerators"
              type="number"
              min="0"
              value={equipmentCounts.refrigerators || ""}
              onChange={(e) => handleEquipmentCountChange(question.id, "refrigerators", e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="air_conditioners" className="text-sm font-medium">
              Number of Air Conditioners
            </Label>
            <Input
              id="air_conditioners"
              type="number"
              min="0"
              value={equipmentCounts.air_conditioners || ""}
              onChange={(e) => handleEquipmentCountChange(question.id, "air_conditioners", e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Total equipment: {(equipmentCounts.refrigerators || 0) + (equipmentCounts.air_conditioners || 0)} units
        </div>
      </div>
    );
  };

  const renderNumberWithUnit = (question: FollowUpQuestion) => {
    const answer = answers[question.id] || { amount: "", unit: "" };

    return (
      <div className="flex space-x-2">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            value={answer.amount || ""}
            onChange={(e) => handleUnitAnswerChange(question.id, 'amount', parseFloat(e.target.value) || "")}
            placeholder="Enter amount"
          />
        </div>
        <div className="w-32">
          <Select 
            value={answer.unit || ""} 
            onValueChange={(val) => handleUnitAnswerChange(question.id, 'unit', val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {question.unit_options?.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  const renderCheckboxSelect = (question: FollowUpQuestion) => {
    const selections = answers[question.id] || {};
    
    return (
      <div className="space-y-4">
        {question.options?.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          const isSelected = selections[optionValue]?.selected || false;
          const amount = selections[optionValue]?.amount || "";

          return (
            <div key={optionValue} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={optionValue}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCheckboxChange(question.id, optionValue, checked)}
                />
                <Label htmlFor={optionValue} className="text-sm font-medium">
                  {optionLabel}
                </Label>
              </div>
              
              {isSelected && (
                <div className="ml-6">
                  <Input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => handleCheckboxAmountChange(question.id, optionValue, e.target.value)}
                    placeholder="Enter amount"
                    className="w-48"
                  />
                </div>
              )}
            </div>
          );
        })}
        
      </div>
    );
  };

  const renderQuestionInput = (question: FollowUpQuestion) => {
    // Special handling for equipment_counts question
    if (question.id === "equipment_counts") {
      return renderEquipmentCountsInput(question);
    }

    // Handle checkbox-based multi-select
    if (question.checkbox && question.type === "select") {
      return renderCheckboxSelect(question);
    }

    const value = answers[question.id];

    switch (question.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-true`}
                checked={value === true}
                onCheckedChange={(checked) => handleAnswerChange(question.id, checked ? true : undefined)}
              />
              <Label htmlFor={`${question.id}-true`} className="text-sm font-normal">
                Yes
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-false`}
                checked={value === false}
                onCheckedChange={(checked) => handleAnswerChange(question.id, checked ? false : undefined)}
              />
              <Label htmlFor={`${question.id}-false`} className="text-sm font-normal">
                No
              </Label>
            </div>
          </div>
        );

      case "number":
        // Handle number questions with unit options
        if (question.unit_options) {
          return renderNumberWithUnit(question);
        }
        // Regular number input
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value) || 0)}
            placeholder="Enter a number"
          />
        );

      case "select":
        // Regular dropdown select (single selection)
        return (
          <Select value={value || ""} onValueChange={(val) => handleAnswerChange(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                return (
                  <SelectItem key={optionValue} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case "text":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={3}
          />
        );

      default:
        return <Input value={value || ""} onChange={(e) => handleAnswerChange(question.id, e.target.value)} />;
    }
  };

  if (!questionsConfig || !currentQuestion) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Additional Information Required</DialogTitle>
          <DialogDescription>
            Please provide additional details to help us calculate the environmental impact of your activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestionIndex + 1} of {visibleQuestions.length}</span>
            <div className="flex space-x-1">
              {visibleQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${
                    index <= currentQuestionIndex ? "bg-accent" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current question */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                {currentQuestion.question}
                {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {currentQuestion.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentQuestion.description}
                </p>
              )}
            </div>

            {renderQuestionInput(currentQuestion)}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleNext}>
              {currentQuestionIndex < visibleQuestions.length - 1 ? "Next" : "Complete"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};