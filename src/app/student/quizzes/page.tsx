'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Clock, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X,
  Play,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: string;
  batch: string;
  subject: string;
  durationMin: number;
  questions: Question[];
  difficulty: string;
  isAiGenerated: boolean;
  sourceFile: string | null;
}

export default function StudentQuizzes() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startQuizId = searchParams.get('start');

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Active quiz playing states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Evaluation states
  const [scoreSummary, setScoreSummary] = useState<{
    correct: number;
    total: number;
    accuracy: number;
    xpGained: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/quizzes');
        if (res.ok) {
          const data = await res.json();
          // Normalize questions with IDs if missing
          const normalized = data.map((q: any) => ({
            ...q,
            questions: (q.questions || []).map((qn: any, idx: number) => ({
              ...qn,
              id: qn.id || `q-${q.id}-${idx}`
            }))
          }));
          setQuizzes(normalized);

          // Auto start if parameter provided
          if (startQuizId) {
            const qObj = normalized.find((q: Quiz) => q.id === startQuizId);
            if (qObj) {
              handleStartQuiz(qObj);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load quizzes:', e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [startQuizId]);

  // Timer tick
  useEffect(() => {
    if (!activeQuiz || quizFinished || secondsLeft <= 0) {
      if (activeQuiz && secondsLeft === 0 && !quizFinished) {
        handleAutoSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, secondsLeft, quizFinished]);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setSecondsLeft(quiz.durationMin * 60);
    setQuizFinished(false);
    setScoreSummary(null);
  };

  const handleOptionSelect = (questionId: string, optionIdx: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleNext = () => {
    if (activeQuiz && currentIdx < activeQuiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    alert('Timer expired! Submitting answers automatically...');
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    let correctCount = 0;
    const totalQuestions = activeQuiz.questions.length;

    activeQuiz.questions.forEach(q => {
      const studentAns = selectedAnswers[q.id];
      if (studentAns !== undefined && studentAns.toLowerCase() === q.correctAnswer.toLowerCase()) {
        correctCount++;
      }
    });

    const accuracyPct = Math.round((correctCount / totalQuestions) * 100);
    const xpGained = (correctCount * 50) + 20;

    // Submit attempt to API
    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_attempt',
          quizId: activeQuiz.id,
          score: accuracyPct,
          totalQuestions,
          correctAnswers: correctCount,
          accuracyPct,
          xpGained,
          answers: selectedAnswers
        })
      });
    } catch (e) {
      console.error('Failed to submit attempt:', e);
    }

    setScoreSummary({
      correct: correctCount,
      total: totalQuestions,
      accuracy: accuracyPct,
      xpGained
    });
    setQuizFinished(true);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
      </div>
    );
  }

  // LOBBY VIEW
  if (!activeQuiz) {
    return (
      <div className="space-y-6">
        
        {/* Lobby Intro */}
        <div className="p-6 rounded-3xl glass-card text-xs text-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-mono font-bold text-indigo-400 uppercase tracking-wider">Apex Practice Lobby</span>
          </div>
          <h3 className="text-base font-bold text-white mb-1">Assigned Adaptive Quizzes</h3>
          <p className="text-slate-400 leading-relaxed max-w-xl">
            Quizzes are compiled and updated continuously by the Tuition Management AI Agent. Taking a quiz will boost your leaderboard XP and maintain your daily streak count.
          </p>
        </div>

        {/* Quizzes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.length === 0 ? (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-900 rounded-3xl p-6 glass-card bg-slate-950/20">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-200">Vault Cleared</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                No active quizzes assigned. Check back later when Dr. Jenkins uploads new references.
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div 
                key={quiz.id} 
                className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:-translate-y-0.5"
              >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    {quiz.subject} // {quiz.difficulty}
                  </span>
                  {quiz.isAiGenerated && (
                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      AI Generated
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mb-2 leading-relaxed">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{quiz.description}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-900/60 flex items-center justify-between text-xs">
                <div className="flex gap-4 font-mono text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {quiz.durationMin} Mins
                  </span>
                  <span>Qns: {quiz.questions.length}</span>
                </div>

                <button
                  onClick={() => handleStartQuiz(quiz)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <span>Begin Exam</span>
                  <Play className="w-3 h-3 fill-white" />
                </button>
              </div>
            </div>
            ))
          )}
        </div>

      </div>
    );
  }

  // PLAYING VIEW
  const qItem = activeQuiz.questions[currentIdx];
  const progressPct = Math.round(((currentIdx + 1) / activeQuiz.questions.length) * 100);
  const selectedOptionIdx = selectedAnswers[qItem?.id];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {!quizFinished ? (
        <>
          {/* Quiz running headers */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white leading-relaxed">{activeQuiz.title}</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                QUESTION {currentIdx + 1} OF {activeQuiz.questions.length}
              </p>
            </div>

            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-mono font-bold text-xs ${
              secondsLeft < 60 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-indigo-400'
            }`}>
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formatTime(secondsLeft)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Main workspace splits */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            
            {/* Left selector bubbles (3 cols) */}
            <div className="md:col-span-3 glass-card rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-3">Questions list</span>
                <div className="grid grid-cols-4 gap-2">
                  {activeQuiz.questions.map((q, idx) => {
                    const isSelected = selectedAnswers[q.id] !== undefined;
                    const isActive = currentIdx === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold border transition-all duration-200 cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : isSelected 
                            ? 'bg-slate-900 border-indigo-500/30 text-indigo-300' 
                            : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900/60 text-[10px] text-slate-500 font-mono leading-relaxed mt-4">
                Verify choices before submitting exam sheets.
              </div>
            </div>

            {/* Middle Question Board (9 cols) */}
            <div className="md:col-span-9 glass-card rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
              <div className="space-y-6">
                
                {/* Question Area */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                    Question Segment ({qItem?.type})
                  </span>
                  <h2 className="text-sm font-semibold text-white leading-relaxed">
                    {qItem?.question}
                  </h2>
                </div>

                {/* Options Area */}
                <div className="space-y-2.5">
                  {qItem?.options ? (
                    qItem.options.map((opt, oIdx) => {
                      const isOptionSelected = selectedOptionIdx === oIdx.toString();
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleOptionSelect(qItem.id, oIdx.toString())}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-3 transition-all duration-150 cursor-pointer ${
                            isOptionSelected
                              ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-md shadow-indigo-500/5'
                              : 'bg-slate-950/40 border-slate-900 text-slate-300 hover:bg-slate-900/40 hover:border-slate-800'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${
                            isOptionSelected 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span>{opt}</span>
                        </button>
                      );
                    })
                  ) : (
                    // Short Answer or True False
                    qItem?.type === 'TRUE_FALSE' ? (
                      <div className="grid grid-cols-2 gap-4">
                        {['true', 'false'].map((val) => {
                          const isOptionSelected = selectedOptionIdx === val;
                          return (
                            <button
                              key={val}
                              onClick={() => handleOptionSelect(qItem.id, val)}
                              className={`py-4 text-center rounded-2xl border text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
                                isOptionSelected
                                  ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-md'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      // Case study text input area
                      <textarea
                        value={selectedAnswers[qItem?.id] || ''}
                        onChange={(e) => handleOptionSelect(qItem.id, e.target.value)}
                        placeholder="Key in your descriptive formulation response here..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-2xl bg-slate-950/40 border border-slate-900 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    )
                  )}
                </div>

              </div>

              {/* Navigation Actions */}
              <div className="pt-8 border-t border-slate-900/60 mt-6 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-900 hover:bg-slate-900 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentIdx === activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    <span>Submit Sheet</span>
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </>
      ) : (
        // RESULTS REVIEW SCREEN
        <div className="space-y-6">
          
          {/* Scoring Header */}
          {scoreSummary && (
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-950 via-[#0a0d17] to-slate-950 border border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">EVALUATION CONCLUDED</span>
                </div>
                <h2 className="text-base font-bold text-white">Quiz Evaluation Details</h2>
                <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                  Your answers have been checked. Ranks, Streaks, and AI analysis matrices have updated in the cloud ledger.
                </p>
              </div>

              <div className="flex items-center gap-6 shrink-0 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white font-mono">{scoreSummary.accuracy}%</span>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500 mt-1">Accuracy</p>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <span className="text-xl font-bold text-emerald-400 font-mono">+{scoreSummary.xpGained} XP</span>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-slate-500 mt-1.5">Earned</p>
                </div>
              </div>
            </div>
          )}

          {/* Review Sheet */}
          <div className="glass-card rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-indigo-400" />
              <span>Diagnostic Review Sheet</span>
            </h3>

            <div className="space-y-5">
              {activeQuiz.questions.map((q, idx) => {
                const sAns = selectedAnswers[q.id];
                const isCorrect = sAns !== undefined && sAns.toLowerCase() === q.correctAnswer.toLowerCase();
                
                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-purple-400 uppercase">Question {idx + 1}</span>
                      
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                        isCorrect 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                      }`}>
                        {isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200">{q.question}</p>

                    {/* Show option review */}
                    {q.options ? (
                      <div className="grid grid-cols-1 gap-2 text-[11px] mt-2">
                        {q.options.map((opt, oIdx) => {
                          const isPicked = sAns === oIdx.toString();
                          const isRight = q.correctAnswer === oIdx.toString();
                          
                          let optClass = 'bg-slate-950 border-slate-950 text-slate-400';
                          if (isPicked && isRight) optClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium';
                          else if (isPicked && !isRight) optClass = 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-medium';
                          else if (isRight) optClass = 'bg-emerald-500/5 border-emerald-500/15 text-emerald-500/80 font-medium';

                          return (
                            <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${optClass}`}>
                              <span className="font-mono text-[9px] uppercase px-1 rounded bg-slate-900 border border-slate-800">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Show answers text comparison
                      <div className="text-[11px] space-y-1.5 mt-2 bg-slate-950/40 p-3 rounded-xl border border-slate-900 font-mono">
                        <p><span className="text-slate-500">Your choice:</span> <span className={isCorrect ? 'text-emerald-400' : 'text-rose-400'}>{sAns || 'Blank'}</span></p>
                        <p><span className="text-slate-500">Correct key:</span> <span className="text-emerald-400">{q.correctAnswer}</span></p>
                      </div>
                    )}

                    {/* AI Explanation block */}
                    <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.02] text-[10px] leading-relaxed text-slate-400">
                      <strong className="text-indigo-400 font-mono">AI Tutor Insight:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setActiveQuiz(null);
                setQuizFinished(false);
                router.push('/student');
              }}
              className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
