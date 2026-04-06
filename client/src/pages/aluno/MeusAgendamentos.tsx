// ========================================
// 📝 ARQUIVO: client/src/pages/aluno/MeusAgendamentos.tsx
// ========================================

import { useState, useEffect, useRef } from 'react';
// ... rest of imports

export default function MeusAgendamentos() {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const mountedRef = useRef(true); // ✅ ADICIONAR ISSO

  useEffect(() => {
    mountedRef.current = true; // ✅ ADICIONAR
    fetchAgendamentos();

    return () => {
      mountedRef.current = false; // ✅ ADICIONAR CLEANUP
    };
  }, [profile]);

  const fetchAgendamentos = async () => {
    if (!profile) return;
    try { // ✅ WRAP COM TRY/CATCH
      setLoading(true);
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, instrutor:instrutor_id(id, nome, email, role)')
        .eq('aluno_id', profile.id)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (error) throw error;
      if (!mountedRef.current) return; // ✅ ADICIONAR CHECK
      setAgendamentos(data as Agendamento[]);
    } catch (err) {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        console.error('Erro ao buscar agendamentos:', err);
      }
    } finally {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        setLoading(false);
      }
    }
  };

  const cancelar = async (id: string) => {
    if (!mountedRef.current) return;
    setCancelingId(id);
    
    try { // ✅ WRAP COM TRY/CATCH
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'recusado' })
        .eq('id', id);
      
      if (error) throw error;
      
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        toast.success('Agendamento cancelado. O horário foi liberado.');
        setConfirmId(null);
        await fetchAgendamentos();
      }
    } catch (err) {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        toast.error('Erro ao cancelar agendamento.');
        console.error('Erro ao cancelar:', err);
      }
    } finally {
      if (mountedRef.current) { // ✅ ADICIONAR CHECK
        setCancelingId(null);
      }
    }
  };
  // ... rest stays the same
}
