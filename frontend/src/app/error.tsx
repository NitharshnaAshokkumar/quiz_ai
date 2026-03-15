"use client";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("PAGE ERROR BOUNDARY CAUGHT:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
      <p className="text-slate-300 mb-6 max-w-lg">{error.message || "Unknown error occurred"}</p>
      <div className="bg-black/50 p-4 rounded text-left overflow-auto max-w-full text-xs text-red-400 mb-6">
        {error.stack}
      </div>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-violet-600 rounded-xl text-white font-semibold hover:bg-violet-500"
      >
        Try again
      </button>
    </div>
  );
}
