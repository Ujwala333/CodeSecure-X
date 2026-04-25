"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { useAuth } from "@/lib/auth-context";
import type { ProfileData } from "@/lib/profile-types";

import ProfileCard from "@/components/profile/ProfileCard";
import ProfileInfoForm from "@/components/profile/ProfileInfoForm";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import DeleteAccountPanel from "@/components/profile/DeleteAccountPanel";

const API_URL = getApiUrl();

type Tab = "info" | "security" | "delete";

export default function ProfilePage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("info");

  useEffect(() => {
    // Wait for auth to initialize
    if (authLoading) return;

    // If no token, redirect immediately
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401) router.replace("/login");
          throw new Error("Failed to fetch profile");
        }
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, authLoading, router]);


  // ─── Loading State ────────────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 flex min-h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[hsl(210,100%,56%)] animate-spin" />
      </div>
    );
  }

  if (!profile || !token) return null;


  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <User className="w-6 h-6 text-[hsl(210,100%,56%)]" />
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Column — Profile Card (1/3 width) */}
        <div className="w-full md:w-1/3 shrink-0">
          <ProfileCard 
            profile={profile} 
            token={token} 
            onAvatarUpdated={(newUrl) => setProfile({ ...profile, avatar_url: newUrl })} 
          />
        </div>

        {/* Right Column — Tabs & Forms (2/3 width) */}
        <div className="w-full md:flex-1 space-y-6">
          
          {/* Custom Tabs Navigation */}
          <div className="flex items-center gap-2 p-1.5 glass rounded-xl w-fit">
            <button 
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "info" 
                  ? "bg-[hsl(222,47%,16%)] text-white shadow" 
                  : "text-[hsl(215,16%,55%)] hover:text-[hsl(213,31%,91%)] hover:bg-[hsl(222,47%,12%)]"
              }`}
            >
              <User className="w-4 h-4" />
              Profile Info
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "security" 
                  ? "bg-[hsl(222,47%,16%)] text-white shadow" 
                  : "text-[hsl(215,16%,55%)] hover:text-[hsl(213,31%,91%)] hover:bg-[hsl(222,47%,12%)]"
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button 
              onClick={() => setActiveTab("delete")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "delete" 
                  ? "bg-[hsl(0,72%,51%/0.1)] text-[hsl(0,72%,60%)] border border-[hsl(0,72%,51%/0.3)] shadow" 
                  : "text-[hsl(0,72%,60%)] hover:bg-[hsl(0,72%,51%/0.1)] hover:border-[hsl(0,72%,51%/0.3)] border border-transparent"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Delete Account
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === "info" && (
              <ProfileInfoForm 
                profile={profile} 
                token={token} 
                onProfileUpdated={(newData) => setProfile(newData)} 
              />
            )}
            
            {activeTab === "security" && (
              <PasswordChangeForm token={token} />
            )}

            {activeTab === "delete" && (
              <DeleteAccountPanel token={token} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

