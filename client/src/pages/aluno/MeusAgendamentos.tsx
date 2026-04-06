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
import {
  Loader2,
  ClipboardList,
  Clock,
  CalendarDays,
  User,
  MessageSquare,
  AlertCircle,
  Pencil,
  Filter,
} from 'lucide-react';
import { useLocation } from 'wouter';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MeusAgendamentos() {
  const { profile } = useAuth();
  const [, navigate] = useLocation();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  useEffect(() => {
    fetchAgendamentos();
  }, [profile]);

  const fetchAgendamentos = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, instrutor:instrutor_id(id, nome, email, role)')
        .eq('aluno_id', profile.id)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast.error('Erro ao carregar agendamentos.');
        setAgendamentos([]);
        return;
      }

      setAgendamentos((data as Agendamento[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  const cancelar = async (id: string) => {
    try {
      setCancelingId(id);

      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', id);

      if (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Erro ao cancelar agendamento.');
        return;
      }

      toast.success('Agendamento cancelado. O horário foi liberado.');
      setConfirmId(null);
      fetchAgendamentos();
    } finally {
      setCancelingId(null);
    }
  };

  const editar = (id: string) => {
    navigate(`/dashboard/novo?edit=${id}`);
  };

  const filteredAgendamentos = agendamentos.filter((ag) => {
    if (filterStatus === 'todos') return true;
    return ag.status === filterStatus;
  });

  return (
    <DashboardLayout title="Meus Agendamentos">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-[#1B2A6B]">Meus Agendamentos</h2>
            <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas aulas solicitadas</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44 h-9 border-gray-200 text-sm">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="confirmado">Confirmados</SelectItem>
                  <SelectItem value="recusado">Recusados</SelectItem>
                  <SelectItem value="cancelado">Cancelados</SelectItem>
                </SelectContent>
              </Select>
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
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
          </div>
        ) : filteredAgendamentos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-semibold mb-1">Nenhum agendamento encontrado</h3>
            <p className="text-gray-400 text-sm">
              {filterStatus === 'todos'
                ? 'Solicite sua primeira aula de voo!'
                : 'Nenhum agendamento encontrado para este filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAgendamentos.map((ag) => (
              <div
                key={ag.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                  ag.status === 'recusado'
                    ? 'border-red-100'
                    : ag.status === 'confirmado'
                    ? 'border-green-100'
                    : ag.status === 'cancelado'
                    ? 'border-gray-200'
                    : 'border-gray-100'
                }`}
              >
                <div className="flex">
                  <div
                    className={`w-1 shrink-0 ${
                      ag.status === 'recusado'
                        ? 'bg-red-400'
                        : ag.status === 'confirmado'
                        ? 'bg-green-500'
                        : ag.status === 'cancelado'
                        ? 'bg-gray-400'
                        : 'bg-amber-400'
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
                          <div
                            className={`flex items-start gap-2 rounded-lg px-3 py-2 mt-1 border ${
                              ag.status === 'recusado'
                                ? 'bg-red-50 border-red-100'
                                : ag.status === 'cancelado'
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <MessageSquare
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                ag.status === 'recusado'
                                  ? 'text-red-500'
                                  : ag.status === 'cancelado'
                                  ? 'text-gray-500'
                                  : 'text-gray-500'
                              }`}
                            />
                            <p
                              className={`text-sm ${
                                ag.status === 'recusado'
                                  ? 'text-red-700'
                                  : ag.status === 'cancelado'
                                  ? 'text-gray-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {ag.observacao}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ag.status} />

                        {ag.status === 'pendente' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => editar(ag.id)}
                              disabled={cancelingId === ag.id}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Editar
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmId(ag.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                            >
                              Cancelar
                            </Button>
                          </>
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