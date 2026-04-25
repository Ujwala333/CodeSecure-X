"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-url";
import { useAuth } from "@/lib/auth-context";

const API_URL = getApiUrl();

interface Props {
  token: string;
}

export default function DeleteAccountPanel({ token }: Props) {
  const router = useRouter();
  const { logout } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_URL}/profile/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete account");
      }

      // If successful, log out and redirect
      logout();
      router.push("/register");
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 border border-[hsl(0,72%,51%/0.3)] bg-[hsl(0,72%,51%/0.02)] space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[hsl(0,72%,60%)] flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-[hsl(215,16%,55%)] mt-1">
          Once you delete your account, there is no going back. Please be certain.
        </p>
      </div>

      <div className="max-w-md pt-2">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-transparent border border-[hsl(0,72%,51%/0.5)] text-[hsl(0,72%,60%)] transition-colors hover:bg-[hsl(0,72%,51%/0.1)] hover:border-[hsl(0,72%,51%)] active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm font-medium text-white">
              Are you absolute sure? This will permanently delete your stats and data.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,45%)] transition-all disabled:opacity-50 active:scale-95"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete My Account"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-[hsl(213,31%,91%)] bg-[hsl(222,47%,14%)] hover:bg-[hsl(222,47%,16%)] border border-[hsl(222,47%,20%)] transition-all disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
            </div>
            {errorMsg && (
              <p className="text-sm text-[hsl(0,72%,60%)] mt-2">{errorMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

