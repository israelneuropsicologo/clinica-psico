// @ts-nocheck
import { getLoginUrl } from "@/const";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Home Page - Redirect to Dashboard or Login
 * Displays loading state while authenticating user
 * Version: 1.0.0 - Production Ready
 * 
 * Features:
 * - Automatic redirect to dashboard for authenticated users
 * - Redirect to login for unauthenticated users
 * - Professional loading screen with branding
 */
export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect based on authentication status
  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        navigate("/dashboard");
      } else {
        window.location.href = getLoginUrl();
      }
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-2xl font-bold">E</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Carregando E-Saúde...</p>
        <p className="text-muted-foreground text-xs mt-4">Sistema de Gestão Clínica v1.0.0</p>
      </div>
    </div>
  );
}
