/**
 * AeroMoc Aviation — Calendário de Voos
 * Design: Clean Aviation Dashboard
 * Shared by both aluno and instrutor views
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, statusColor, statusDot, statusLabel, type StatusType } from '@/lib/utils';
import type { Agendamento, Profile, Bloqueio } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Clock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarioVoosProps {
  userId: string;
  role: 'aluno' | 'professor';
}

interface AgendamentoComNomes extends Agendamento {
  aluno?: Profile;
  instrutor?: Profile;
}

export default function CalendarioVoos({ userId, role }: CalendarioVoosProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<AgendamentoComNomes[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchAgendamentos();
    fetchBloqueios();
  }, [currentDate, userId, role]);

  const fetchAgendamentos = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    let query = supabase
      .from('agendamentos')
      .select('*, aluno:aluno_id(id, nome, email, role), instrutor:instrutor_id(id, nome, email, role)')
      .gte('data', start)
      .lte('data', end)
      .in('status', ['pendente', 'confirmado']);

    if (role === 'aluno') {
      query = query.eq('aluno_id', userId);
    } else {
      query = query.eq('instrutor_id', userId);
    }

    const { data, error } = await query.order('horario');
    if (!error && data) {
      setAgendamentos(data as AgendamentoComNomes[]);
    }
    setLoading(false);
  };

  const fetchBloqueios = async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    let query = supabase
      .from('bloqueios')
      .select('*, instrutor:instrutor_id(id, nome, email, role)')
      .gte('data', start)
      .lte('data', end);

    if (role === 'professor') {
      // Professor vê seus próprios bloqueios
      query = query.eq('instrutor_id', userId);
    }
    // Aluno vê TODOS os bloqueios (de todos os instrutores)

    const { data } = await query;
    if (data) setBloqueios(data as any);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getAgendamentosForDay = (day: Date) =>
    agendamentos.filter(ag => isSameDay(parseISO(ag.data), day));

  const getBloqueiosForDay = (day: Date) =>
    bloqueios.filter(b => isSameDay(parseISO(b.data), day));

  const selectedDayAgendamentos = selectedDay ? getAgendamentosForDay(selectedDay) : [];
  const selectedDayBloqueios = selectedDay ? getBloqueiosForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="text-white hover:bg-white/10 h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-white font-bold text-lg capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="text-white hover:bg-white/10 h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#1B2A6B]" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-16 border-b border-r border-gray-50" />
            ))}

            {days.map(day => {
              const dayAgs = getAgendamentosForDay(day);
              const dayBloqueios = getBloqueiosForDay(day);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'h-16 border-b border-r border-gray-50 p-1.5 text-left transition-colors hover:bg-blue-50/50',
                    isSelected && 'bg-blue-50 ring-2 ring-inset ring-[#1B2A6B]/20',
                    !isCurrentMonth && 'opacity-40',
                    dayBloqueios.length > 0 && 'bg-red-50/30'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1',
                      isCurrentDay ? 'bg-[#E8192C] text-white' : 'text-gray-700'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5">
                    {dayAgs.slice(0, 2).map(ag => (
                      <div
                        key={ag.id}
                        className={cn(
                          'text-xs px-1 rounded truncate font-medium',
                          ag.status === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {ag.horario}
                      </div>
                    ))}
                    {dayAgs.length > 2 && (
                      <div className="text-xs text-gray-400 px-1">+{dayAgs.length - 2}</div>
                    )}
                    {dayBloqueios.length > 0 && (
                      <div className="text-xs px-1 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                        Bloqueado
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-bold text-[#1B2A6B] mb-3 capitalize">
            {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h4>
          
          {selectedDayBloqueios.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-sm">Agenda bloqueada neste dia</p>
              {selectedDayBloqueios.map(b => {
                const instrutor = (b as any).instrutor;
                return (
                  <div key={b.id} className="text-red-600 text-xs mt-2 flex items-center justify-between">
                    <span>{b.horario_inicio} às {b.horario_fim}</span>
                    {role === 'aluno' && instrutor && (
                      <span className="text-red-500 font-semibold text-xs">Prof. {instrutor.nome}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selectedDayAgendamentos.length === 0 ? (
            <p className="text-gray-400 text-sm italic">Nenhuma aula neste dia.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayAgendamentos.map(ag => (
                <div key={ag.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={cn('w-1.5 h-8 rounded-full', statusDot(ag.status as StatusType))} />
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-800">{ag.horario}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {role === 'aluno'
                        ? (ag.instrutor as any)?.nome ?? 'Instrutor'
                        : (ag.aluno as any)?.nome ?? 'Aluno'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full border',
                      statusColor(ag.status as StatusType)
                    )}
                  >
                    {statusLabel(ag.status as StatusType)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
