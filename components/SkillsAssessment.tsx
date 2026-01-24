
import React, { useState } from 'react';
import { Course, AssessmentQuestion, AssessmentQuestionType, AssessmentResult } from '../types';
import { generateAssessment, evaluateAssessment } from '../services/geminiService';
import { Brain, CheckCircle, ChevronRight, AlertCircle, Loader2, Award, XCircle, RotateCcw } from 'lucide-react';

interface SkillsAssessmentProps {
    course: Course;
    onComplete: (result: AssessmentResult) => void;
}

export const SkillsAssessment: React.FC<SkillsAssessmentProps> = ({ course, onComplete }) => {
    const [step, setStep] = useState<'START' | 'QUESTIONS' | 'EVALUATING' | 'RESULT'>('START');
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [result, setResult] = useState<AssessmentResult | null>(course.assessmentResult || null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleStart = async () => {
        setIsGenerating(true);
        try {
            // Check if assessment already exists in state, otherwise generate
            const newQuestions = await generateAssessment(course);
            if (!newQuestions || newQuestions.length === 0) {
                throw new Error("AI returned no questions");
            }
            setQuestions(newQuestions);
            setStep('QUESTIONS');
            setCurrentQIndex(0);
            setAnswers({});
        } catch (e) {
            console.error(e);
            alert("Failed to generate assessment. The AI service may be busy. Please try again.");
            setStep('START');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswer = (value: any) => {
        if (!questions[currentQIndex]) return;
        setAnswers({ ...answers, [questions[currentQIndex].id]: value });
    };

    const handleNext = () => {
        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1);
        } else {
            submitAssessment();
        }
    };

    const submitAssessment = async () => {
        setStep('EVALUATING');
        try {
            const evalResult = await evaluateAssessment(course, questions, answers);
            setResult(evalResult);
            onComplete(evalResult);
            setStep('RESULT');
        } catch (e) {
            console.error(e);
            alert("Evaluation failed.");
            setStep('QUESTIONS'); // Go back to allow retry
        }
    };

    if (step === 'START') {
        if (result) {
            // Already taken
            return <ResultView result={result} onRetry={() => { setResult(null); setStep('START'); }} />;
        }
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <Brain size={48} />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Skills Verification</h2>
                <p className="text-slate-600 max-w-lg mb-8 leading-relaxed">
                    Validate your mastery of <strong>{course.title}</strong>. This AI-proctored assessment includes multiple-choice and scenario-based questions to test your practical application.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 w-full max-w-md text-left">
                    <h3 className="font-bold text-slate-800 mb-2">Assessment Structure</h3>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> 3 Multiple Choice Questions</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> 2 Practical Scenarios (AI Graded)</li>
                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-500"/> Passing Score: 70%</li>
                    </ul>
                </div>
                <button 
                    onClick={handleStart}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Brain size={20} />}
                    {isGenerating ? 'Generating Exam...' : 'Start Assessment'}
                </button>
            </div>
        );
    }

    if (step === 'QUESTIONS') {
        const q = questions[currentQIndex];
        
        // Safety check to prevent crash if q is undefined
        if (!q) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-red-500 mb-4">Error loading question.</p>
                    <button onClick={() => setStep('START')} className="text-indigo-600 font-bold hover:underline">Return to Start</button>
                </div>
            );
        }

        const progress = ((currentQIndex + 1) / questions.length) * 100;

        return (
            <div className="max-w-3xl mx-auto p-6 md:p-12 h-full flex flex-col">
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>Question {currentQIndex + 1} of {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6 leading-tight">{q.question}</h3>

                    {q.type === AssessmentQuestionType.MULTIPLE_CHOICE && q.options && (
                        <div className="space-y-3">
                            {q.options.map((opt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                        answers[q.id] === idx 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' 
                                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[q.id] === idx ? 'border-indigo-600' : 'border-slate-300'}`}>
                                            {answers[q.id] === idx && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                                        </div>
                                        {opt}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {q.type === AssessmentQuestionType.OPEN_ENDED && (
                        <div className="space-y-4">
                            <textarea
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed"
                            />
                            <p className="text-xs text-slate-500 italic flex items-center gap-1">
                                <AlertCircle size={12} /> AI will analyze your response for key concepts and practical application.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={answers[q.id] === undefined || (typeof answers[q.id] === 'string' && !answers[q.id].trim())}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                        {currentQIndex === questions.length - 1 ? 'Submit Assessment' : 'Next Question'} <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'EVALUATING') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 animate-in fade-in">
                <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Performance...</h3>
                <p>Grading scenarios and calculating competency score.</p>
            </div>
        );
    }

    if (step === 'RESULT' && result) {
        return <ResultView result={result} onRetry={() => { setResult(null); setStep('START'); }} />;
    }

    return null;
};

const ResultView: React.FC<{ result: AssessmentResult, onRetry: () => void }> = ({ result, onRetry }) => {
    return (
        <div className="max-w-2xl mx-auto p-8 h-full overflow-y-auto animate-in zoom-in-95">
            <div className={`text-center p-8 rounded-3xl border-4 ${result.passed ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} mb-8`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {result.passed ? <Award size={48} /> : <XCircle size={48} />}
                </div>
                <h2 className={`text-3xl font-extrabold mb-2 ${result.passed ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {result.passed ? 'Certified Competent' : 'Needs Improvement'}
                </h2>
                <div className="text-5xl font-black text-slate-900 mb-4">{result.score}<span className="text-2xl text-slate-400 font-medium">/100</span></div>
                <p className="text-slate-600 max-w-md mx-auto">
                    {result.passed 
                        ? "Congratulations! You have demonstrated a solid understanding of the core concepts and practical applications." 
                        : "You haven't reached the passing threshold yet. Review the course material and try again to earn your badge."}
                </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-8">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Brain size={18} className="text-indigo-600"/> AI Feedback Analysis</h3>
                <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{result.feedback}</p>
            </div>

            <div className="flex justify-center">
                {!result.passed && (
                    <button onClick={onRetry} className="flex items-center gap-2 px-6 py-3 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        <RotateCcw size={18} /> Retake Assessment
                    </button>
                )}
                {result.passed && (
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
                        Download Certificate
                    </button>
                )}
            </div>
        </div>
    );
};
