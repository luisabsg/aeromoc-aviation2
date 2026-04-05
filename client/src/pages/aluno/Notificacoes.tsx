/**
 * AeroMoc Aviation — Notificações (Aluno)
 * Design: Clean Aviation Dashboard
 * Aluno visualiza notificações dos instrutores
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, Bell, AlertCircle, Info, AlertTriangle } from 'lucide-react';

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
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificacoes();
    // Atualizar a cada 5 segundos para notificações em tempo real
    const interval = setInterval(fetchNotificacoes, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificacoes = async () => {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false });

    if (!error && data) setNotificacoes(data as Notificacao[]);
    setLoading(false);
  };

  const tipoConfig = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      label: 'Informação',
    },
    aviso: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      label: 'Aviso',
    },
    urgente: {
      bg: 'bg-red-50 border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      label: 'Urgente',
    },
  };

  return (
    <DashboardLayout title="Notificações">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
          </div>
        ) : notificacoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-600 font-semibold mb-1">Nenhuma notificação</h3>
            <p className="text-gray-400 text-sm">
              Você receberá notificações dos instrutores aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificacoes.map(notif => {
              const config = tipoConfig[notif.tipo];
              return (
                <div
                  key={notif.id}
                  className={`rounded-xl border p-5 transition-all hover:shadow-md ${config.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0">{config.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{notif.titulo}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60">
                          {config.label}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        {notif.mensagem}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.criado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
