import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Filter,
  Download,
  FileText,
  CalendarDays,
  Clock3,
  Ban,
  Users,
  BarChart3,
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
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AgendamentoItem {
  id: string;
  data: string;
  horario: string;
  status: string;
  instrutor?: { nome?: string } | null;
  aluno?: { nome?: string } | null;
}

interface BloqueioItem {
  id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  motivo?: string | null;
  instrutor?: { nome?: string } | null;
}

function diffHours(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  return Math.max(0, endMin - startMin) / 60;
}

function Card({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-[#1B2A6B] mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{subtitle}</p>
    </div>
  );
}

function Box({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-lg text-[#1B2A6B]">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className="h-[320px]">{children}</div>
    </div>
  );
}

export default function AdminRelatorios() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoItem[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [professorFiltro, setProfessorFiltro] = useState('todos');
  const [alunoFiltro, setAlunoFiltro] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);

    const [{ data: agData, error: agError }, { data: blData, error: blError }] =
      await Promise.all([
        supabase
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
          .order('horario', { ascending: true }),
        supabase
          .from('bloqueios')
          .select(`
            id,
            data,
            horario_inicio,
            horario_fim,
            motivo,
            instrutor:instrutor_id(nome)
          `)
          .order('data', { ascending: true })
          .order('horario_inicio', { ascending: true }),
      ]);

    if (agError) {
      console.error('Erro ao buscar agendamentos:', agError);
      setAgendamentos([]);
    } else {
      setAgendamentos((agData as AgendamentoItem[]) || []);
    }

    if (blError) {
      console.error('Erro ao buscar bloqueios:', blError);
      setBloqueios([]);
    } else {
      setBloqueios((blData as BloqueioItem[]) || []);
    }

    setLoading(false);
  };

  const professores = useMemo(() => {
    return Array.from(
      new Set([
        ...agendamentos.map((i) => i.instrutor?.nome).filter(Boolean),
        ...bloqueios.map((i) => i.instrutor?.nome).filter(Boolean),
      ])
    ) as string[];
  }, [agendamentos, bloqueios]);

  const alunos = useMemo(() => {
    return Array.from(
      new Set(agendamentos.map((i) => i.aluno?.nome).filter(Boolean))
    ) as string[];
  }, [agendamentos]);

  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((item) => {
      if (dataInicio && item.data < dataInicio) return false;
      if (dataFim && item.data > dataFim) return false;
      if (
        professorFiltro !== 'todos' &&
        (item.instrutor?.nome || '') !== professorFiltro
      )
        return false;
      if (alunoFiltro !== 'todos' && (item.aluno?.nome || '') !== alunoFiltro)
        return false;
      if (statusFiltro !== 'todos' && item.status !== statusFiltro) return false;
      return true;
    });
  }, [agendamentos, dataInicio, dataFim, professorFiltro, alunoFiltro, statusFiltro]);

  const bloqueiosFiltrados = useMemo(() => {
    return bloqueios.filter((item) => {
      if (dataInicio && item.data < dataInicio) return false;
      if (dataFim && item.data > dataFim) return false;
      if (
        professorFiltro !== 'todos' &&
        (item.instrutor?.nome || '') !== professorFiltro
      )
        return false;
      return true;
    });
  }, [bloqueios, dataInicio, dataFim, professorFiltro]);

  const resumo = useMemo(() => {
    const total = agendamentosFiltrados.length;
    const realizadas = agendamentosFiltrados.filter((i) => i.status === 'realizado').length;
    const canceladas = agendamentosFiltrados.filter((i) => i.status === 'cancelado').length;
    const confirmadas = agendamentosFiltrados.filter((i) => i.status === 'confirmado').length;
    const totalBloqueios = bloqueiosFiltrados.length;
    const horasBloqueadas = bloqueiosFiltrados.reduce((acc, item) => {
      return acc + diffHours(item.horario_inicio, item.horario_fim);
    }, 0);

    return {
      total,
      realizadas,
      confirmadas,
      horasVoo: realizadas * 1,
      canceladas,
      taxaCancelamento: total > 0 ? Math.round((canceladas / total) * 100) : 0,
      totalBloqueios,
      horasBloqueadas: horasBloqueadas.toFixed(1),
    };
  }, [agendamentosFiltrados, bloqueiosFiltrados]);

  const porProfessor = useMemo(() => {
    const map = new Map<string, number>();
    agendamentosFiltrados.forEach((i) => {
      const nome = i.instrutor?.nome || 'Instrutor';
      map.set(nome, (map.get(nome) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [agendamentosFiltrados]);

  const porDia = useMemo(() => {
    const map = new Map<string, number>();
    agendamentosFiltrados.forEach((i) => {
      map.set(i.data, (map.get(i.data) || 0) + 1);
    });
    return Array.from(map.entries()).map(([data, total]) => ({
      data: formatDate(data),
      total,
    }));
  }, [agendamentosFiltrados]);

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    agendamentosFiltrados.forEach((i) => {
      map.set(i.status, (map.get(i.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [agendamentosFiltrados]);

  const horariosMaisUsados = useMemo(() => {
    const map = new Map<string, number>();
    agendamentosFiltrados.forEach((i) => {
      map.set(i.horario, (map.get(i.horario) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([horario, total]) => ({ horario, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [agendamentosFiltrados]);

  const bloqueiosPorProfessor = useMemo(() => {
    const map = new Map<string, number>();
    bloqueiosFiltrados.forEach((i) => {
      const nome = i.instrutor?.nome || 'Instrutor';
      map.set(nome, (map.get(nome) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  }, [bloqueiosFiltrados]);

  const exportExcel = () => {
    const aulasSheet = agendamentosFiltrados.map((item) => ({
      Professor: item.instrutor?.nome || 'Instrutor',
      Data: formatDate(item.data),
      Horario: item.horario,
      Aluno: item.aluno?.nome || '—',
      Status: item.status,
    }));

    const bloqueiosSheet = bloqueiosFiltrados.map((item) => ({
      Professor: item.instrutor?.nome || 'Instrutor',
      Data: formatDate(item.data),
      Inicio: item.horario_inicio,
      Fim: item.horario_fim,
      Horas: diffHours(item.horario_inicio, item.horario_fim),
      Motivo: item.motivo || '—',
    }));

    const resumoSheet = [
      { Indicador: 'Total de aulas', Valor: resumo.total },
      { Indicador: 'Aulas confirmadas', Valor: resumo.confirmadas },
      { Indicador: 'Aulas realizadas', Valor: resumo.realizadas },
      { Indicador: 'Horas de voo', Valor: resumo.horasVoo },
      { Indicador: 'Aulas canceladas', Valor: resumo.canceladas },
      { Indicador: 'Taxa de cancelamento', Valor: `${resumo.taxaCancelamento}%` },
      { Indicador: 'Total de bloqueios', Valor: resumo.totalBloqueios },
      { Indicador: 'Horas bloqueadas', Valor: resumo.horasBloqueadas },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumoSheet), 'Resumo');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aulasSheet), 'Aulas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bloqueiosSheet), 'Bloqueios');
    XLSX.writeFile(wb, 'relatorio-aeromoc.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório AeroMoc', 14, 16);

    doc.setFontSize(10);
    doc.text(`Período: ${dataInicio || 'início'} até ${dataFim || 'hoje'}`, 14, 24);
    doc.text(`Professor: ${professorFiltro === 'todos' ? 'Todos' : professorFiltro}`, 14, 30);
    doc.text(`Aluno: ${alunoFiltro === 'todos' ? 'Todos' : alunoFiltro}`, 14, 36);

    autoTable(doc, {
      startY: 44,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total de aulas', String(resumo.total)],
        ['Aulas confirmadas', String(resumo.confirmadas)],
        ['Aulas realizadas', String(resumo.realizadas)],
        ['Horas de voo', `${resumo.horasVoo}h`],
        ['Aulas canceladas', String(resumo.canceladas)],
        ['Taxa de cancelamento', `${resumo.taxaCancelamento}%`],
        ['Bloqueios', String(resumo.totalBloqueios)],
        ['Horas bloqueadas', `${resumo.horasBloqueadas}h`],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Professor', 'Data', 'Horário', 'Aluno', 'Status']],
      body: agendamentosFiltrados.slice(0, 20).map((item) => [
        item.instrutor?.nome || 'Instrutor',
        formatDate(item.data),
        item.horario,
        item.aluno?.nome || '—',
        item.status,
      ]),
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Professor', 'Data', 'Início', 'Fim', 'Motivo']],
      body: bloqueiosFiltrados.slice(0, 20).map((item) => [
        item.instrutor?.nome || 'Instrutor',
        formatDate(item.data),
        item.horario_inicio,
        item.horario_fim,
        item.motivo || '—',
      ]),
    });

    doc.save('relatorio-aeromoc.pdf');
  };

  const pieColors = ['#1B2A6B', '#22C55E', '#F59E0B', '#EF4444', '#6B7280', '#06B6D4'];

  return (
    <DashboardLayout title="Relatórios">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-[#1B2A6B]">Relatórios Operacionais</h2>
              <p className="text-gray-500 mt-1">
                Analise aulas, bloqueios, horas de voo e exporte dados do período.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={exportExcel}
                className="border-[#1B2A6B] text-[#1B2A6B]"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="outline"
                onClick={exportPDF}
                className="border-[#1B2A6B] text-[#1B2A6B]"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={fetchDados}
                className="bg-[#1B2A6B] hover:bg-[#0D1B3E] text-white"
              >
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#1B2A6B]" />
            <h3 className="font-bold text-[#1B2A6B]">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Data início</label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Data fim</label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Professor</label>
              <Select value={professorFiltro} onValueChange={setProfessorFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {professores.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Aluno</label>
              <Select value={alunoFiltro} onValueChange={setAlunoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {alunos.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-600 font-medium mb-2 block">Status</label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 shadow-sm text-center text-gray-500">
            Carregando relatórios...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card title="Total de aulas" value={resumo.total} subtitle="Registros filtrados" />
              <Card title="Horas de voo" value={`${resumo.horasVoo}h`} subtitle="1h por aula realizada" />
              <Card title="Bloqueios" value={resumo.totalBloqueios} subtitle={`${resumo.horasBloqueadas}h bloqueadas`} />
              <Card title="Taxa cancelamento" value={`${resumo.taxaCancelamento}%`} subtitle="No período filtrado" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Box
                title="Aulas por professor"
                subtitle="Volume de aulas por instrutor"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porProfessor}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="nome" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#1B2A6B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box
                title="Status das aulas"
                subtitle="Distribuição por situação"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95}>
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box
                title="Aulas por dia"
                subtitle="Quantidade por data"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porDia}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="data" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#2563EB" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Box
                title="Horários mais usados"
                subtitle="Top horários das aulas"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={horariosMaisUsados} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="horario" width={60} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#0EA5E9" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Box
                title="Bloqueios por professor"
                subtitle="Quem mais bloqueou agenda"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloqueiosPorProfessor}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="nome" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-[#1B2A6B]">Resumo de bloqueios</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Visão rápida dos bloqueios filtrados
                  </p>
                </div>

                <div className="space-y-3">
                  {bloqueiosFiltrados.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum bloqueio encontrado.</p>
                  ) : (
                    bloqueiosFiltrados.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {item.instrutor?.nome || 'Instrutor'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(item.data)} • {item.horario_inicio} às {item.horario_fim}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <Ban className="w-3 h-3 inline mr-1" />
                            Bloqueio
                          </span>
                        </div>
                        {item.motivo && (
                          <p className="text-sm text-gray-600 mt-2">{item.motivo}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-[#1B2A6B]" />
                <h3 className="font-bold text-[#1B2A6B]">Tabela de aulas</h3>
              </div>

              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="py-3 pr-4">Professor</th>
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Horário</th>
                    <th className="py-3 pr-4">Aluno</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentosFiltrados.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{i.instrutor?.nome || 'Instrutor'}</td>
                      <td className="py-3 pr-4">{formatDate(i.data)}</td>
                      <td className="py-3 pr-4">{i.horario}</td>
                      <td className="py-3 pr-4">{i.aluno?.nome || '—'}</td>
                      <td className="py-3 pr-4">{i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-2 mb-4">
                <Clock3 className="w-5 h-5 text-[#1B2A6B]" />
                <h3 className="font-bold text-[#1B2A6B]">Tabela de bloqueios</h3>
              </div>

              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="py-3 pr-4">Professor</th>
                    <th className="py-3 pr-4">Data</th>
                    <th className="py-3 pr-4">Início</th>
                    <th className="py-3 pr-4">Fim</th>
                    <th className="py-3 pr-4">Horas</th>
                    <th className="py-3 pr-4">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {bloqueiosFiltrados.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{i.instrutor?.nome || 'Instrutor'}</td>
                      <td className="py-3 pr-4">{formatDate(i.data)}</td>
                      <td className="py-3 pr-4">{i.horario_inicio}</td>
                      <td className="py-3 pr-4">{i.horario_fim}</td>
                      <td className="py-3 pr-4">
                        {diffHours(i.horario_inicio, i.horario_fim).toFixed(1)}h
                      </td>
                      <td className="py-3 pr-4">{i.motivo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}