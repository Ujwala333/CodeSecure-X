"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { loginApi, forgotPassword } from "@/services/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email.");
    
    setLoading(true);
    try {
      if (isForgot) {
        await forgotPassword(email);
        toast.success("Reset link sent if email exists.");
        setIsForgot(false);
      } else {
        if (!password) {
          setLoading(false);
          return toast.error("Please enter your password.");
        }
        const { access_token } = await loginApi(email, password);
        const userData = await login(access_token);
        toast.success("Welcome back!");
        
        const isAdmin = userData?.role === "admin";
        if (isAdmin) {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (isForgot ? "Failed to send reset email." : "Login failed. Check your credentials.");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[hsl(222,47%,5%)]">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[hsl(210,100%,56%)/0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[hsl(222,47%,8%)] border border-[hsl(222,47%,16%)] rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[hsl(210,100%,56%)] rounded-xl flex items-center justify-center glow mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(213,31%,91%)]">
              {isForgot ? "Reset Password" : "Welcome back"}
            </h1>
            <p className="text-sm text-center text-[hsl(215,16%,47%)] mt-1">
              {isForgot 
                ? "Enter your email to receive a reset link" 
                : "Sign in to your CodeSecureX account"}
            </p>
          </div>

          {/* Form */}
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-[hsl(215,16%,65%)]">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,40%)]" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] text-[hsl(213,31%,91%)] placeholder:text-[hsl(215,16%,35%)] rounded-xl text-sm outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)/0.3] transition-all"
                />
              </div>
            </div>

            {/* Password - Hidden in Forgot mode */}
            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-[hsl(215,16%,65%)]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-xs text-[hsl(210,100%,65%)] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,40%)]" />
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] text-[hsl(213,31%,91%)] placeholder:text-[hsl(215,16%,35%)] rounded-xl text-sm outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)/0.3] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,40%)] hover:text-[hsl(215,16%,65%)] transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[hsl(210,100%,56%)] hover:bg-[hsl(210,100%,48%)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isForgot ? "Sending..." : "Signing in..."}
                </>
              ) : (
                isForgot ? "Send Reset Link" : "Sign in"
              )}
            </button>

            {isForgot && (
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="w-full flex items-center justify-center gap-2 text-sm text-[hsl(215,16%,47%)] hover:text-white transition-colors py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            )}
          </form>

          {/* Footer */}
          {!isForgot && (
            <p className="text-sm text-center text-[hsl(215,16%,47%)] mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[hsl(210,100%,65%)] hover:underline font-medium">
                Create one
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
