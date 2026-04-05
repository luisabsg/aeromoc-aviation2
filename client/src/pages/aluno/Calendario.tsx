/**
 * AeroMoc Aviation — Calendário (Aluno)
 */
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarioVoos from '@/components/CalendarioVoos';

export default function CalendarioAluno() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <DashboardLayout title="Calendário">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#1B2A6B]">Meu Calendário de Voos</h2>
          <p className="text-gray-500 text-sm mt-0.5">Visualize todas as suas aulas agendadas</p>
        </div>
        <CalendarioVoos userId={profile.id} role="aluno" />
      </div>
    </DashboardLayout>
  );
}
