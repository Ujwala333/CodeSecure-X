"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import type { ProfileData } from "@/lib/profile-types";

const API_URL = getApiUrl();

interface Props {
  profile: ProfileData;
  token: string;
  onProfileUpdated: (newData: ProfileData) => void;
}

export default function ProfileInfoForm({ profile, token, onProfileUpdated }: Props) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [email, setEmail] = useState(profile.email);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = fullName !== (profile.full_name || "") || email !== profile.email;

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) return;

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_URL}/profile/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        let errTxt = "Failed to update profile";
        try {
          const dat = await res.json();
          errTxt = dat.detail || errTxt;
        } catch { /* ignore */ }
        throw new Error(errTxt);
      }

      const updatedData: ProfileData = await res.json();
      onProfileUpdated(updatedData);
      
      setStatusMsg({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setStatusMsg(null), 3000); // auto-dismiss
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Profile Information</h3>
        <p className="text-sm text-[hsl(215,16%,55%)] mt-1">Update your personal details and contact info.</p>
      </div>

      <div className="space-y-4 max-w-md">
        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-[hsl(213,31%,85%)]">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            maxLength={100}
            className="w-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(213,31%,91%)] transition-colors focus:outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)] disabled:opacity-50"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-[hsl(213,31%,85%)]">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full bg-[hsl(222,47%,10%)] border border-[hsl(222,47%,18%)] rounded-xl px-4 py-2.5 text-sm text-[hsl(213,31%,91%)] transition-colors focus:outline-none focus:border-[hsl(210,100%,56%)] focus:ring-1 focus:ring-[hsl(210,100%,56%)] disabled:opacity-50"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading || !fullName.trim() || !email.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, hsl(210,100%,56%), hsl(210,100%,44%))",
              boxShadow: "0 0 20px hsl(210,100%,56%/0.2)",
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
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

