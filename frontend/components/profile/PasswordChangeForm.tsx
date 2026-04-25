"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";

const API_URL = getApiUrl();

interface Props {
  token: string;
}

export default function PasswordChangeForm({ token }: Props) {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Client-side validation hints
  const newPwdMissingUpper = newPwd.length > 0 && !/[A-Z]/.test(newPwd);
  const newPwdMissingDigit = newPwd.length > 0 && !/\d/.test(newPwd);
  const newPwdTooShort = newPwd.length > 0 && newPwd.length < 8;
  const passwordsMismatch = confirmPwd.length > 0 && newPwd !== confirmPwd;

  const valid = 
    currentPwd.length > 0 && 
    newPwd.length >= 8 && 
    /[A-Z]/.test(newPwd) && 
    /\d/.test(newPwd) &&
    newPwd === confirmPwd;

  const handleSave = async () => {
    if (!valid) return;

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_URL}/profile/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPwd,
          new_password: newPwd,
          confirm_password: confirmPwd,
        }),
      });

      if (!res.ok) {
        let errTxt = "Failed to update password";
        try {
          const dat = await res.json();
          errTxt = dat.detail || errTxt;
        } catch { /* ignore */ }
        throw new Error(errTxt);
      }

      // Success
      setStatusMsg({ type: "success", text: "Password updated successfully" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setStatusMsg(null), 4000); // auto-dismiss
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Security</h3>
        <p className="text-sm text-[hsl(215,16%,55%)] mt-1">Change your account password.</p>
      </div>

      <div className="space-y-4 max-w-md">
        
        {/* Current Password */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-[hsl(213,31%,85%)]">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              disabled={isLoading}
              className="w-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[hsl(213,31%,91%)] transition-colors focus:outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)] disabled:opacity-50"
            />
            <button 
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,55%)] hover:text-white"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-[hsl(213,31%,85%)]">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              disabled={isLoading}
              className={`w-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[hsl(213,31%,91%)] transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 ${
                (newPwdTooShort || newPwdMissingUpper || newPwdMissingDigit) ? "border-[hsl(0,72%,51%/0.5)] focus:border-[hsl(0,72%,51%)] focus:ring-[hsl(0,72%,51%)]" : "focus:border-[hsl(210,100%,56%)] focus:ring-[hsl(210,100%,56%)]"
              }`}
            />
            <button 
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,55%)] hover:text-white"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Real-time hints */}
          <div className="flex flex-col gap-1 mt-1">
             {newPwdTooShort && <span className="text-xs text-[hsl(0,72%,60%)] flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Minimum 8 characters</span>}
             {newPwdMissingUpper && <span className="text-xs text-[hsl(0,72%,60%)] flex items-center gap-1"><AlertCircle className="w-3 h-3"/> One uppercase letter required</span>}
             {newPwdMissingDigit && <span className="text-xs text-[hsl(0,72%,60%)] flex items-center gap-1"><AlertCircle className="w-3 h-3"/> One number required</span>}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-medium text-[hsl(213,31%,85%)]">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              disabled={isLoading}
              className={`w-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[hsl(213,31%,91%)] transition-colors focus:outline-none focus:ring-1 disabled:opacity-50 ${
                passwordsMismatch ? "border-[hsl(0,72%,51%/0.5)] focus:border-[hsl(0,72%,51%)] focus:ring-[hsl(0,72%,51%)]" : "focus:border-[hsl(210,100%,56%)] focus:ring-[hsl(210,100%,56%)]"
              }`}
            />
            <button 
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,55%)] hover:text-white"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {passwordsMismatch && <span className="text-xs text-[hsl(0,72%,60%)] flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3"/> Passwords do not match</span>}
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={!valid || isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(210,100%,56%), hsl(210,100%,44%))",
              boxShadow: "0 0 20px hsl(210,100%,56%/0.2)",
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </button>

          {statusMsg && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${
              statusMsg.type === "success" ? "text-[hsl(142,71%,45%)]" : "text-[hsl(0,72%,60%)]"
            } animate-in fade-in slide-in-from-right-2 duration-300`}>
              {statusMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {statusMsg.text}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

