import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Sun,
  Users,
  CalendarDays,
  ClipboardList,
  DollarSign,
  Stethoscope,
  Settings as SettingsIcon,
  ExternalLink,
  Zap,
  FileText,
  HardDrive,
  Inbox,
  CheckSquare,
  Lightbulb,
  BarChart3,
  Brain,
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Inbox, label: "Leads", path: "/leads" },
  { icon: CheckSquare, label: "Agendamentos Diretos", path: "/direct-bookings" },
  { icon: ClipboardList, label: "Sessões", path: "/sessions" },
  { icon: CalendarDays, label: "Agenda", path: "/calendar" },
  { icon: Lightbulb, label: "Pistas de IA", path: "/pistas" },
  { icon: Brain, label: "Dashboard de IA", path: "/ai-analytics" },
  { icon: DollarSign, label: "Financeiro", path: "/financial" },
  { icon: FileText, label: "Documentos", path: "/documents" },
  { icon: SettingsIcon, label: "Configurações", path: "/settings" },
  { icon: Zap, label: "Integração", path: "/webhooks" },
  { icon: HardDrive, label: "Backups", path: "/backups", adminOnly: true },
  { icon: BarChart3, label: "Relatórios Gerenciais", path: "/admin/reports", adminOnly: true },
  { icon: FileText, label: "Auditoria", path: "/admin/audit", adminOnly: true }
];

const externalLinks = [
  { icon: ExternalLink, label: "Módulo de Relatórios", url: "https://clinic-rep-ungcdbcu.manus.space" },
  { icon: ExternalLink, label: "Backoffice do Site", url: "https://psicologo.manus.space/admin/configuracoes" },
  { icon: ExternalLink, label: "Site Profissional", url: "https://psicologo.manus.space" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const SELECTED_USER_KEY = "selected-clinician-user-id";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Stethoscope className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold tracking-tight">E-Saúde</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Plataforma de gestão clínica para psicólogos. Faça login para continuar.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full"
          >
            Entrar na plataforma
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    const saved = localStorage.getItem(SELECTED_USER_KEY);
    const userId = saved || (user?.id?.toString() ?? "");
    // Nunca retornar string vazia - Radix Select não aceita value=""
    return userId || "default";
  });
  const { data: allUsers } = trpc.admin.getAllUsers.useQuery();

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem(SELECTED_USER_KEY, userId);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="border-r">
        {/* Header */}
        <SidebarHeader className="h-16 justify-center border-b">
          <div className="flex items-center gap-3 px-2 w-full">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
              aria-label="Toggle navigation"
            >
              <PanelLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            {!isCollapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <Stethoscope className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold tracking-tight text-sm truncate">E-Saúde</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="gap-0 pt-2 flex flex-col">
          <SidebarMenu className="px-2 py-1 gap-0.5">
            {menuItems.map((item: any) => {
              // Skip admin-only items if user is not admin
              if (item.adminOnly && user?.role !== "admin") return null;
              
              const isActive = location.startsWith(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-10 transition-all font-medium"
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={isActive ? "text-primary" : ""}>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
          
          {/* External Links - Acesso Administrativo */}
          <div className="mt-auto pt-2 border-t">
            <SidebarMenu className="px-2 py-1 gap-0.5">
              {externalLinks.map((link) => (
                <SidebarMenuItem key={link.url}>
                  <SidebarMenuButton
                    onClick={() => window.open(link.url, "_blank")}
                    tooltip={link.label}
                    className="h-10 transition-all font-medium"
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t">
          {/* User Selector */}
          {allUsers && allUsers.length > 0 && (
            <div className="mb-3 pb-3 border-b">
              <label className="text-xs text-muted-foreground block mb-2">Clínico</label>
              <Select value={selectedUserId || ""} onValueChange={handleUserChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            {!isCollapsed && (
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sm text-muted-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={toggleTheme}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-8 w-8 border shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{user?.email || "-"}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                {user?.role === "admin" ? "Administrador" : "Psicólogo"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLocation("/admin/users")}
                className="cursor-pointer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>Painel Administrativo</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
