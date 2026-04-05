import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

type SignInResult = {
  error: string | null;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar profile:', error.message);
      setProfile(null);
      return;
    }

    setProfile(data as Profile);
  };

  const refreshProfile = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Erro ao obter sessão:', error.message);
      setUser(null);
      setProfile(null);
      return;
    }

    if (!session?.user) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(session.user);
    await fetchProfile(session.user.id);
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Erro ao carregar sessão inicial:', error.message);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setProfile(null);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      setLoading(true);

      if (session?.user) {
        setUser(session.user);
        setProfile(null);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    try {
      setLoading(true);
      setProfile(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error.message);
        setLoading(false);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('Erro inesperado no login:', err);
      setLoading(false);
      return { error: 'Erro inesperado ao entrar.' };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Erro no logout:', error.message);
      }

      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Erro inesperado no logout:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}