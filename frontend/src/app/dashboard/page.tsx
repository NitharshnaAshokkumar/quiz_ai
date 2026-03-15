"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { attemptsApi, quizzesApi } from "@/lib/api";
import { Attempt, Quiz, QuizSchedule } from "@/types";
import { useRouter } from "next/navigation";
import { PlusCircle, Trophy, Clock, Target, BookOpen, TrendingUp, Zap, ChevronRight, BarChart2, Calendar, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, CartesianGrid } from "recharts";

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
  const [schedules, setSchedules] = useState<QuizSchedule[]>([]);
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [dataLoading, setDataLoading] = useState(true);

  // Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTopic, setScheduleTopic] = useState("");
  const [scheduleDifficulty, setScheduleDifficulty] = useState("medium");
  const [scheduleFrequency, setScheduleFrequency] = useState("daily");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!loading && isAuthenticated) {
      Promise.all([attemptsApi.history(), quizzesApi.list(), attemptsApi.stats(), quizzesApi.getSchedules()])
        .then(([attRes, quizRes, statsRes, schedRes]) => {
          setAttempts(attRes.data);
          setQuizzes(quizRes.data);
          setStats(statsRes.data);
          setSchedules(schedRes.data);
        })
        .finally(() => setDataLoading(false));
    }
  }, [loading, isAuthenticated, router]);

  if (loading || dataLoading || !stats) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTopic.trim()) return;
    try {
      const res = await quizzesApi.createSchedule({
        topic: scheduleTopic,
        difficulty: scheduleDifficulty,
        frequency: scheduleFrequency,
      });
      setSchedules([res.data, ...schedules]);
      setIsScheduleModalOpen(false);
      setScheduleTopic("");
    } catch (e) {
      console.error(e);
      alert("Failed to schedule quiz.");
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await quizzesApi.deleteSchedule(id);
      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const avgScore = stats.average_score || 0;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0;

  const statCards = [
    { label: "Quizzes Created", value: quizzes.length, icon: BookOpen, color: "text-blue-400" },
    { label: "Total Attempts", value: stats.total_quizzes, icon: Target, color: "text-violet-400" },
    { label: "Avg Score", value: `${avgScore.toFixed(0)}%`, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Best Score", value: `${bestScore.toFixed(0)}%`, icon: Trophy, color: "text-amber-400" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
              <Icon className="w-16 h-16 transform rotate-12" />
            </div>
            <Icon className={`w-6 h-6 ${color} mb-3`} />
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-sm font-medium text-slate-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      {attempts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="glass rounded-2xl p-6 border border-white/5">
             <div className="flex items-center gap-2 mb-6">
               <TrendingUp className="w-5 h-5 text-emerald-400" />
               <h2 className="text-lg font-semibold text-white">Score History</h2>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stats.history} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                   <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95', borderRadius: '12px', color: '#fff' }}
                     itemStyle={{ color: '#a78bfa' }}
                   />
                   <Line type="monotone" dataKey="percentage" name="Score %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#1e1b4b' }} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff' }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
             <div className="flex items-center gap-2 mb-6">
               <BarChart2 className="w-5 h-5 text-amber-400" />
               <h2 className="text-lg font-semibold text-white">Topic Mastery</h2>
             </div>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.topics}>
                   <PolarGrid stroke="#ffffff20" />
                   <PolarAngleAxis dataKey="topic" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                   <Radar name="Avg Score" dataKey="average" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#1e1b4b', borderColor: '#4c1d95', borderRadius: '12px', color: '#fff' }}
                   />
                 </RadarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        {/* My Schedules */}
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-400" /> My Schedules
            </h2>
            <button onClick={() => setIsScheduleModalOpen(true)} className="text-violet-400 hover:text-white transition-colors glow-sm border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm font-medium">
              <PlusCircle className="w-4 h-4" /> New
            </button>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No schedules yet. Set up recurring quizzes!</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1 styled-scrollbar">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col relative group">
                  <div className="flex items-start justify-between">
                    <p className="text-white font-medium pr-6">{schedule.topic}</p>
                    <button onClick={() => handleDeleteSchedule(schedule.id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <DifficultyBadge difficulty={schedule.difficulty} />
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${schedule.frequency === 'daily' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-purple-400 bg-purple-400/10 border-purple-400/20'}`}>
                      {schedule.frequency}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-3 align-bottom">
                    Created: {new Date(schedule.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in shadow-2xl">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Create New Schedule</h3>
              <p className="text-slate-400 text-sm">We&apos;ll email you a generated quiz automatically.</p>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Topic</label>
                <input
                  type="text"
                  required
                  value={scheduleTopic}
                  onChange={(e) => setScheduleTopic(e.target.value)}
                  placeholder="e.g. System Design, World History"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={scheduleDifficulty}
                    onChange={(e) => setScheduleDifficulty(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all glow-sm"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
