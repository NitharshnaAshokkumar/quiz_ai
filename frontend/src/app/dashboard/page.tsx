"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { attemptsApi, quizzesApi } from "@/lib/api";
import { Attempt, Quiz } from "@/types";
import { useRouter } from "next/navigation";
import { PlusCircle, Trophy, Clock, Target, BookOpen, TrendingUp, Zap, ChevronRight } from "lucide-react";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    hard: "text-red-400 bg-red-400/10 border-red-400/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colors[difficulty] || colors.medium}`}>
      {difficulty}
    </span>
  );
}

function ScoreBadge({ percentage }: { percentage: number }) {
  const color = percentage >= 80 ? "text-emerald-400" : percentage >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={`text-lg font-bold ${color}`}>{percentage.toFixed(0)}%</span>;
}

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!loading && isAuthenticated) {
      Promise.all([attemptsApi.history(), quizzesApi.list()])
        .then(([attRes, quizRes]) => {
          setAttempts(attRes.data);
          setQuizzes(quizRes.data);
        })
        .finally(() => setDataLoading(false));
    }
  }, [loading, isAuthenticated, router]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const avgScore = attempts.length ? attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length : 0;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0;

  const stats = [
    { label: "Quizzes Created", value: quizzes.length, icon: BookOpen, color: "text-blue-400" },
    { label: "Attempts", value: attempts.length, icon: Target, color: "text-violet-400" },
    { label: "Avg Score", value: `${avgScore.toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Best Score", value: `${bestScore.toFixed(0)}%`, icon: Trophy, color: "text-amber-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.username}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Ready to learn something new today?</p>
        </div>
        <Link
          href="/quiz/create"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all glow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          New Quiz
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-6 border border-white/5">
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attempts */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-violet-400" /> Recent Attempts
            </h2>
          </div>
          {attempts.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No attempts yet. Take your first quiz!</p>
              <Link href="/quiz/create" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm">
                Create a quiz →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 6).map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/attempts/${attempt.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{attempt.quiz_topic}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyBadge difficulty={attempt.quiz_difficulty} />
                      <span className="text-xs text-slate-500">
                        {attempt.score}/{attempt.total_questions} correct
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <ScoreBadge percentage={attempt.percentage} />
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Quizzes */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-400" /> My Quizzes
            </h2>
          </div>
          {quizzes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No quizzes yet. Generate your first one!</p>
              <Link href="/quiz/create" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm">
                Create a quiz →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.slice(0, 6).map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-violet-500/30 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{quiz.topic}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyBadge difficulty={quiz.difficulty} />
                      <span className="text-xs text-slate-500">{quiz.question_count} questions</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors ml-4" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
