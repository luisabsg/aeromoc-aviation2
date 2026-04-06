/**
 * AeroMoc Aviation — Premium Login Page
 * Design: Clean Aviation Dashboard with premium aesthetics
 * Navy #1B2A6B, Red #E8192C, Barlow + Inter typography
 */
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { Plane, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-[#F4F6FA] via-white to-[#F0F3F8]">
      {/* Left panel — brand hero */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full opacity-10 border-2 border-white" />
        <div className="absolute bottom-20 left-10 w-32 h-32 rounded-full opacity-10 border-2 border-white" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Plane className="text-white w-7 h-7" />
            <span className="text-white font-bold tracking-widest text-sm uppercase">AeroMoc Aviation</span>
          </div>

          <div>
            <div className="w-16 h-1 mb-8" style={{ background: '#E8192C' }} />
            <h1 className="text-white text-5xl font-bold leading-tight mb-6">
              Agendamento de<br />Aulas de Voo
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-md">
              Plataforma oficial para alunos e instrutores gerenciarem horários, visualizarem calendários e controlarem disponibilidade de voos com segurança e eficiência.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-blue-300 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#E8192C]" />
            <span>Autenticação segura via Supabase</span>
          </div>
          <div className="flex items-center gap-3 text-blue-300 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#E8192C]" />
            <span>Calendário inteligente com bloqueios</span>
          </div>
          <div className="flex items-center gap-3 text-blue-300 text-sm">
            <div className="w-2 h-2 rounded-full bg-[#E8192C]" />
            <span>Gerenciamento de solicitações em tempo real</span>
          </div>
          <p className="text-blue-400 text-xs pt-4">© 2025 AeroMoc Aviation. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 lg:py-0 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img
              src={LOGO_URL}
              alt="AeroMoc Aviation"
              className="h-24 object-contain"
            />
          </div>

          {/* Form card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#1B2A6B] mb-2">Bem-vindo</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Acesse sua conta para gerenciar suas aulas de voo
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold text-sm">
                  E-mail
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 border-gray-200 focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/20 bg-gray-50 hover:bg-white transition-colors pl-4"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-semibold text-sm">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 border-gray-200 focus:border-[#1B2A6B] focus:ring-2 focus:ring-[#1B2A6B]/20 bg-gray-50 hover:bg-white transition-colors pl-4 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 font-semibold text-white text-base mt-8 group"
                style={{ background: 'linear-gradient(135deg, #1B2A6B 0%, #0D1B3E 100%)' }}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Entrando...</>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-gray-400 text-xs uppercase tracking-wider">ou</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Help text */}
            <p className="text-center text-gray-500 text-sm leading-relaxed">
              Problemas para acessar?{' '}
              <span className="text-[#1B2A6B] font-semibold cursor-pointer hover:underline">
                Entre em contato com o administrador
              </span>
            </p>
          </div>

          {/* Footer mobile */}
          <div className="text-center mt-6 lg:hidden">
            <p className="text-gray-400 text-xs">
              © 2025 AeroMoc Aviation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
