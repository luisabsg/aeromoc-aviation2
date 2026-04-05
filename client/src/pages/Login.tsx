/**
 * AeroMoc Aviation — Login Page
 * Design: Clean Aviation Dashboard
 * Navy sidebar (#1B2A6B), white background, Barlow + Inter typography
 * Red (#E8192C) for brand accents only
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Plane, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const LOGO_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663517498116/VRSe3ygr3YDCgGhtaryZLm/aeromoc-logo_05fd6baf.png';

export default function Login() {
  const { signIn } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error('Credenciais inválidas. Verifique e tente novamente.');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #1B2A6B 0%, #0D1B3E 100%)' }}
      >
        <div className="flex items-center gap-3">
          <Plane className="text-white w-6 h-6" />
          <span className="text-white font-semibold tracking-widest text-sm uppercase">AeroMoc Aviation</span>
        </div>

        <div>
          <div className="w-12 h-1 mb-6" style={{ background: '#E8192C' }} />
          <h2 className="text-white text-3xl font-bold leading-snug mb-4">
            Agendamento de<br />Aulas de Voo
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Plataforma oficial para alunos e instrutores gerenciarem horários, visualizarem calendários e controlarem disponibilidade de voos.
          </p>
        </div>

        <div className="flex items-center gap-2 text-blue-300 text-xs">
          <span>© 2025 AeroMoc Aviation</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F4F6FA] p-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={LOGO_URL}
              alt="AeroMoc Aviation"
              className="h-20 object-contain"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#1B2A6B] mb-1">Entrar</h1>
            <p className="text-gray-500 text-sm mb-6">Acesse sua conta para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-11 border-gray-200 focus:border-[#1B2A6B] focus:ring-[#1B2A6B]/20"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-11 border-gray-200 focus:border-[#1B2A6B] focus:ring-[#1B2A6B]/20 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold text-white"
                style={{ background: '#1B2A6B' }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</>
                ) : 'Entrar'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Problemas para acessar? Entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
