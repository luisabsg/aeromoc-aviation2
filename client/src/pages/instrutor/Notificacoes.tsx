/**
 * AeroMoc Aviation — Notificações (Instrutor)
 * Design: Clean Aviation Dashboard
 * Instrutor envia notificações para todos os alunos
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Bell, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface Notificacao {
  id: string;
  instrutor_id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'aviso' | 'urgente';
  ativo: boolean;
  criado_em: string;
}

export default function Notificacoes() {
  const { profile } = useAuth();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [tipo, setTipo] = useState<'info' | 'aviso' | 'urgente'>('info');

  useEffect(() => {
    fetchNotificacoes();
  }, [profile]);

  const fetchNotificacoes = async () => {
    if (!profile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('instrutor_id', profile.id)
      .order('criado_em', { ascending: false });

    if (!error && data) setNotificacoes(data as Notificacao[]);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error('Preencha título e mensagem.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('notificacoes').insert({
      instrutor_id: profile!.id,
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      tipo,
      ativo: true,
    });
    setSaving(false);
    if (error) {
      console.error('Erro ao salvar notificação:', error);
      toast.error('Erro ao salvar notificação.');
    } else {
      toast.success('Notificação criada com sucesso!');
      setTitulo('');
      setMensagem('');
      setTipo('info');
      fetchNotificacoes();
    }
  };

  const toggleNotificacao = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ ativo: !ativo })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar notificação.');
    } else {
      toast.success(ativo ? 'Notificação desativada.' : 'Notificação ativada.');
      fetchNotificacoes();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('notificacoes').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (error) {
      toast.error('Erro ao excluir notificação.');
    } else {
      toast.success('Notificação removida.');
      fetchNotificacoes();
    }
  };

  const tipoColor = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    aviso: 'bg-amber-50 border-amber-200 text-amber-700',
    urgente: 'bg-red-50 border-red-200 text-red-700',
  };

  const tipoIcon = {
    info: 'text-blue-500',
    aviso: 'text-amber-500',
    urgente: 'text-red-500',
  };

  return (
    <DashboardLayout title="Notificações">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
          >
            <Bell className="w-5 h-5 text-white" />
            <h2 className="text-white font-bold text-lg">Nova Notificação</h2>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold text-sm">Tipo</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold text-sm">Título</Label>
              <Input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Manutenção da aeronave"
                className="h-11 border-gray-200 focus:border-[#1B2A6B]"
              />
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold text-sm">Mensagem</Label>
              <Textarea
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Escreva a mensagem que será exibida no dashboard dos alunos..."
                className="border-gray-200 focus:border-[#1B2A6B] min-h-24"
              />
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
                <><Bell className="w-4 h-4 mr-2" />Enviar Notificação</>
              )}
            </Button>
          </form>
        </div>

        {/* Existing notifications */}
        <div>
          <h3 className="text-lg font-bold text-[#1B2A6B] mb-3">Notificações Ativas</h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#1B2A6B]" />
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma notificação enviada</p>
              <p className="text-gray-400 text-sm mt-1">Crie uma notificação para informar os alunos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificacoes.map(notif => (
                <div
                  key={notif.id}
                  className={`rounded-xl border p-4 transition-all ${
                    notif.ativo ? tipoColor[notif.tipo] : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={`w-4 h-4 ${notif.ativo ? tipoIcon[notif.tipo] : 'text-gray-400'}`} />
                        <h4 className="font-bold">{notif.titulo}</h4>
                        {!notif.ativo && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Inativa</span>}
                      </div>
                      <p className="text-sm leading-relaxed">{notif.mensagem}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(notif.criado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleNotificacao(notif.id, notif.ativo)}
                        className={notif.ativo ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}
                      >
                        {notif.ativo ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(notif.id)}
                        disabled={deletingId === notif.id}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        {deletingId === notif.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
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
              Excluir notificação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
