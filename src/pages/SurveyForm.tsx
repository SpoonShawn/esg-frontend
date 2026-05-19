import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, AlertCircle, Loader2, ChevronRight,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Question {
  id: string;
  question: string;
  type: string;
  unit?: string;
  options?: string[] | { label: string; value: string }[];
  required?: boolean;
}
interface Campaign {
  id: number;
  name: string;
  description?: string;
  subject: string;
  questions: Question[] | string;
  categories?: string[];
  company_id: number;
}

export default function SurveyForm() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [searchParams] = useSearchParams();
  const msgId = searchParams.get('msg');
  const contactId = searchParams.get('contact');

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!campaignId) return;
    fetch(`${API_BASE_URL}/api/email-bot/form/${campaignId}`)
      .then(res => {
        if (!res.ok) throw new Error('Campaign not found');
        return res.json();
      })
      .then(data => {
        setCampaign(data);
        let qs = data.questions;
        if (typeof qs === 'string') {
          try { qs = JSON.parse(qs); } catch { qs = []; }
        }
        setQuestions(qs);
        const init: Record<string, string> = {};
        qs.forEach((q: Question) => { init[q.id || q.question] = ''; });
        setAnswers(init);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [campaignId]);

  const setAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = () => {
    const q = questions[currentStep];
    if (!q) return true;
    const key = q.id || q.question;
    return answers[key] !== '' && answers[key] !== undefined;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/email-bot/form/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: Number(campaignId),
          message_id: msgId ? Number(msgId) : null,
          contact_id: contactId ? Number(contactId) : null,
          answers,
        }),
      });
      if (!res.ok) throw new Error('Submit failed');
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <Loader2 className="h-6 w-6 animate-spin" /> Loading survey...
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Survey Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-500">Your response has been submitted successfully. Our AI system will analyze your data.</p>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + (canProceed() ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-xl p-6 text-white">
          <h1 className="text-xl font-bold">{campaign?.name || 'ESG Survey'}</h1>
          {campaign?.description && (
            <p className="text-blue-100 text-sm mt-1">{campaign.description}</p>
          )}
          {campaign?.categories && campaign.categories.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {campaign.categories.map((c, i) => (
                <span key={i} className="bg-blue-400/30 text-white text-xs px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-gray-200 h-1.5">
          <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicator */}
        <div className="bg-white px-6 py-3 border-b flex items-center justify-between text-sm text-gray-500">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>

        {/* Question */}
        <div className="bg-white p-6 shadow-lg rounded-b-xl">
          {q && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {q.question}
                {q.unit && <span className="text-sm font-normal text-gray-400 ml-2">({q.unit})</span>}
              </h2>

              {q.type === 'boolean' && (
                <div className="flex gap-4">
                  {['Yes', 'No'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(q.id || q.question, opt === 'Yes' ? 'true' : 'false')}
                      className={`flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all ${
                        answers[q.id || q.question] === (opt === 'Yes' ? 'true' : 'false')
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'select' && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const value = typeof opt === 'string' ? opt : opt.value;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswer(q.id || q.question, value)}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                          answers[q.id || q.question] === value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'number' && (
                <input
                  type="number"
                  value={answers[q.id || q.question] || ''}
                  onChange={e => setAnswer(q.id || q.question, e.target.value)}
                  placeholder={q.unit || 'Enter number...'}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-blue-500 focus:outline-none transition-all"
                />
              )}

              {q.type === 'text' && (
                <textarea
                  value={answers[q.id || q.question] || ''}
                  onChange={e => setAnswer(q.id || q.question, e.target.value)}
                  placeholder="Type your answer..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all resize-none"
                />
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(s => s - 1)}
              disabled={currentStep === 0}
              className="px-6 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Back
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={!canProceed()}
                className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">Powered by ESG Sustainability Platform</p>
      </div>
    </div>
  );
}
