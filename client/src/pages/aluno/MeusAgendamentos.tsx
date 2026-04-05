/**
 * AeroMoc Aviation — Meus Agendamentos (Aluno)
 * Design: Clean Aviation Dashboard
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Agendamento } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ClipboardList, Clock, CalendarDays, User, MessageSquare, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MeusAgendamentos() {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgendamentos();
  }, [profile]);

  const fetchAgendamentos = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, instrutor:instrutor_id(id, nome, email, role)')
      .eq('aluno_id', profile.id)
      .order('data', { ascending: false })
      .order('horario', { ascending: false });

    if (!error && data) {
      setAgendamentos(data as Agendamento[]);
    }
    setLoading(false);
  };

  const cancelar = async (id: string) => {
    setCancelingId(id);
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'recusado' })
      .eq('id', id);
    setCancelingId(null);
    setConfirmId(null);
    if (error) {
      toast.error('Erro ao cancelar agendamento.');
    } else {
      toast.success('Agendamento cancelado. O horário foi liberado.');
      fetchAgendamentos();
    }
  };

  return (
    <DashboardLayout title="Meus Agendamentos">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A6B]">Meus Agendamentos</h2>
            <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas aulas solicitadas</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgendamentos}
            className="border-[#1B2A6B] text-[#1B2A6B] hover:bg-[#1B2A6B]/5"
          >
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-semibold mb-1">Nenhum agendamento encontrado</h3>
            <p className="text-gray-400 text-sm">Solicite sua primeira aula de voo!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map(ag => (
              <div
                key={ag.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  ag.status === 'recusado' ? 'border-red-100' :
                  ag.status === 'confirmado' ? 'border-green-100' :
                  'border-gray-100'
                }`}
              >
                {/* Status bar on left */}
                <div className="flex">
                  <div
                    className={`w-1 shrink-0 ${
                      ag.status === 'recusado' ? 'bg-red-400' :
                      ag.status === 'confirmado' ? 'bg-green-500' :
                      'bg-amber-400'
                    }`}
                  />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                            <span className="font-semibold">{formatDate(ag.data)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Clock className="w-4 h-4 text-[#1B2A6B]" />
                            <span className="font-semibold">{ag.horario}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{(ag.instrutor as any)?.nome ?? 'Instrutor'}</span>
                          </div>
                        </div>

                        {ag.observacao && (
                          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-1">
                            <MessageSquare className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-red-700 text-sm">{ag.observacao}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ag.status} />
                        {ag.status === 'pendente' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmId(ag.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm cancel dialog */}
      <AlertDialog open={!!confirmId} onOpenChange={() => setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Cancelar agendamento?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá cancelar sua aula e liberar o horário. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && cancelar(confirmId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
