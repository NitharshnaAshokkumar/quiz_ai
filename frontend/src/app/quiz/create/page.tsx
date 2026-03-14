"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { quizzesApi } from "@/lib/api";
import { Brain, Loader2, Sparkles, ChevronDown } from "lucide-react";

const difficulties = [
  { value: "easy", label: "Easy", desc: "Foundational recall", color: "text-emerald-400 border-emerald-500/40" },
  { value: "medium", label: "Medium", desc: "Conceptual understanding", color: "text-amber-400 border-amber-500/40" },
  { value: "hard", label: "Hard", desc: "Deep analysis", color: "text-red-400 border-red-500/40" },
];

export default function CreateQuizPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  if (!loading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setError("");
    setGenerating(true);
    try {
      const res = await quizzesApi.create({ topic: topic.trim(), difficulty, num_questions: numQuestions });
      router.push(`/quiz/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate quiz. Please check your API key and try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl animate-fade-in">
        <div className="glass rounded-3xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 flex items-center justify-center mx-auto mb-4 glow-sm">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Generate a Quiz</h1>
            <p className="text-slate-400 text-sm">Tell the AI what you want to learn, and it&apos;ll create a quiz for you.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Topic <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all"
                placeholder="e.g. Photosynthesis, World War II, Python decorators..."
                required
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map(({ value, label, desc, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      difficulty === value
                        ? `bg-white/8 ${color}`
                        : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of questions */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Number of Questions: <span className="text-violet-400 font-bold">{numQuestions}</span>
              </label>
              <input
                type="range"
                min={3}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>3 (Quick)</span>
                <span>10 (Standard)</span>
                <span>20 (Comprehensive)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all glow flex items-center justify-center gap-3"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating your quiz...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Generate Quiz
                </>
              )}
            </button>

            {generating && (
              <p className="text-center text-sm text-slate-400">
                ✨ AI is crafting your questions... This may take 10–20 seconds.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
