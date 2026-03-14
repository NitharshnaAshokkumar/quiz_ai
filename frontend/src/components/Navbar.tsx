"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, LogOut, LayoutDashboard, PlusCircle } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center glow-sm group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QuizAI</span>
          </Link>

          {/* Nav links */}
          {!loading && (
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/quiz/create"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all glow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    New Quiz
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all glow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
