import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import Financial from "./pages/Financial";
import Calendar from "./pages/Calendar";
import Settings from "./pages/Settings";
import Webhooks from "./pages/Webhooks";
import Home from "./pages/Home";
import { Documents } from "./pages/Documents";
import Backups from "./pages/Backups";

// App Router - v1.0.3
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/sessions/:id" component={SessionDetail} />
      <Route path="/financial" component={Financial} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/settings" component={Settings} />
      <Route path="/documents" component={Documents} />
      <Route path="/backups" component={Backups} />
      <Route path="/webhooks" component={Webhooks} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
