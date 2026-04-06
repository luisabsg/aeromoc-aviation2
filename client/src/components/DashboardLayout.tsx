/**
 * AeroMoc Aviation — Dashboard Layout
 * Design: Clean Aviation Dashboard
 * Navy sidebar (#1B2A6B), white content area, Barlow + Inter
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  Bell,
  ShieldCheck,
  Plane,
  CalendarDays,
  ClipboardList,
  PlusCircle,
  LogOut,
  Menu,
  X,
  Ban,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LOGO_URL =
  'https://d2xsxph8kpxj0f.cloudfront.net/310519663517498116/VRSe3ygr3YDCgGhtaryZLm/aeromoc-logo_05fd6baf.png';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  {
    label: 'Dashboard Admin',
    href: '/dashboard/admin',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    label: 'Relatórios',
    href: '/dashboard/admin/relatorios',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Escalas',
    href: '/dashboard/admin/escalas',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Notificações',
    href: '/dashboard/admin/notificacoes',
    icon: <Bell className="w-5 h-5" />,
  },
];

const alunoNav: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard/aluno',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Novo Agendamento',
    href: '/dashboard/novo',
    icon: <PlusCircle className="w-5 h-5" />,
  },
  {
    label: 'Meus Agendamentos',
    href: '/dashboard/agendamentos',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: 'Calendário',
    href: '/dashboard/calendario',
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: 'Notificações',
    href: '/dashboard/notificacoes-aluno',
    icon: <Bell className="w-5 h-5" />,
  },
];

const instrutorNav: NavItem[] = [
  {
    label: 'Solicitações',
    href: '/dashboard/solicitacoes',
    icon: <ClipboardList className="w-5 h-5" />,
  },
  {
    label: 'Calendário',
    href: '/dashboard/calendario',
    icon: <CalendarDays className="w-5 h-5" />,
  },
  {
    label: 'Bloqueios',
    href: '/dashboard/bloqueios',
    icon: <Ban className="w-5 h-5" />,
  },
  {
    label: 'Notificações',
    href: '/dashboard/notificacoes',
    icon: <Bell className="w-5 h-5" />,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({
  children,
  title,
}: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    fetchNotificationCount();

    const interval = setInterval(fetchNotificationCount, 10000);

    const handleNotificacoesUpdated = () => {
      fetchNotificationCount();
    };

    window.addEventListener('notificacoes-updated', handleNotificacoesUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        'notificacoes-updated',
        handleNotificacoesUpdated
      );
    };
  }, [profile]);

  const fetchNotificationCount = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('notificacoes')
        .select('id', { count: 'exact', head: false })
        .eq('ativo', true)
        .eq('lida', false);

      // Ajuste opcional por perfil:
      // admin vê tudo, aluno só as dele/gerais, professor só as dele/gerais
      // Se sua tabela ainda não tiver esse controle, pode deixar sem filtros extras.

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar notificações:', error);
        return;
      }

      setNotificationCount(data?.length || 0);
    } catch (error) {
      console.error('Erro inesperado ao buscar notificações:', error);
    }
  };

  const navItems =
    profile?.role === 'admin'
      ? adminNav
      : profile?.role === 'professor'
      ? instrutorNav
      : alunoNav;

  const roleLabel =
    profile?.role === 'admin'
      ? 'Administrador'
      : profile?.role === 'professor'
      ? 'Instrutor'
      : 'Aluno';

  const isAlunoHome =
    profile?.role === 'aluno' && location === '/dashboard/aluno';

  const handleLogout = async () => {
    await signOut();
    toast.success('Sessão encerrada com sucesso.');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl p-4 shadow-lg">
            <img
              src={LOGO_URL}
              alt="AeroMoc Aviation"
              className="h-20 object-contain"
            />
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: '#E8192C' }}
          >
            {profile?.nome?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {profile?.nome ?? 'Usuário'}
            </p>
            <p className="text-blue-300 text-xs">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-2 mb-3">
          Menu
        </p>

        {navItems.map((item) => {
          const isActive =
            location === item.href || location.startsWith(item.href + '/');

          const isNotificationsRoute =
            item.href === '/dashboard/notificacoes' ||
            item.href === '/dashboard/notificacoes-aluno' ||
            item.href === '/dashboard/admin/notificacoes';

          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className={isActive ? 'text-white' : 'text-blue-300'}>
                  {item.icon}
                </span>

                <span className="flex-1">{item.label}</span>

                {isNotificationsRoute && notificationCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}

                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-5 h-5 text-blue-300" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4F6FA]">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 fixed top-0 left-0 h-full z-30"
        style={{
          background: 'linear-gradient(180deg, #1B2A6B 0%, #0D1B3E 100%)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative flex flex-col w-72 h-full z-50"
            style={{
              background: 'linear-gradient(180deg, #1B2A6B 0%, #0D1B3E 100%)',
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-600"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {title && !isAlunoHome && (
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-[#1B2A6B]" />
                <h1 className="text-lg font-bold text-[#1B2A6B]">{title}</h1>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
              style={{ background: '#E8192C' }}
            >
              {profile?.nome?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              {profile?.nome}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}