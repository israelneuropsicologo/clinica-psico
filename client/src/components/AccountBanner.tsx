import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export function AccountBanner() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  if (!user) return null;

  const handleLogout = async () => {
    if (confirm("Tem certeza que deseja fazer logout?")) {
      await logoutMutation.mutateAsync();
      navigate("/");
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-900">
            Conta Logada: {user.email}
          </p>
          <p className="text-xs text-amber-700">
            Certifique-se de que está usando a conta correta
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
}
