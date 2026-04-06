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
    let ativo = true;

    const fetchInstrutores = async () => {
      try {
        setLoadingInstrutores(true);

        const { data: profs, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'professor');

        if (!ativo) return;

        if (error) {
          console.error('Erro ao buscar instrutores:', error);
          toast.error('Não foi possível carregar os instrutores.');
          setInstrutores([]);
          return;
        }

        setInstrutores((profs as Profile[]) ?? []);
      } catch (err) {
        if (!ativo) return;
        console.error('Falha inesperada ao buscar instrutores:', err);
        toast.error('Erro inesperado ao carregar os instrutores.');
        setInstrutores([]);
      } finally {
        if (ativo) {
          setLoadingInstrutores(false);
        }
      }
    };

    fetchInstrutores();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    const fetchBloqueiosEOcupados = async () => {
      if (!data || !instrutorId) {
        setBloqueios([]);
        setHorariosOcupados([]);
        setHorario('');
        return;
      }

      try {
        const [
          { data: bl, error: bloqueiosError },
          { data: ag, error: agendamentosError },
        ] = await Promise.all([
          supabase
            .from('bloqueios')
            .select('*')
            .eq('instrutor_id', instrutorId)
            .eq('data', data),

          // horários ocupados agora são globais por dia,
          // independentemente do instrutor escolhido
          supabase
            .from('agendamentos')
            .select('horario')
            .eq('data', data)
            .in('status', ['pendente', 'confirmado']),
        ]);

        if (!ativo) return;

        if (bloqueiosError) {
          console.error('Erro ao buscar bloqueios:', bloqueiosError);
        }

        if (agendamentosError) {
          console.error('Erro ao buscar horários ocupados:', agendamentosError);
        }

        setBloqueios((bl as Bloqueio[]) ?? []);
        setHorariosOcupados((ag ?? []).map((a: { horario: string }) => a.horario));
      } catch (err) {
        if (!ativo) return;
        console.error('Erro inesperado ao buscar bloqueios e horários:', err);
        setBloqueios([]);
        setHorariosOcupados([]);
      } finally {
        if (ativo) {
          setHorario('');
        }
      }
    };

    fetchBloqueiosEOcupados();

    return () => {
      ativo = false;
    };
  }, [data, instrutorId]);

  useEffect(() => {
    let ativo = true;

    const checkAgendamentoAluno = async () => {
      if (!data || !profile?.id) {
        if (ativo) setAgendamentosHoje([]);
        return;
      }

      try {
        const { data: ag, error } = await supabase
          .from('agendamentos')
          .select('id')
          .eq('aluno_id', profile.id)
          .eq('data', data)
          .in('status', ['pendente', 'confirmado']);

        if (!ativo) return;

        if (error) {
          console.error('Erro ao verificar agendamento do aluno:', error);
          setAgendamentosHoje([]);
          return;
        }

        setAgendamentosHoje((ag ?? []).map((a: { id: string }) => a.id));
      } catch (err) {
        if (!ativo) return;
        console.error('Erro inesperado ao verificar agendamento do aluno:', err);
        setAgendamentosHoje([]);
      }
    };

    checkAgendamentoAluno();

    return () => {
      ativo = false;
    };
  }, [data, profile?.id]);

  const isHorarioBlocked = (slot: string): boolean => {
    for (const b of bloqueios) {
      if (isTimeBlocked(slot, b.horario_inicio, b.horario_fim)) return true;
    }
    return false;
  };

  const isSlotDisabled = (slot: string): boolean => {
    if (horariosOcupados.includes(slot)) return true;

    for (const b of bloqueios) {
      if (isTimeBlocked(slot, b.horario_inicio, b.horario_fim)) return true;
    }

    return false;
  };

  const availableSlots = allSlots.filter((s) => !isSlotDisabled(s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error('Usuário não identificado. Faça login novamente.');
      return;
    }

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

    try {
      setLoading(true);

      // dupla checagem no banco antes de inserir
      const { data: conflitoGlobal, error: conflitoError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('data', data)
        .eq('horario', horario)
        .in('status', ['pendente', 'confirmado'])
        .maybeSingle();

      if (conflitoError) {
        console.error('Erro ao validar conflito global:', conflitoError);
        toast.error('Erro ao validar disponibilidade do horário.');
        return;
      }

      if (conflitoGlobal) {
        toast.error('Este horário já está reservado para este dia.');
        return;
      }

      const { error } = await supabase.from('agendamentos').insert({
        aluno_id: profile.id,
        instrutor_id: instrutorId,
        data,
        horario,
        status: 'pendente',
      });

      if (error) {
        console.error('Erro ao criar agendamento:', error);
        toast.error(`Erro: ${error.message || 'Tente novamente'}`);
        return;
      }

      toast.success('Aula solicitada com sucesso! Aguarde a confirmação do instrutor.');

      setData('');
      setHorario('');
      setInstrutorId('');
      setBloqueios([]);
      setHorariosOcupados([]);
      setAgendamentosHoje([]);
    } catch (err) {
      console.error('Erro inesperado ao criar agendamento:', err);
      toast.error('Erro inesperado ao solicitar aula.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout title="Novo Agendamento">
      <div className="max-w-xl mx-auto">
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
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                Data da aula
              </Label>
              <input
                type="date"
                value={data}
                min={today}
                onChange={(e) => setData(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10 bg-white text-gray-800"
              />
            </div>

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
                    {instrutores.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

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
                  Nenhum horário disponível para esta data.
                </div>
              ) : (
                <Select value={horario} onValueChange={setHorario}>
                  <SelectTrigger className="h-11 border-gray-200 focus:border-[#1B2A6B]">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

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
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <PlaneTakeoff className="w-4 h-4 mr-2" />
                  Solicitar Aula
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}