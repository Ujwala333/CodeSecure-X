"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Calendar } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import type { ProfileData } from "@/lib/profile-types";

// Note: Use absolute URL for the API so it goes to FastAPI correctly in development
const API_URL = getApiUrl();

interface Props {
  profile: ProfileData;
  token: string;
  onAvatarUpdated: (newUrl: string) => void;
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// Convert MM YYYY to "Member since Jan 2024" format
function formatMemberSince(isoDate: string) {
  const date = new Date(isoDate);
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `Member since ${month} ${date.getFullYear()}`;
}

export default function ProfileCard({ profile, token, onAvatarUpdated }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorInfo(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let msg = "Upload failed";
        try {
          const errData = await res.json();
          msg = errData.detail || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      const data = await res.json();
      onAvatarUpdated(data.avatar_url);
    } catch (err: any) {
      setErrorInfo(err.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      e.target.value = "";
    }
  };

  const initials = getInitials(profile.full_name, profile.email);

  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
      
      {/* ── Avatar Circle ── */}
      <div className="relative group">
        <div 
          className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-2 border-[hsl(222,47%,18%)] shadow-lg transition-transform duration-300 group-hover:scale-105"
          style={{ background: profile.avatar_url ? "transparent" : "hsl(210,100%,56%/0.15)", color: "hsl(210,100%,56%)" }}
        >
          {profile.avatar_url ? (
            <Image 
              src={profile.avatar_url} 
              alt={profile.full_name || "Avatar"} 
              width={112} 
              height={112} 
              className="object-cover w-full h-full"
              unoptimized
            />
          ) : (
            <span className="text-3xl font-bold tracking-tight">{initials}</span>
          )}
          
          {/* Uploading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10 transition-opacity">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Change Photo Button */}
        <div className="absolute -bottom-2 -right-2">
          <label 
            htmlFor="avatar-upload"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[hsl(222,47%,16%)] border-2 border-[hsl(222,47%,8%)] shadow-md text-[hsl(215,16%,65%)] hover:text-white hover:bg-[hsl(210,100%,56%)] hover:border-[hsl(210,100%,56%)] transition-all cursor-pointer z-20 group-hover:-translate-y-1 group-hover:-translate-x-1"
            title="Change Photo"
          >
            <Camera className="w-4 h-4" />
          </label>
          <input 
            id="avatar-upload" 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            className="hidden" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      {errorInfo && (
        <p className="text-xs text-[hsl(0,72%,60%)] font-medium max-w-[200px] bg-[hsl(0,72%,51%/0.1)] px-2 py-1 rounded">
          {errorInfo}
        </p>
      )}

      {/* ── User Info ── */}
      <div className="space-y-1 mt-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {profile.full_name || "User"}
        </h2>
        <p className="text-sm text-[hsl(215,16%,55%)]">
          {profile.email}
        </p>
      </div>

      {/* ── Badges ── */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-4 border-t border-[hsl(222,47%,14%)] w-full">
        {/* Role Badge */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(210,100%,56%/0.15)] text-[hsl(210,100%,56%)] border border-[hsl(210,100%,56%/0.3)]">
          {profile.role}
        </span>
        {/* Plan Badge */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[hsl(280,80%,60%/0.15)] text-[hsl(280,80%,70%)] border border-[hsl(280,80%,60%/0.3)]">
          {profile.plan}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[hsl(215,16%,45%)] mt-2">
        <Calendar className="w-3.5 h-3.5" />
        {formatMemberSince(profile.member_since)}
      </div>

    </div>
  );
}

