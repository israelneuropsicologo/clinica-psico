import { useAuth } from "@/_core/hooks/useAuth";
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
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: ClipboardList, label: "Sessões", path: "/sessions" },
  { icon: CalendarDays, label: "Agenda", path: "/calendar" },
  { icon: DollarSign, label: "Financeiro", path: "/financial" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;

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
        <SidebarContent className="gap-0 pt-2">
          <SidebarMenu className="px-2 py-1 gap-0.5">
            {menuItems.map((item) => {
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
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3 border-t">
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
