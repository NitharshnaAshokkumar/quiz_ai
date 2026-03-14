import Link from "next/link";
import { Zap, Brain, Trophy, Clock, ArrowRight, Sparkles } from "lucide-react";

const features = [
  { icon: Brain, title: "AI-Powered Questions", desc: "Gemini AI generates unique, high-quality quiz questions tailored to your topic and difficulty." },
  { icon: Trophy, title: "Track Your Progress", desc: "Review your quiz history, scores, and identify areas for improvement over time." },
  { icon: Clock, title: "Timed Challenges", desc: "Race against the clock with built-in timers and get detailed performance analytics." },
];

const topics = ["Python", "World History", "Machine Learning", "Biology", "Mathematics", "Philosophy", "JavaScript", "Astronomy"];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/30 text-violet-300 text-sm mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-6xl sm:text-7xl font-black leading-tight mb-6">
            <span className="gradient-text">Learn Anything.</span>
            <br />
            <span className="text-white">Quiz Everything.</span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Generate intelligent quizzes on any topic in seconds. Choose your difficulty, track your progress, and master any subject with AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg glow transition-all hover:scale-105"
            >
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl glass border border-white/10 text-slate-300 hover:text-white font-semibold text-lg transition-all hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Floating topic pills */}
        <div className="relative z-10 mt-16 flex flex-wrap gap-3 justify-center max-w-2xl mx-auto animate-fade-in delay-300">
          {topics.map((topic) => (
            <span key={topic} className="px-4 py-2 rounded-full glass text-sm text-slate-400 border border-white/10 hover:border-violet-500/50 hover:text-violet-300 transition-all cursor-default">
              {topic}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-white mb-4">Why QuizAI?</h2>
          <p className="text-slate-400 text-center mb-16">Everything you need to learn smarter, not harder.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className={`glass rounded-2xl p-8 hover:border-violet-500/40 transition-all group animate-fade-in delay-${(i + 1) * 100}`}>
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center mb-6 group-hover:bg-violet-600/30 transition-colors">
                  <Icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                <p className="text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-16 border border-violet-500/20 glow">
          <Zap className="w-12 h-12 text-violet-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">Ready to get smarter?</h2>
          <p className="text-slate-400 mb-8">Join thousands of learners who use QuizAI every day.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-all hover:scale-105 glow"
          >
            Create Your First Quiz
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
