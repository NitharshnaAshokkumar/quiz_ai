import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "QuizAI - AI-Powered Quiz Platform",
  description: "Generate and take intelligent quizzes on any topic using the power of AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen gradient-bg">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
