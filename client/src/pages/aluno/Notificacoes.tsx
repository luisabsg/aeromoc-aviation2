// ========================================
// 📝 ARQUIVO: client/src/pages/aluno/Notificacoes.tsx
// ========================================

import { useState, useEffect, useRef } from 'react'; // ✅ ADD useRef
// ... rest of imports

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true); // ✅ ADICIONAR
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // ✅ ADICIONAR

  useEffect(() => {
    mountedRef.current = true;
    fetchNotificacoes();
    // Atualizar a cada 5 segundos para notificações em tempo real
    intervalRef.current = setInterval(fetchNotificacoes, 5000); // ✅ STORE NO REF
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current); // ✅ CLEANUP MELHORADO
    };
  }, []);

  const fetchNotificacoes = async () => {
    try { // ✅ WRAP COM TRY/CATCH
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      if (!mountedRef.current) return; // ✅ ADICIONAR CHECK
      
      setNotificacoes(data as Notificacao[]);
      // Marcar todas como lidas quando abre a página
      await markAllAsRead(data.map(n => n.id));
    } catch (err) {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        console.error('Erro ao buscar notificações:', err);
      }
    } finally {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        setLoading(false);
      }
    }
  };

  const markAllAsRead = async (ids: string[]) => {
    try { // ✅ WRAP COM TRY/CATCH
      if (ids.length === 0) return;
      await supabase
        .from('notificacoes')
        .update({ lida: true })
        .in('id', ids);
      // Trigger a refresh of notification count in parent component
      window.dispatchEvent(new Event('notificacoes-updated'));
    } catch (err) {
      if (mountedRef.current) {
        console.error('Erro ao marcar como lidas:', err);
      }
    }
  };
  // ... rest stays the same
}
