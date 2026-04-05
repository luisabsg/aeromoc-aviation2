import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cnfkslzxiqdorccjkhlv.supabase.co';
const supabaseKey = 'sb_publishable_6JA-gvKcTU7gFXMomu8MsA_ooTnER6d';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'professor' | 'aluno';

export interface Profile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
}

export interface Agendamento {
  id: string;
  aluno_id: string;
  instrutor_id: string;
  data: string;
  horario: string;
  status: 'aguardando' | 'aceito' | 'recusado';
  observacao?: string;
  created_at?: string;
  // joined
  aluno?: Profile;
  instrutor?: Profile;
}

export interface Bloqueio {
  id: string;
  instrutor_id: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  motivo?: string;
  created_at?: string;
}
