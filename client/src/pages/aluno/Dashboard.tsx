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
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Loader2, PlaneTakeoff, Clock, CalendarDays, User, AlertCircle,
  CheckCircle, XCircle, ArrowRight, Bell, Info
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
    fetchAgendamentos();
    fetchNotificacoes();
  }, [profile]);

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
    }
    setLoading(false);
  };

  const fetchNotificacoes = async () => {
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false })
      .limit(3);
    if (data) setNotificacoes(data as Notificacao[]);
  };

  // Separar agendamentos por status
  const proximas = agendamentos.filter(a => a.status === 'confirmado');
  const aguardando = agendamentos.filter(a => a.status === 'pendente');
  const recusadas = agendamentos.filter(a => a.status === 'recusado');

  // Próxima aula
  const proximaAula = proximas.length > 0 ? proximas[0] : null;

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome section */}
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
            {/* Notificacoes */}
            {notificacoes.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-2">Notificacoes Importantes</h3>
                    <div className="space-y-2">
                      {notificacoes.map(notif => (
                        <div key={notif.id} className="text-sm text-blue-800">
                          <p className="font-semibold">{notif.titulo}</p>
                          <p className="text-blue-700 text-xs mt-0.5">{notif.mensagem}</p>
                        </div>
                      ))}
                    </div>
                    <Link href="/dashboard/notificacoes-aluno">
                      <a className="text-blue-600 font-semibold text-sm hover:underline inline-flex items-center gap-1 mt-3">
                        Ver todas
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Próximas */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-green-700 text-xs font-semibold uppercase tracking-wider">Próximas Aulas</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">{proximas.length}</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-600 text-xs">Aulas confirmadas</p>
              </div>

              {/* Aguardando */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Aguardando</p>
                    <p className="text-3xl font-bold text-amber-900 mt-1">{aguardando.length}</p>
                  </div>
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-amber-600 text-xs">Aguardando confirmação</p>
              </div>

              {/* Recusadas */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-red-700 text-xs font-semibold uppercase tracking-wider">Recusadas</p>
                    <p className="text-3xl font-bold text-red-900 mt-1">{recusadas.length}</p>
                  </div>
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-red-600 text-xs">Não confirmadas</p>
              </div>
            </div>

            {/* Próxima aula destaque */}
            {proximaAula ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-6 lg:p-8 flex-wrap">
                  <div className="w-1 h-20 rounded-full bg-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Próxima Aula</p>
                    <h3 className="text-2xl font-bold text-[#1B2A6B] mb-3">
                      {formatDate(proximaAula.data)} às {proximaAula.horario}
                    </h3>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{(proximaAula.instrutor as any)?.nome ?? 'Instrutor'}</span>
                      </div>
                      <StatusBadge status={proximaAula.status} />
                    </div>
                  </div>
                  <Link href="/dashboard/agendamentos">
                    <a className="px-4 py-2 rounded-lg bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#0D1B3E] transition-colors flex items-center gap-2">
                      Ver Detalhes
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-gray-600 font-semibold mb-1">Nenhuma aula confirmada</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Solicite uma nova aula para começar
                </p>
                <Link href="/dashboard/novo">
                  <a className="inline-flex px-4 py-2 rounded-lg bg-[#1B2A6B] text-white font-semibold text-sm hover:bg-[#0D1B3E] transition-colors items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4" />
                    Solicitar Aula
                  </a>
                </Link>
              </div>
            )}

            {/* Aguardando confirmação */}
            {aguardando.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 lg:px-8 py-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-[#1B2A6B] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Aguardando Confirmação ({aguardando.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {aguardando.slice(0, 3).map(ag => (
                    <div key={ag.id} className="p-4 lg:p-6 flex items-center justify-between gap-4 flex-wrap hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-semibold text-gray-800">{formatDate(ag.data)}</span>
                          <span className="text-gray-600">{ag.horario}</span>
                          <span className="text-gray-500 text-sm">{(ag.instrutor as any)?.nome ?? 'Instrutor'}</span>
                        </div>
                      </div>
                      <StatusBadge status={ag.status} />
                    </div>
                  ))}
                </div>
                {aguardando.length > 3 && (
                  <div className="px-6 lg:px-8 py-3 border-t border-gray-100 text-center">
                    <Link href="/dashboard/agendamentos">
                      <a className="text-[#1B2A6B] font-semibold text-sm hover:underline flex items-center justify-center gap-1">
                        Ver todas ({aguardando.length})
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Recusadas */}
            {recusadas.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 lg:px-8 py-4 border-b border-gray-100 bg-red-50">
                  <h3 className="font-bold text-red-700 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Aulas Recusadas ({recusadas.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {recusadas.slice(0, 2).map(ag => (
                    <div key={ag.id} className="p-4 lg:p-6 space-y-2 hover:bg-red-50/30 transition-colors">
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

            {/* CTA */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/dashboard/novo">
                <a className="px-6 py-3 rounded-lg bg-[#1B2A6B] text-white font-semibold hover:bg-[#0D1B3E] transition-colors flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5" />
                  Solicitar Nova Aula
                </a>
              </Link>
              <Link href="/dashboard/calendario">
                <a className="px-6 py-3 rounded-lg border border-[#1B2A6B] text-[#1B2A6B] font-semibold hover:bg-[#1B2A6B]/5 transition-colors flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Ver Calendário
                </a>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
