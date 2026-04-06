/**
 * AeroMoc Aviation — Dashboard do Aluno
 * Design: Clean Aviation Dashboard
 * Mostra resumo de aulas: próximas, aguardando, recusadas
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Agendamento, Profile } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Link } from 'wouter';
import {
  Loader2,
  PlaneTakeoff,
  Clock,
  CalendarDays,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AgendamentoComInstrutor extends Agendamento {
  instrutor?: Profile;
}

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'aviso' | 'urgente';
  criado_em: string;
}

export default function DashboardAluno() {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<AgendamentoComInstrutor[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const carregar = async () => {
      await marcarAulasRealizadas();
      await fetchAgendamentos();
      await fetchNotificacoes();
    };

    carregar();
  }, [profile]);

  const marcarAulasRealizadas = async () => {
    if (!profile) return;

    const agora = new Date();

    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, data, horario')
      .eq('aluno_id', profile.id)
      .eq('status', 'confirmado');

    if (error || !data) {
      console.error('Erro ao buscar aulas para atualizar status:', error);
      return;
    }

    const vencidas = data.filter((ag) => {
      const dataHora = new Date(`${ag.data}T${ag.horario}`);
      return dataHora < agora;
    });

    if (vencidas.length === 0) return;

    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status: 'realizado' })
      .in('id', vencidas.map((a) => a.id));

    if (updateError) {
      console.error('Erro ao marcar aulas como realizadas:', updateError);
    }
  };

  const fetchAgendamentos = async () => {
    if (!profile) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*, instrutor:instrutor_id(id, nome, email, role)')
      .eq('aluno_id', profile.id)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (!error && data) {
      setAgendamentos(data as AgendamentoComInstrutor[]);
    } else if (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }

    setLoading(false);
  };

  const fetchNotificacoes = async () => {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('ativo', true)
      .eq('lida', false)
      .order('criado_em', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Erro ao buscar notificações:', error);
      return;
    }

    if (data) setNotificacoes(data as Notificacao[]);
  };

  const agora = new Date();

  const proximas = agendamentos.filter((a) => {
    if (a.status !== 'confirmado') return false;
    const dataHora = new Date(`${a.data}T${a.horario}`);
    return dataHora >= agora;
  });

  const aguardando = agendamentos.filter((a) => a.status === 'pendente');
  const recusadas = agendamentos.filter((a) => a.status === 'recusado');
  const realizadas = agendamentos.filter((a) => a.status === 'realizado');

  const proximasOrdenadas = [...proximas].sort((a, b) => {
    const da = new Date(`${a.data}T${a.horario}`).getTime();
    const db = new Date(`${b.data}T${b.horario}`).getTime();
    return da - db;
  });

  const proximaAula = proximasOrdenadas[0] ?? null;

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-6 lg:p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">
                Bem-vindo, {profile?.nome?.split(' ')[0]}! ✈️
              </h1>
              <p className="text-blue-200 text-sm lg:text-base">
                Acompanhe suas aulas de voo e gerencie seus agendamentos
              </p>
            </div>
            <PlaneTakeoff className="w-12 h-12 text-blue-300 shrink-0" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
          </div>
        ) : (
          <>
            {notificacoes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-2">Notificacoes Importantes</h3>
                    <div className="space-y-2">
                      {notificacoes.map((notif) => (
                        <div key={notif.id} className="text-sm text-blue-800">
                          <p className="font-semibold">{notif.titulo}</p>
                          <p className="text-blue-700 text-xs mt-0.5">{notif.mensagem}</p>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/dashboard/notificacoes-aluno"
                      className="text-blue-600 font-semibold text-sm hover:underline inline-flex items-center gap-1 mt-3"
                    >
                      Ver todas
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-green-700 text-xs font-semibold uppercase tracking-wider">
                      Próximas Aulas
                    </p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{proximas.length}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-600 text-xs">Aulas confirmadas futuras</p>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider">
                      Aguardando
                    </p>
                    <p className="text-3xl font-bold text-amber-900 mt-1">{aguardando.length}</p>
                  </div>
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-amber-600 text-xs">Aguardando confirmação</p>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-red-700 text-xs font-semibold uppercase tracking-wider">
                      Recusadas
                    </p>
                    <p className="text-3xl font-bold text-red-900 mt-1">{recusadas.length}</p>
                  </div>
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-600 text-xs">Não confirmadas</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-blue-700 text-xs font-semibold uppercase tracking-wider">
                      Realizadas
                    </p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{realizadas.length}</p>
                  </div>
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-blue-600 text-xs">Aulas concluídas</p>
              </div>
            </div>

            {proximaAula ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-6 lg:p-8 flex-wrap">
                  <div className="w-1 h-20 rounded-full bg-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                      Próxima Aula
                    </p>
                    <h3 className="text-2xl font-bold text-[#1B2A6B] mb-3">
                      {formatDate(proximaAula.data)} às {proximaAula.horario}
                    </h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">
                          {(proximaAula.instrutor as any)?.nome ?? 'Instrutor'}
                        </span>
                      </div>
                      <StatusBadge status={proximaAula.status} />
                    </div>
                  </div>
                  <Link
                    href="/dashboard/agendamentos"
                    className="px-4 py-2 rounded-lg bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#0D1B3E] transition-colors flex items-center gap-2"
                  >
                    Ver Detalhes
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-600 font-semibold mb-1">Nenhuma aula confirmada futura</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Solicite uma nova aula para começar
                </p>
                <Link
                  href="/dashboard/novo"
                  className="inline-flex px-4 py-2 rounded-lg bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#0D1B3E] transition-colors items-center gap-2"
                >
                  <PlaneTakeoff className="w-4 h-4" />
                  Solicitar Aula
                </Link>
              </div>
            )}

            {aguardando.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 lg:px-8 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#1B2A6B] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Aguardando Confirmação ({aguardando.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {aguardando.slice(0, 3).map((ag) => (
                    <div
                      key={ag.id}
                      className="p-4 lg:p-6 flex items-center justify-between gap-4 flex-wrap hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-semibold text-gray-800">{formatDate(ag.data)}</span>
                          <span className="text-gray-600">{ag.horario}</span>
                          <span className="text-gray-500 text-sm">
                            {(ag.instrutor as any)?.nome ?? 'Instrutor'}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={ag.status} />
                    </div>
                  ))}
                </div>
                {aguardando.length > 3 && (
                  <div className="px-6 lg:px-8 py-3 border-t border-gray-100 text-center">
                    <Link
                      href="/dashboard/agendamentos"
                      className="text-[#1B2A6B] font-semibold text-sm hover:underline flex items-center justify-center gap-1"
                    >
                      Ver todas ({aguardando.length})
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {recusadas.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 lg:px-8 py-4 border-b border-gray-100 bg-red-50">
                  <h3 className="font-bold text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Aulas Recusadas ({recusadas.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {recusadas.slice(0, 2).map((ag) => (
                    <div
                      key={ag.id}
                      className="p-4 lg:p-6 space-y-2 hover:bg-red-50/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-semibold text-gray-800">{formatDate(ag.data)}</span>
                          <span className="text-gray-600">{ag.horario}</span>
                        </div>
                        <StatusBadge status={ag.status} />
                      </div>
                      {ag.observacao && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-red-700 text-sm">
                          <p className="font-semibold mb-1">Motivo da recusa:</p>
                          <p>{ag.observacao}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/dashboard/novo"
                className="px-6 py-3 rounded-lg bg-[#1B2A6B] text-white font-semibold hover:bg-[#0D1B3E] transition-colors flex items-center gap-2"
              >
                <PlaneTakeoff className="w-5 h-5" />
                Solicitar Nova Aula
              </Link>
              <Link
                href="/dashboard/calendario"
                className="px-6 py-3 rounded-lg border border-[#1B2A6B] text-[#1B2A6B] font-semibold hover:bg-[#1B2A6B]/5 transition-colors flex items-center gap-2"
              >
                <CalendarDays className="w-5 h-5" />
                Ver Calendário
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}