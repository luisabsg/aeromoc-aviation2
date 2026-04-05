/**
 * AeroMoc Aviation — Novo Agendamento (Aluno)
 * Design: Clean Aviation Dashboard
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { generateTimeSlots, isTimeBlocked } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, PlaneTakeoff, CalendarDays, Clock, User } from 'lucide-react';
import type { Profile, Bloqueio } from '@/lib/supabase';

export default function NovoAgendamento() {
  const { profile } = useAuth();
  const [instrutores, setInstrutores] = useState<Profile[]>([]);
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [instrutorId, setInstrutorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingInstrutores, setLoadingInstrutores] = useState(true);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [agendamentosHoje, setAgendamentosHoje] = useState<string[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  const allSlots = generateTimeSlots();

  useEffect(() => {
    fetchInstrutores();
  }, []);

  useEffect(() => {
    if (data && instrutorId) {
      fetchBloqueiosEOcupados();
    } else {
      setBloqueios([]);
      setHorariosOcupados([]);
    }
    setHorario('');
  }, [data, instrutorId]);

  // Validar se horário está bloqueado ANTES de enviar
  const isHorarioBlocked = (slot: string): boolean => {
    for (const b of bloqueios) {
      if (isTimeBlocked(slot, b.horario_inicio, b.horario_fim)) return true;
    }
    return false;
  };

  useEffect(() => {
    if (data && profile?.id) {
      checkAgendamentoAluno();
    }
  }, [data]);

  const fetchInstrutores = async () => {
    setLoadingInstrutores(true);
    const { data: profs, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'professor');
    if (!error && profs) setInstrutores(profs as Profile[]);
    setLoadingInstrutores(false);
  };

  const fetchBloqueiosEOcupados = async () => {
    const [{ data: bl }, { data: ag }] = await Promise.all([
      supabase
        .from('bloqueios')
        .select('*')
        .eq('instrutor_id', instrutorId)
        .eq('data', data),
      supabase
        .from('agendamentos')
        .select('horario')
        .eq('instrutor_id', instrutorId)
        .eq('data', data)
        .in('status', ['pendente', 'confirmado']),
    ]);
    setBloqueios((bl as Bloqueio[]) ?? []);
    setHorariosOcupados((ag ?? []).map((a: { horario: string }) => a.horario));
  };

  const checkAgendamentoAluno = async () => {
    const { data: ag } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('aluno_id', profile!.id)
      .eq('data', data)
      .in('status', ['pendente', 'confirmado']);
    setAgendamentosHoje((ag ?? []).map((a: { id: string }) => a.id));
  };

  const isSlotDisabled = (slot: string): boolean => {
    if (horariosOcupados.includes(slot)) return true;
    for (const b of bloqueios) {
      if (isTimeBlocked(slot, b.horario_inicio, b.horario_fim)) return true;
    }
    return false;
  };

  const availableSlots = allSlots.filter(s => !isSlotDisabled(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !horario || !instrutorId) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (agendamentosHoje.length > 0) {
      toast.error('Você já possui um agendamento neste dia.');
      return;
    }
    if (isHorarioBlocked(horario)) {
      toast.error('Este horário está bloqueado pelo instrutor.');
      return;
    }
    if (horariosOcupados.includes(horario)) {
      toast.error('Este horário já está reservado.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('agendamentos').insert({
      aluno_id: profile!.id,
      instrutor_id: instrutorId,
      data,
      horario,
      status: 'pendente',
    });
    setLoading(false);
    if (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(`Erro: ${error.message || 'Tente novamente'}`);
    } else {
      toast.success('Aula solicitada com sucesso! Aguarde a confirmação do instrutor.');
      setData('');
      setHorario('');
      setInstrutorId('');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout title="Novo Agendamento">
      <div className="max-w-xl mx-auto">
        {/* Header card */}
        <div
          className="rounded-2xl p-6 mb-6 text-white"
          style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <PlaneTakeoff className="w-6 h-6" />
            <h2 className="text-xl font-bold">Solicitar Aula de Voo</h2>
          </div>
          <p className="text-blue-200 text-sm">
            Escolha a data, horário e instrutor para sua próxima aula.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                Data da aula
              </Label>
              <input
                type="date"
                value={data}
                min={today}
                onChange={e => setData(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10 bg-white text-gray-800"
              />
            </div>

            {/* Instrutor */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <User className="w-4 h-4 text-[#1B2A6B]" />
                Instrutor
              </Label>
              {loadingInstrutores ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando instrutores...
                </div>
              ) : (
                <Select value={instrutorId} onValueChange={setInstrutorId}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#1B2A6B]">
                    <SelectValue placeholder="Selecione o instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instrutores.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <Clock className="w-4 h-4 text-[#1B2A6B]" />
                Horário
              </Label>
              {!data || !instrutorId ? (
                <p className="text-gray-400 text-sm py-2 italic">
                  Selecione a data e o instrutor primeiro.
                </p>
              ) : availableSlots.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  Nenhum horário disponível para esta data e instrutor.
                </div>
              ) : (
                <Select value={horario} onValueChange={setHorario}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#1B2A6B]">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Alerta 1 aula por dia */}
            {agendamentosHoje.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm">
                Você já possui um agendamento neste dia. Apenas 1 aula por dia é permitida.
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !data || !horario || !instrutorId || agendamentosHoje.length > 0}
              className="w-full h-11 font-semibold text-white"
              style={{ background: '#1B2A6B' }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Solicitando...</>
              ) : (
                <><PlaneTakeoff className="w-4 h-4 mr-2" />Solicitar Aula</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
