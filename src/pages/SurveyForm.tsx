import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Leaf, TreePine, Sprout,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname.includes('vercel.app') ? 'https://esg-backend-one.vercel.app' : 'http://localhost:8000');

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
  const [animDir, setAnimDir] = useState(1);

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

  const goNext = () => {
    setAnimDir(1);
    setCurrentStep(s => s + 1);
  };

  const goBack = () => {
    setAnimDir(-1);
    setCurrentStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
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

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Leaf className="h-10 w-10 text-emerald-600 animate-bounce" style={{ animationDuration: '1.5s' }} />
          <Sprout className="h-5 w-5 text-green-400 absolute -bottom-1 -right-1 animate-pulse" />
        </div>
        <p className="text-emerald-700 font-medium tracking-wide">Loading survey...</p>
      </div>
    );
  }

  // --- Error ---
  if (error && !campaign) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-emerald-100 p-8 max-w-md w-full text-center border border-emerald-100">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Survey Not Found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (submitted) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Animated nature scene */}
          <div className="relative mb-8 flex justify-center">
            <div className="absolute w-40 h-40 bg-emerald-100 rounded-full animate-pulse opacity-60" />
            <div className="absolute w-28 h-28 bg-emerald-200/60 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Floating leaves */}
          <div className="flex justify-center gap-3 mb-8 -mt-4">
            {[TreePine, Leaf, Sprout].map((Icon, i) => (
              <div
                key={i}
                className="animate-float"
                style={{ animationDelay: `${i * 0.4}s`, animationDuration: '3s' }}
              >
                <Icon className="h-5 w-5 text-emerald-300" />
              </div>
            ))}
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">
            Thank You!
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-sm mx-auto mb-8">
            Your sustainability data has been submitted successfully.
            Together we're building a greener future.
          </p>

          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>

          <p className="text-emerald-600/60 text-xs mt-10">
            Powered by ESG Sustainability Platform
          </p>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const progress = ((currentStep + (canProceed() ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 py-6 px-4">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-in { animation: ${animDir > 0 ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 rounded-t-2xl p-6 pb-5 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative flex items-start gap-3">
            <Leaf className="h-6 w-6 mt-0.5 text-emerald-200 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{campaign?.name || 'ESG Survey'}</h1>
              {campaign?.description && (
                <p className="text-emerald-100/80 text-sm mt-1.5 leading-relaxed line-clamp-3">{campaign.description}</p>
              )}
            </div>
          </div>

          {campaign?.categories && campaign.categories.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3 relative">
              {campaign.categories.map((c, i) => (
                <span key={i} className="bg-white/15 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full font-medium">{c}</span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-emerald-100 h-1.5 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        </div>

        {/* Step indicator */}
        <div className="bg-white/90 backdrop-blur-sm px-6 py-2.5 border-b border-emerald-50 flex items-center justify-between text-sm">
          <span className="text-emerald-700 font-medium">Question {currentStep + 1} of {questions.length}</span>
          <span className="text-emerald-500">{Math.round(progress)}%</span>
        </div>

        {/* Question */}
        <div className="bg-white/80 backdrop-blur-sm p-6 shadow-lg shadow-emerald-100/50 rounded-b-2xl border border-emerald-100/50 border-t-0 min-h-[320px] flex flex-col">
          {q && (
            <div className="slide-in flex-1">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {currentStep + 1}
                </div>
                <h2 className="text-lg font-semibold text-gray-800 leading-snug">
                  {q.question}
                  {q.unit && <span className="text-sm font-normal text-emerald-500 ml-1.5">({q.unit})</span>}
                </h2>
              </div>

              {/* Boolean */}
              {q.type === 'boolean' && (
                <div className="flex gap-3 mt-2">
                  {['Yes', 'No'].map(opt => {
                    const val = opt === 'Yes' ? 'true' : 'false';
                    const selected = answers[q.id || q.question] === val;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswer(q.id || q.question, val)}
                        className={`flex-1 py-4 rounded-xl border-2 text-lg font-medium transition-all duration-200 ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100 scale-[0.98]'
                            : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 text-gray-600'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Select */}
              {q.type === 'select' && q.options && (
                <div className="space-y-2.5 mt-2">
                  {q.options.map((opt, i) => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const value = typeof opt === 'string' ? opt : opt.value;
                    const selected = answers[q.id || q.question] === value;
                    return (
                      <button
                        key={i}
                        onClick={() => setAnswer(q.id || q.question, value)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                          selected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100 scale-[0.99]'
                            : 'border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 text-gray-600'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                          }`}>
                            {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Number */}
              {q.type === 'number' && (
                <div className="mt-2">
                  <input
                    type="number"
                    value={answers[q.id || q.question] || ''}
                    onChange={e => setAnswer(q.id || q.question, e.target.value)}
                    placeholder={q.unit || 'Enter number...'}
                    className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl text-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all bg-gray-50/50 focus:bg-white"
                  />
                </div>
              )}

              {/* Text */}
              {q.type === 'text' && (
                <div className="mt-2">
                  <textarea
                    value={answers[q.id || q.question] || ''}
                    onChange={e => setAnswer(q.id || q.question, e.target.value)}
                    placeholder="Type your answer..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all resize-none bg-gray-50/50 focus:bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-gray-50">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-0 disabled:pointer-events-none transition-all font-medium"
            >
              Back
            </button>

            {isLast ? (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-md shadow-emerald-200 active:scale-[0.98]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl hover:from-emerald-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-md shadow-emerald-200 active:scale-[0.98]"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-emerald-400/60 text-xs mt-5 flex items-center justify-center gap-1.5">
          <Leaf className="h-3 w-3" /> Powered by ESG Sustainability Platform
        </p>
      </div>
    </div>
  );
}
