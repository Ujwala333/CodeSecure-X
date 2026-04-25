"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Role = "admin" | "user";

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: Role
) {
  return function ProtectedPage(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (isLoading) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      if (requiredRole === "admin" && user.role !== "admin") {
        toast.error("Admin access only.");
        router.replace("/dashboard");
      }
    }, [isLoading, user, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(222,47%,5%)]">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(210,100%,56%)]" />
        </div>
      );
    }

    if (!user) return null;
    if (requiredRole === "admin" && user.role !== "admin") return null;

    return <Component {...props} />;
  };
}
