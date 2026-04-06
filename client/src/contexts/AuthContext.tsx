import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const authActionRef = useRef<'idle' | 'signing-in' | 'signing-out'>('idle');

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar profile:', error);
        setProfile(null);
        return null;
      }

      const perfil = (data as Profile | null) ?? null;
      setProfile(perfil);
      return perfil;
    } catch (err) {
      console.error('Erro inesperado ao buscar profile:', err);
      setProfile(null);
      return null;
    }
  };

  const applySession = async (session: Session | null) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      return;
    }

    await fetchProfile(currentUser.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
          setProfile(null);
          return;
        }

        await applySession(session);
      } catch (err) {
        console.error('Erro ao iniciar auth:', err);
        if (!mounted) return;
        setUser(null);
        setProfile(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setTimeout(async () => {
        if (!mounted) return;

        try {
          if (authActionRef.current === 'signing-out' && event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            return;
          }

          await applySession(session);
        } catch (err) {
          console.error('Erro no onAuthStateChange:', err);
        } finally {
          if (mounted) {
            setLoading(false);
            authActionRef.current = 'idle';
          }
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      authActionRef.current = 'signing-in';
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        authActionRef.current = 'idle';
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Erro inesperado no signIn:', err);
      authActionRef.current = 'idle';
      return { error: 'Erro inesperado ao fazer login.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      authActionRef.current = 'signing-out';

      // limpa o estado imediatamente para evitar "sobra" do usuário anterior
      setUser(null);
      setProfile(null);
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro ao sair:', error);
      }
    } catch (err) {
      console.error('Erro inesperado ao sair:', err);
    } finally {
      // garante limpeza total mesmo se o evento do Supabase atrasar
      setUser(null);
      setProfile(null);
      setLoading(false);
      authActionRef.current = 'idle';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}