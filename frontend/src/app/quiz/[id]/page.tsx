"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { quizzesApi, attemptsApi } from "@/lib/api";
import { Quiz, Question } from "@/types";
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

function Timer({ onTimerRef }: { onTimerRef: (ref: { getSeconds: () => number }) => void }) {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef(0);

  useEffect(() => {
    ref.current = 0;
    const interval = setInterval(() => {
      ref.current += 1;
      setSeconds(ref.current);
    }, 1000);
    onTimerRef({ getSeconds: () => ref.current });
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <Clock className="w-4 h-4" />
      <span className="font-mono text-sm">{mins}:{secs}</span>
    </div>
  );
}

export default function QuizTakePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const quizId = Number(params.id);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<{ getSeconds: () => number }>({ getSeconds: () => 0 });

  useEffect(() => {
    Promise.all([quizzesApi.get(quizId), attemptsApi.start(quizId)])
      .then(([quizRes, attemptRes]) => {
        setQuiz(quizRes.data);
        setAttemptId(attemptRes.data.attempt_id);
      })
      .catch(() => setError("Failed to load quiz. Please try again."))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!attemptId || !quiz) return;
    setSubmitting(true);
    const answerList = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id] || "A",
    }));
    try {
      const res = await attemptsApi.submit(attemptId, {
        answers: answerList,
        time_taken: timerRef.current.getSeconds(),
      });
      router.push(`/attempts/${res.data.id}`);
    } catch {
      setError("Failed to submit. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
        <p className="text-slate-400">Preparing your quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center border border-red-500/20 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">{error || "Quiz not found."}</p>
        </div>
      </div>
    );
  }

  const question = quiz.questions[current];
  const total = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const progressPct = ((current + 1) / total) * 100;
  const options: [string, keyof Question][] = [
    ["A", "option_a"], ["B", "option_b"], ["C", "option_c"], ["D", "option_d"]
  ];
  const isLast = current === total - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">{quiz.topic}</h1>
          <p className="text-sm text-slate-400">Question {current + 1} of {total}</p>
        </div>
        <Timer onTimerRef={(ref) => { timerRef.current = ref; }} />
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Question card */}
      <div className="glass rounded-2xl p-8 border border-white/10 mb-6 animate-fade-in">
        <p className="text-lg text-white font-medium leading-relaxed mb-8">
          {question.question_text}
        </p>
        <div className="space-y-3">
          {options.map(([opt, field]) => {
            const isSelected = answers[question.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => handleSelect(question.id, opt)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-violet-600/20 border-violet-500 text-white"
                    : "bg-white/5 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/8"
                }`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isSelected ? "bg-violet-600 text-white" : "bg-white/10 text-slate-400"
                }`}>
                  {opt}
                </span>
                <span>{question[field] as string}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-violet-400 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <span className="text-sm text-slate-400">{answered}/{total} answered</span>

        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {quiz.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrent(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
              i === current
                ? "bg-violet-600 text-white"
                : answers[q.id]
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                : "bg-white/5 text-slate-500 hover:bg-white/10"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
