"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { register, loginApi } from "@/services/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return toast.error("Please fill in all fields.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    try {
      // Register then auto-login
      await register(username, email, password);
      const { access_token } = await loginApi(email, password);
      await login(access_token);
      toast.success("Account created! Welcome to CodeSecureX 🎉");
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Registration failed. Please try again.";
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
            <h1 className="text-2xl font-bold text-[hsl(213,31%,91%)]">Create account</h1>
            <p className="text-sm text-[hsl(215,16%,47%)] mt-1">Join CodeSecureX and start scanning</p>
          </div>

          {/* Form */}
          <form id="register-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="reg-username" className="text-sm font-medium text-[hsl(215,16%,65%)]">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,40%)]" />
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  minLength={3}
                  maxLength={32}
                  className="w-full pl-10 pr-4 py-2.5 bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] text-[hsl(213,31%,91%)] placeholder:text-[hsl(215,16%,35%)] rounded-xl text-sm outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)/0.3] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-[hsl(215,16%,65%)]">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,40%)]" />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[hsl(222,47%,11%)] border border-[hsl(222,47%,18%)] text-[hsl(213,31%,91%)] placeholder:text-[hsl(215,16%,35%)] rounded-xl text-sm outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)/0.3] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-sm font-medium text-[hsl(215,16%,65%)]">
                Password
                <span className="ml-1 text-[hsl(215,16%,40%)] font-normal">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(215,16%,40%)]" />
                <input
                  id="reg-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
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

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= (i + 1) * 3
                          ? password.length >= 12
                            ? "bg-[hsl(142,71%,45%)]"
                            : password.length >= 8
                            ? "bg-[hsl(38,92%,50%)]"
                            : "bg-[hsl(0,72%,51%)]"
                          : "bg-[hsl(222,47%,18%)]"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[hsl(210,100%,56%)] hover:bg-[hsl(210,100%,48%)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-center text-[hsl(215,16%,47%)] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[hsl(210,100%,65%)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
