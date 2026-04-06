import React, { createContext, useContext, useEffect, useState } from 'react';
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

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout ao aguardar resposta.')), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        8000
      );

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
      setLoading(false);
      return;
    }

    await fetchProfile(currentUser.id);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        await applySession(data.session);
      } catch (err) {
        console.error('Erro ao iniciar auth:', err);
        if (!mounted) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;

      setTimeout(() => {
        if (!mounted) return;
        applySession(session).catch((err) => {
          console.error('Erro no onAuthStateChange:', err);
          if (!mounted) return;
          setLoading(false);
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        10000
      );

      if (error) {
        console.error('Erro no login:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Erro inesperado no signIn:', err);
      return { error: 'O login demorou demais ou falhou. Tente novamente.' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
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