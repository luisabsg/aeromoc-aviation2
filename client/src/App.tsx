/**
 * AeroMoc Aviation — App Router
 * Design: Clean Aviation Dashboard
 * Colors: Navy #1B2A6B, Red #E8192C, Gray #4A4A4A
 * Fonts: Barlow (headings) + Inter (body)
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";

// Aluno pages
import Dashboard from "./pages/aluno/Dashboard";
import NovoAgendamento from "./pages/aluno/NovoAgendamento";
import MeusAgendamentos from "./pages/aluno/MeusAgendamentos";
import CalendarioAluno from "./pages/aluno/Calendario";
import NotificacoesAluno from "./pages/aluno/Notificacoes";

// Instrutor pages
import Solicitacoes from "./pages/instrutor/Solicitacoes";
import CalendarioInstrutor from "./pages/instrutor/Calendario";
import Bloqueios from "./pages/instrutor/Bloqueios";
import Notificacoes from "./pages/instrutor/Notificacoes";

// Adm pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminEscalas from "./pages/admin/Escalas";
import AdminNotificacoes from "./pages/admin/Notificacoes";
import AdminRelatorios from "./pages/admin/Relatorios";
import AdminUsuarios from "./pages/admin/usuarios";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={Login} />

      {/* Dashboard redirect */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      </Route>

      {/* Aluno routes */}
      <Route path="/dashboard/aluno">
        <ProtectedRoute requiredRole="aluno">
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/novo">
        <ProtectedRoute requiredRole="aluno">
          <NovoAgendamento />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/agendamentos">
        <ProtectedRoute requiredRole="aluno">
          <MeusAgendamentos />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/calendario">
        <ProtectedRoute>
          <CalendarioRouter />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/notificacoes-aluno">
        <ProtectedRoute requiredRole="aluno">
          <NotificacoesAluno />
        </ProtectedRoute>
      </Route>

      {/* Instrutor routes */}
      <Route path="/dashboard/solicitacoes">
        <ProtectedRoute requiredRole="professor">
          <Solicitacoes />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/bloqueios">
        <ProtectedRoute requiredRole="professor">
          <Bloqueios />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/notificacoes">
        <ProtectedRoute requiredRole="professor">
          <Notificacoes />
        </ProtectedRoute>
      </Route>

      {/* ADM routes */}
      <Route path="/dashboard/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/admin/escalas">
        <ProtectedRoute requiredRole="admin">
          <AdminEscalas />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/admin/notificacoes">
        <ProtectedRoute requiredRole="admin">
          <AdminNotificacoes />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/admin/relatorios">
        <ProtectedRoute requiredRole="admin">
          <AdminRelatorios />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard/admin/usuarios">
  <ProtectedRoute requiredRole="admin">
    <AdminUsuarios />
  </ProtectedRoute>
</Route>

      {/* 404 sempre por último */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Shared calendar route — renders correct component based on role
function CalendarioRouter() {
  const { profile, loading } = useAuth();

  if (loading || !profile) return null;
  if (profile.role === "professor") return <CalendarioInstrutor />;

  return <CalendarioAluno />;
}

// Dashboard redirect — routes to correct first page
function DashboardRedirect() {
  const { profile } = useAuth();

  if (!profile) return null;

  if (profile.role === "admin") {
    return <Redirect to="/dashboard/admin" />;
  }

  if (profile.role === "professor") {
    return <Redirect to="/dashboard/solicitacoes" />;
  }

  return <Redirect to="/dashboard/aluno" />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;