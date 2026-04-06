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
  CalendarDays,
  Clock,
  Search,
  Users,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';

interface EscalaItem {
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

export default function AdminEscalas() {
  const [escalas, setEscalas] = useState<EscalaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [buscaProfessor, setBuscaProfessor] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [dataFiltro, setDataFiltro] = useState('');

  useEffect(() => {
    fetchEscalas();
  }, []);

  const fetchEscalas = async () => {
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
      console.error('Erro ao buscar escalas:', error);
      setEscalas([]);
      setLoading(false);
      return;
    }

    setEscalas((data as EscalaItem[]) || []);
    setLoading(false);
  };

  const escalasFiltradas = useMemo(() => {
    return escalas.filter((item) => {
      const nomeInstrutor = item.instrutor?.nome?.toLowerCase() || '';
      const matchProfessor = nomeInstrutor.includes(buscaProfessor.toLowerCase());

      const matchStatus =
        statusFiltro === 'todos' ? true : item.status === statusFiltro;

      const matchData = dataFiltro ? item.data === dataFiltro : true;

      return matchProfessor && matchStatus && matchData;
    });
  }, [escalas, buscaProfessor, statusFiltro, dataFiltro]);

  const totalProfessores = new Set(
    escalas.map((item) => item.instrutor?.nome).filter(Boolean)
  ).size;

  const totalAulas = escalasFiltradas.length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-700';
      case 'pendente':
        return 'bg-amber-100 text-amber-700';
      case 'recusado':
        return 'bg-red-100 text-red-700';
      case 'cancelado':
        return 'bg-gray-200 text-gray-700';
      case 'realizado':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <DashboardLayout title="Escalas">
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-[#1B2A6B]">
                Escalas dos Professores
              </h2>
              <p className="text-gray-500 mt-1">
                Visualize e acompanhe os agendamentos por professor.
              </p>
            </div>

            <Button
              onClick={fetchEscalas}
              className="bg-[#1B2A6B] hover:bg-[#0D1B3E] text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700 font-medium">Professores</p>
              <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                {totalProfessores}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-sm text-indigo-700 font-medium">Registros</p>
              <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                {totalAulas}
              </p>
            </div>

            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm text-green-700 font-medium">Confirmados</p>
              <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                {escalasFiltradas.filter((i) => i.status === 'confirmado').length}
              </p>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-700 font-medium">Pendentes</p>
              <p className="text-2xl font-bold text-[#1B2A6B] mt-1">
                {escalasFiltradas.filter((i) => i.status === 'pendente').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="md:col-span-1 xl:col-span-2">
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Buscar professor
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={buscaProfessor}
                  onChange={(e) => setBuscaProfessor(e.target.value)}
                  placeholder="Digite o nome do professor"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Status
              </label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="recusado">Recusado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Data
              </label>
              <Input
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1B2A6B]" />
            <h3 className="font-bold text-[#1B2A6B]">Lista de Escalas</h3>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">Carregando...</div>
          ) : escalasFiltradas.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Nenhuma escala encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="px-6 py-4 font-semibold">Professor</th>
                    <th className="px-6 py-4 font-semibold">Data</th>
                    <th className="px-6 py-4 font-semibold">Horário</th>
                    <th className="px-6 py-4 font-semibold">Aluno</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {escalasFiltradas.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          {item.instrutor?.nome || 'Instrutor'}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-gray-400" />
                          {formatDate(item.data)}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {item.horario}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {item.aluno?.nome || 'Livre'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}