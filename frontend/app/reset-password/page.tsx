"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/services/api";
import { Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setIsSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass max-w-md w-full p-8 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 bg-[hsl(0,72%,51%)/0.1] rounded-2xl flex items-center justify-center mx-auto border border-[hsl(0,72%,51%)/0.2]">
            <Lock className="w-8 h-8 text-[hsl(0,72%,51%)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Invalid Link</h1>
            <p className="text-[hsl(215,16%,55%)]">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-[hsl(210,100%,56%)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass max-w-md w-full p-8 rounded-3xl text-center space-y-6">
          <div className="w-16 h-16 bg-[hsl(142,71%,45%)/0.1] rounded-2xl flex items-center justify-center mx-auto border border-[hsl(142,71%,45%)/0.2]">
            <CheckCircle2 className="w-8 h-8 text-[hsl(142,71%,45%)]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Success!</h1>
            <p className="text-[hsl(215,16%,55%)]">
              Your password has been reset. Redirecting you to login...
            </p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(210,100%,56%)] mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass max-w-md w-full p-8 rounded-3xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
          <p className="text-[hsl(215,16%,55%)]">
            Create a strong password to protect your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-[hsl(213,31%,91%)]">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,45%)]" />
                <input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[hsl(222,47%,6%)] border border-[hsl(222,47%,14%)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,56%)]/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-[hsl(213,31%,91%)]">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,45%)]" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[hsl(222,47%,6%)] border border-[hsl(222,47%,14%)] rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(210,100%,56%)]/40 transition-all"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[hsl(210,100%,56%)] hover:bg-[hsl(210,100%,48%)] text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
