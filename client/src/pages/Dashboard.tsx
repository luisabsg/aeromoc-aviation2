/**
 * AeroMoc Aviation — Dashboard redirect
 * Routes user to correct first page based on role
 */
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { profile, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate('/login');
      return;
    }
    if (profile.role === 'professor') {
      navigate('/dashboard/solicitacoes');
    } else {
      navigate('/dashboard/novo');
    }
  }, [profile, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6FA]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1B2A6B]" />
        <p className="text-gray-500 text-sm">Carregando...</p>
      </div>
    </div>
  );
}
