/**
 * AeroMoc Aviation — Bloqueios da Agenda (Instrutor)
 * Design: Clean Aviation Dashboard
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate, generateTimeSlots } from '@/lib/utils';
import type { Bloqueio } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, Ban, CalendarDays, Clock, Trash2, PlusCircle, AlertCircle
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const timeSlots = generateTimeSlots();

export default function Bloqueios() {
  const { profile } = useAuth();
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    fetchBloqueios();
  }, [profile]);

  const fetchBloqueios = async () => {
    if (!profile) return;
    setLoading(true);
    const { data: bl, error } = await supabase
      .from('bloqueios')
      .select('*')
      .eq('instrutor_id', profile.id)
      .order('data', { ascending: true })
      .order('horario_inicio', { ascending: true });

    if (!error && bl) setBloqueios(bl as Bloqueio[]);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !horarioInicio || !horarioFim) {
      toast.error('Preencha data, horário inicial e final.');
      return;
    }
    if (horarioFim <= horarioInicio) {
      toast.error('O horário final deve ser maior que o inicial.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('bloqueios').insert({
      instrutor_id: profile!.id,
      data,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      motivo: motivo.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar bloqueio.');
    } else {
      toast.success('Bloqueio cadastrado com sucesso!');
      setData('');
      setHorarioInicio('');
      setHorarioFim('');
      setMotivo('');
      fetchBloqueios();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('bloqueios').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (error) {
      toast.error('Erro ao excluir bloqueio.');
    } else {
      toast.success('Bloqueio removido.');
      fetchBloqueios();
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const endSlots = horarioInicio ? timeSlots.filter(s => s > horarioInicio) : timeSlots;

  return (
    <DashboardLayout title="Bloqueios da Agenda">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
          >
            <Ban className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Novo Bloqueio</h2>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Data */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                  <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                  Data
                </Label>
                <input
                  type="date"
                  value={data}
                  min={today}
                  onChange={e => setData(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/10 bg-white text-gray-800"
                />
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold text-sm">Motivo (opcional)</Label>
                <Input
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Ex: Manutenção da aeronave"
                  className="h-11 border-gray-200 focus:border-[#1B2A6B]"
                />
              </div>

              {/* Horário início */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                  <Clock className="w-4 h-4 text-[#1B2A6B]" />
                  Horário Inicial
                </Label>
                <Select value={horarioInicio} onValueChange={v => { setHorarioInicio(v); setHorarioFim(''); }}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeSlots.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário fim */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                  <Clock className="w-4 h-4 text-[#1B2A6B]" />
                  Horário Final
                </Label>
                <Select value={horarioFim} onValueChange={setHorarioFim} disabled={!horarioInicio}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {endSlots.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full h-11 font-semibold text-white"
              style={{ background: '#1B2A6B' }}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><PlusCircle className="w-4 h-4 mr-2" />Cadastrar Bloqueio</>
              )}
            </Button>
          </form>
        </div>

        {/* Existing blocks */}
        <div>
          <h3 className="text-lg font-bold text-[#1B2A6B] mb-3">Bloqueios Cadastrados</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1B2A6B]" />
            </div>
          ) : bloqueios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Ban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhum bloqueio cadastrado</p>
              <p className="text-gray-400 text-sm mt-1">Adicione bloqueios para controlar sua disponibilidade.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bloqueios.map(bl => (
                <div
                  key={bl.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all"
                >
                  <div className="w-1 h-10 rounded-full bg-[#E8192C] shrink-0" />
                  <div className="flex-1 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <CalendarDays className="w-4 h-4 text-[#1B2A6B]" />
                      <span className="font-semibold">{formatDate(bl.data)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{bl.horario_inicio} – {bl.horario_fim}</span>
                    </div>
                    {bl.motivo && (
                      <span className="text-gray-500 text-sm italic">"{bl.motivo}"</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDeleteId(bl.id)}
                    disabled={deletingId === bl.id}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    {deletingId === bl.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Excluir bloqueio?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este bloqueio será removido e os horários voltarão a ficar disponíveis para agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
