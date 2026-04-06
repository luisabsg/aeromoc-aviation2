import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import {
  CalendarDays,
  CheckCircle,
  Clock3,
  Plane,
  Trophy,
  XCircle,
  BarChart3,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface AgendamentoItem {
  id: string;
  data: string;
  horario: string;
  status: string;
  instrutor?: {
    nome?: string;
  } | null;
  aluno?: {
    nome?: string;
  } | null;
}

interface CardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, subtitle, icon }: CardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-3xl font-bold text-[#1B2A6B] mt-2">{value}</h3>
          <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
        </div>
        <div className="w-11 h-11 rounded-xl bg-[#1B2A6B]/10 flex items-center justify-center text-[#1B2A6B]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        id,
        data,
        horario,
        status,
        instrutor:instrutor_id(nome),
        aluno:aluno_id(nome)
      `)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (error) {
      console.error('Erro ao buscar dashboard admin:', error);
      setAgendamentos([]);
      setLoading(false);
      return;
    }

    setAgendamentos((data as AgendamentoItem[]) || []);
    setLoading(false);
  };

  const dashboard = useMemo(() => {
    const total = agendamentos.length;
    const confirmadas = agendamentos.filter((a) => a.status === 'confirmado').length;
    const realizadas = agendamentos.filter((a) => a.status === 'realizado').length;
    const canceladas = agendamentos.filter((a) => a.status === 'cancelado').length;
    const pendentes = agendamentos.filter((a) => a.status === 'pendente').length;
    const recusadas = agendamentos.filter((a) => a.status === 'recusado').length;

    const horasVoo = realizadas * 1;

    const aulasPorProfessorMap = new Map<string, number>();
    const aulasRealizadasPorProfessorMap = new Map<string, number>();
    const aulasPorMesMap = new Map<string, number>();
    const aulasPorAlunoMap = new Map<string, number>();

    agendamentos.forEach((item) => {
      const professor = item.instrutor?.nome || 'Instrutor';
      const aluno = item.aluno?.nome || 'Aluno';

      aulasPorProfessorMap.set(
        professor,
        (aulasPorProfessorMap.get(professor) || 0) + 1
      );

      if (item.status === 'realizado') {
        aulasRealizadasPorProfessorMap.set(
          professor,
          (aulasRealizadasPorProfessorMap.get(professor) || 0) + 1
        );
      }

      aulasPorAlunoMap.set(
        aluno,
        (aulasPorAlunoMap.get(aluno) || 0) + 1
      );

      const dataObj = new Date(`${item.data}T00:00:00`);
      const mes = dataObj.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      });

      aulasPorMesMap.set(mes, (aulasPorMesMap.get(mes) || 0) + 1);
    });

    const aulasPorProfessor = Array.from(aulasPorProfessorMap.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);

    const aulasPorMes = Array.from(aulasPorMesMap.entries()).map(([mes, total]) => ({
      mes,
      total,
    }));

    const topProfessores = Array.from(aulasRealizadasPorProfessorMap.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topAlunos = Array.from(aulasPorAlunoMap.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const professorDestaque = topProfessores[0]?.nome || '—';
    const professorDestaqueTotal = topProfessores[0]?.total || 0;

    const statusData = [
      { name: 'Pendentes', value: pendentes },
      { name: 'Confirmadas', value: confirmadas },
      { name: 'Realizadas', value: realizadas },
      { name: 'Canceladas', value: canceladas },
      { name: 'Recusadas', value: recusadas },
    ].filter((item) => item.value > 0);

    const agora = new Date();

    const proximasAulas = [...agendamentos]
      .filter((a) => {
        if (a.status !== 'confirmado') return false;
        const dataHora = new Date(`${a.data}T${a.horario}`);
        return dataHora >= agora;
      })
      .sort((a, b) => {
        const da = new Date(`${a.data}T${a.horario}`).getTime();
        const db = new Date(`${b.data}T${b.horario}`).getTime();
        return da - db;
      })
      .slice(0, 5);

    return {
      total,
      confirmadas,
      realizadas,
      canceladas,
      horasVoo,
      professorDestaque,
      professorDestaqueTotal,
      aulasPorProfessor: aulasPorProfessor.slice(0, 8),
      aulasPorMes,
      statusData,
      topProfessores,
      topAlunos,
      proximasAulas,
    };
  }, [agendamentos]);

  const pieColors = ['#F59E0B', '#22C55E', '#2563EB', '#6B7280', '#EF4444'];

  return (
    <DashboardLayout title="Dashboard Admin">
      <div className="space-y-6">
        <div
          className="rounded-3xl p-6 lg:p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-2">
                Painel Administrativo
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold">
                Visão geral das aulas e operações
              </h1>
              <p className="text-blue-100 mt-3 max-w-2xl text-sm lg:text-base">
                Acompanhe o desempenho dos professores, total de aulas, horas de voo
                acumuladas e próximas operações em um só lugar.
              </p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
            Carregando dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <StatCard
                title="Aulas agendadas"
                value={dashboard.total}
                subtitle="Total geral de registros"
                icon={<CalendarDays className="w-5 h-5" />}
              />
              <StatCard
                title="Aulas confirmadas"
                value={dashboard.confirmadas}
                subtitle="Prontas para execução"
                icon={<CheckCircle className="w-5 h-5" />}
              />
              <StatCard
                title="Aulas realizadas"
                value={dashboard.realizadas}
                subtitle="Concluídas com sucesso"
                icon={<Plane className="w-5 h-5" />}
              />
              <StatCard
                title="Aulas canceladas"
                value={dashboard.canceladas}
                subtitle="Canceladas no sistema"
                icon={<XCircle className="w-5 h-5" />}
              />
              <StatCard
                title="Horas de voo"
                value={`${dashboard.horasVoo}h`}
                subtitle="1 hora por aula realizada"
                icon={<Clock3 className="w-5 h-5" />}
              />
              <StatCard
                title="Professor destaque"
                value={dashboard.professorDestaque}
                subtitle={`${dashboard.professorDestaqueTotal} aulas realizadas`}
                icon={<Trophy className="w-5 h-5" />}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Aulas por professor
                  </h3>
                  <p className="text-sm text-gray-500">
                    Comparativo geral de aulas por instrutor
                  </p>
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.aulasPorProfessor}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nome" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#1B2A6B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Status das aulas
                  </h3>
                  <p className="text-sm text-gray-500">
                    Distribuição atual por situação
                  </p>
                </div>

                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={55}
                        paddingAngle={4}
                      >
                        {dashboard.statusData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-3">
                  {dashboard.statusData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-[#1B2A6B]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Aulas por mês
                  </h3>
                  <p className="text-sm text-gray-500">
                    Evolução de agendamentos ao longo do tempo
                  </p>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dashboard.aulasPorMes}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="mes" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#1B2A6B"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Top professores
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ranking por aulas realizadas
                  </p>
                </div>

                <div className="space-y-3">
                  {dashboard.topProfessores.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum dado disponível.</p>
                  ) : (
                    dashboard.topProfessores.map((item, index) => (
                      <div
                        key={item.nome}
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1B2A6B]/10 text-[#1B2A6B] flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{item.nome}</p>
                            <p className="text-xs text-gray-400">Instrutor</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#1B2A6B]">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Top alunos
                  </h3>
                  <p className="text-sm text-gray-500">
                    Quem mais agendou aulas
                  </p>
                </div>

                <div className="space-y-3">
                  {dashboard.topAlunos.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum dado disponível.</p>
                  ) : (
                    dashboard.topAlunos.map((item, index) => (
                      <div
                        key={item.nome}
                        className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{item.nome}</p>
                            <p className="text-xs text-gray-400">Aluno</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#1B2A6B]">{item.total}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#1B2A6B]">
                    Próximas aulas
                  </h3>
                  <p className="text-sm text-gray-500">
                    Próximos agendamentos confirmados
                  </p>
                </div>

                <div className="space-y-3">
                  {dashboard.proximasAulas.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma próxima aula encontrada.</p>
                  ) : (
                    dashboard.proximasAulas.map((aula) => (
                      <div
                        key={aula.id}
                        className="rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {aula.instrutor?.nome || 'Instrutor'} • {aula.aluno?.nome || 'Aluno'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(aula.data)} às {aula.horario}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            {aula.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#1B2A6B]" />
                <h3 className="text-lg font-bold text-[#1B2A6B]">
                  Resumo operacional
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="rounded-xl bg-[#F4F6FA] p-4">
                  <p className="text-gray-500">Taxa de confirmação</p>
                  <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                    {dashboard.total > 0
                      ? `${Math.round((dashboard.confirmadas / dashboard.total) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F4F6FA] p-4">
                  <p className="text-gray-500">Taxa de realização</p>
                  <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                    {dashboard.total > 0
                      ? `${Math.round((dashboard.realizadas / dashboard.total) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F4F6FA] p-4">
                  <p className="text-gray-500">Taxa de cancelamento</p>
                  <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                    {dashboard.total > 0
                      ? `${Math.round((dashboard.canceladas / dashboard.total) * 100)}%`
                      : '0%'}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F4F6FA] p-4">
                  <p className="text-gray-500">Horas por aula</p>
                  <p className="text-2xl font-bold text-[#1B2A6B] mt-1">1h</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}