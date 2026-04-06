/**
 * AeroMoc Aviation — Solicitações (Instrutor)
 * Design: Clean Aviation Dashboard
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Agendamento, Profile } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, ClipboardList, Clock, CalendarDays, User,
  CheckCircle, XCircle, MessageSquare, Filter
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';

interface AgendamentoComAluno extends Agendamento {
  aluno?: Profile;
}

export default function Solicitacoes() {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoComAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [observacao, setObservacao] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showRecusarDialog, setShowRecusarDialog] = useState(false);
  const [showCancelarDialog, setShowCancelarDialog] = useState(false);

  useEffect(() => {
    fetchAgendamentos();
  }, [profile]);

  const fetchAgendamentos = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('agendamentos')
        .select('*, aluno:aluno_id(id, nome, email, role)')
        .eq('instrutor_id', profile.id)
        .order('data', { ascending: false })
        .order('horario', { ascending: false });

      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        toast.error('Erro ao carregar solicitações.');
        setAgendamentos([]);
        return;
      }

      setAgendamentos((data as AgendamentoComAluno[]) ?? []);
    } finally {
      setLoading(false);
    }
  };

  const aceitar = async (id: string) => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado', observacao: null })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao aceitar agendamento.');
      } else {
        toast.success('Agendamento aceito com sucesso!');
        fetchAgendamentos();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openRecusar = (id: string) => {
    setRecusandoId(id);
    setObservacao('');
    setShowRecusarDialog(true);
  };

  const recusar = async () => {
    if (!observacao.trim()) {
      toast.error('A observação é obrigatória ao recusar.');
      return;
    }

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'recusado', observacao: observacao.trim() })
        .eq('id', recusandoId);

      setShowRecusarDialog(false);
      setRecusandoId(null);
      setObservacao('');

      if (error) {
        toast.error('Erro ao recusar agendamento.');
      } else {
        toast.success('Agendamento recusado.');
        fetchAgendamentos();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openCancelar = (id: string) => {
    setCancelandoId(id);
    setObservacao('');
    setShowCancelarDialog(true);
  };

  const cancelarConfirmado = async () => {
    if (!observacao.trim()) {
      toast.error('Informe o motivo do cancelamento.');
      return;
    }

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado', observacao: observacao.trim() })
        .eq('id', cancelandoId);

      setShowCancelarDialog(false);
      setCancelandoId(null);
      setObservacao('');

      if (error) {
        toast.error('Erro ao cancelar aula.');
      } else {
        toast.success('Aula cancelada com sucesso.');
        fetchAgendamentos();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = agendamentos.filter((ag) => {
    if (filterStatus === 'todos') return true;
    return ag.status === filterStatus;
  });

  const counts = {
    pendente: agendamentos.filter((a) => a.status === 'pendente').length,
    confirmado: agendamentos.filter((a) => a.status === 'confirmado').length,
    recusado: agendamentos.filter((a) => a.status === 'recusado').length,
  };

  return (
    <DashboardLayout title="Solicitações">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Pendentes', count: counts.pendente, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Confirmados', count: counts.confirmado, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
            { label: 'Recusados', count: counts.recusado, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-gray-600 text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9 border-gray-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="confirmado">Confirmados</SelectItem>
              <SelectItem value="recusado">Recusados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAgendamentos}
            className="border-[#1B2A6B] text-[#1B2A6B] hover:bg-[#1B2A6B]/5 ml-auto"
          >
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-semibold mb-1">Nenhuma solicitação encontrada</h3>
            <p className="text-gray-400 text-sm">
              {filterStatus !== 'todos' ? 'Tente outro filtro.' : 'Aguarde novas solicitações dos alunos.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ag) => (
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
                          <div className="flex items-center gap-1.5 text-sm">
                            <User className="w-4 h-4 text-[#1B2A6B]" />
                            <span className="font-bold text-gray-800">{(ag.aluno as any)?.nome ?? 'Aluno'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <CalendarDays className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{formatDate(ag.data)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold">{ag.horario}</span>
                          </div>
                        </div>

                        {ag.observacao && (
                          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-gray-600 text-sm">{ag.observacao}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={ag.status} />

                        {ag.status === 'pendente' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => aceitar(ag.id)}
                              disabled={actionLoading}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Aceitar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openRecusar(ag.id)}
                              disabled={actionLoading}
                              className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Recusar
                            </Button>
                          </>
                        )}

                        {ag.status === 'confirmado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCancelar(ag.id)}
                            disabled={actionLoading}
                            className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancelar Aula
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

      <Dialog open={showRecusarDialog} onOpenChange={setShowRecusarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Recusar Agendamento
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. Esta mensagem será exibida para o aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-gray-700 font-medium text-sm">
              Observação <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Indisponível neste horário por motivo de manutenção da aeronave..."
              rows={4}
              className="border-gray-200 focus:border-red-400 resize-none"
            />
            {!observacao.trim() && (
              <p className="text-red-500 text-xs">Campo obrigatório.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecusarDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={recusar}
              disabled={actionLoading || !observacao.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelarDialog} onOpenChange={setShowCancelarDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Cancelar Aula Confirmada
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta mensagem será exibida para o aluno.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-gray-700 font-medium text-sm">
              Motivo do cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Aula cancelada por indisponibilidade do instrutor ou manutenção da aeronave..."
              rows={4}
              className="border-gray-200 focus:border-red-400 resize-none"
            />
            {!observacao.trim() && (
              <p className="text-red-500 text-xs">Campo obrigatório.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelarDialog(false)}>
              Voltar
            </Button>
            <Button
              onClick={cancelarConfirmado}
              disabled={actionLoading || !observacao.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Cancelamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}