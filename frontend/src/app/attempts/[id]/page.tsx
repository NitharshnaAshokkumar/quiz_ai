"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { attemptsApi, quizzesApi } from "@/lib/api";
import { AttemptDetail } from "@/types";
import { Trophy, Clock, Target, CheckCircle2, XCircle, ChevronDown, ChevronUp, ArrowLeft, PlusCircle, RotateCcw, Share2, Crown, Medal } from "lucide-react";

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
  const [leaderboard, setLeaderboard] = useState<AttemptDetail[]>([]);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    attemptsApi.detail(attemptId).then(async (res) => {
      const att = res.data;
      setAttempt(att);
      const reviewRes = await quizzesApi.review(att.quiz);
      const qs: ReviewQuestion[] = reviewRes.data.questions.map((q: ReviewQuestion) => {
        const userAns = att.answers.find((a: { question: number; selected_option: string; is_correct: boolean }) => a.question === q.id);
        return { ...q, selected: userAns?.selected_option, is_correct: userAns?.is_correct };
      });
      setQuestions(qs);

      // Try fetching leaderboard (only works if quiz is public)
      try {
        const lbRes = await quizzesApi.leaderboard(att.quiz);
        setLeaderboard(lbRes.data);
      } catch {
        // Not public or error, ignore
      }
    }).finally(() => setLoading(false));
  }, [attemptId]);

  const handleShare = () => {
    if (!attempt) return;
    const url = `${window.location.origin}/quiz/${attempt.quiz}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all"
          >
            <Share2 className="w-4 h-4" /> {copied ? "Link Copied!" : "Share Quiz"}
          </button>
          <Link
            href={`/quiz/${attempt.quiz}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white border border-violet-500/30 text-sm font-medium transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retake Quiz
          </Link>
          <Link
            href="/quiz/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
          >
            <PlusCircle className="w-4 h-4" /> New Quiz
          </Link>
        </div>
      </div>

      {/* Leaderboard Section */}
      {leaderboard.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard (Top 10)
          </h2>
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            <div className="divide-y divide-white/5">
              {leaderboard.map((lbAttempt, idx) => (
                <div key={lbAttempt.id} className={`flex items-center justify-between p-4 ${lbAttempt.id === attempt.id ? 'bg-violet-500/10' : 'hover:bg-white/5'} transition-colors`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? "bg-amber-400/20 text-amber-400" :
                      idx === 1 ? "bg-slate-300/20 text-slate-300" :
                      idx === 2 ? "bg-amber-700/20 text-amber-600" :
                      "bg-white/5 text-slate-400"
                    }`}>
                      {idx === 0 ? <Crown className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {lbAttempt.percentage.toFixed(0)}% Score
                        {lbAttempt.id === attempt.id && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">You</span>}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {formatTime(lbAttempt.time_taken)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Medal className={`w-5 h-5 ${
                      lbAttempt.percentage >= 80 ? "text-emerald-400" : 
                      lbAttempt.percentage >= 60 ? "text-amber-400" : "text-slate-600"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
