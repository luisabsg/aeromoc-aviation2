// ========================================
// 📝 ARQUIVO: client/src/components/DashboardLayout.tsx
// ========================================

import { useState, useEffect, useRef } from 'react'; // ✅ ADD useRef
// ... rest of imports

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const mountedRef = useRef(true); // ✅ ADICIONAR
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // ✅ ADICIONAR

  useEffect(() => {
    mountedRef.current = true;
    
    if (profile?.role === 'aluno') {
      fetchNotificationCount();
      intervalRef.current = setInterval(fetchNotificationCount, 10000); // ✅ STORE NO REF
      
      const handleNotificacoesUpdated = () => {
        fetchNotificationCount();
      };
      window.addEventListener('notificacoes-updated', handleNotificacoesUpdated);
      
      return () => {
        mountedRef.current = false;
        if (intervalRef.current) clearInterval(intervalRef.current); // ✅ CLEANUP MELHORADO
        window.removeEventListener('notificacoes-updated', handleNotificacoesUpdated);
      };
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [profile]);

  const fetchNotificationCount = async () => {
    try { // ✅ WRAP COM TRY/CATCH
      const { data } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('ativo', true)
        .eq('lida', false);
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        setNotificationCount(data?.length || 0);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error('Erro ao buscar contagem de notificações:', err);
      }
    }
  };
  // ... rest stays the same
}
