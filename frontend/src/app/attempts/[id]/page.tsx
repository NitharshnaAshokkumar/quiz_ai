"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { attemptsApi, quizzesApi } from "@/lib/api";
import { AttemptDetail } from "@/types";
import { Trophy, Clock, Target, CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowLeft, PlusCircle } from "lucide-react";

interface ReviewQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  order: number;
  selected?: string;
  is_correct?: boolean;
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function AttemptDetailPage({ params }: { params: { id: string } }) {
  const attemptId = Number(params.id);
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    attemptsApi.detail(attemptId).then(async (res) => {
      const att = res.data;
      setAttempt(att);
      const reviewRes = await quizzesApi.review(att.quiz);
      const qs: ReviewQuestion[] = reviewRes.data.questions.map((q: ReviewQuestion) => {
        const userAns = att.answers.find((a: any) => a.question === q.id);
        return { ...q, selected: userAns?.selected_option, is_correct: userAns?.is_correct };
      });
      setQuestions(qs);
    }).finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!attempt) return null;

  const pct = attempt.percentage;
  const scoreColor = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  const scoreRing = pct >= 80 ? "border-emerald-500" : pct >= 60 ? "border-amber-500" : "border-red-500";
  const message = pct >= 80 ? "Outstanding! 🎉" : pct >= 60 ? "Good effort! 💪" : "Keep practicing! 📚";

  const optionLabels: Record<string, keyof ReviewQuestion> = {
    A: "option_a", B: "option_b", C: "option_c", D: "option_d",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Result card */}
      <div className="glass rounded-3xl p-8 border border-white/10 text-center mb-8 animate-fade-in">
        <div className={`w-28 h-28 rounded-full border-4 ${scoreRing} flex items-center justify-center mx-auto mb-4`}>
          <span className={`text-3xl font-black ${scoreColor}`}>{pct.toFixed(0)}%</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{message}</h1>
        <p className="text-slate-400 mb-6">{attempt.quiz_topic}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-white/5">
            <Target className="w-5 h-5 text-violet-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{attempt.score}/{attempt.total_questions}</div>
            <div className="text-xs text-slate-400">Score</div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5">
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{formatTime(attempt.time_taken)}</div>
            <div className="text-xs text-slate-400">Time Taken</div>
          </div>
          <div className="glass rounded-xl p-4 border border-white/5">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <div className={`text-xl font-bold ${scoreColor}`}>{pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : "Needs Work"}</div>
            <div className="text-xs text-slate-400">Grade</div>
          </div>
        </div>

        <Link
          href="/quiz/create"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
        >
          <PlusCircle className="w-4 h-4" /> Take Another Quiz
        </Link>
      </div>

      {/* Question review */}
      <h2 className="text-lg font-semibold text-white mb-4">Question Review</h2>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={q.id} className={`glass rounded-2xl border transition-all ${q.is_correct ? "border-emerald-500/20" : "border-red-500/20"}`}>
            <button
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              {q.is_correct
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              }
              <span className="text-white text-sm flex-1">{i + 1}. {q.question_text}</span>
              {expanded === q.id
                ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              }
            </button>
            {expanded === q.id && (
              <div className="px-4 pb-4 space-y-2">
                {["A", "B", "C", "D"].map((opt) => {
                  const isCorrect = opt === q.correct_option;
                  const isSelected = opt === q.selected;
                  return (
                    <div key={opt} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      isCorrect ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                      : isSelected && !isCorrect ? "bg-red-500/10 border border-red-500/30 text-red-300"
                      : "text-slate-400"
                    }`}>
                      <span className="font-bold flex-shrink-0">{opt}.</span>
                      <span>{q[optionLabels[opt]] as string}</span>
                      {isCorrect && <span className="ml-auto text-xs font-medium">✓ Correct</span>}
                      {isSelected && !isCorrect && <span className="ml-auto text-xs font-medium">Your answer</span>}
                    </div>
                  );
                })}
                {q.explanation && (
                  <div className="mt-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
                    <span className="font-semibold">Explanation: </span>{q.explanation}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
