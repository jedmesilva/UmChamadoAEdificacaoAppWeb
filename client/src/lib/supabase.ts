import { createClient } from '@supabase/supabase-js';
import { getEnvVariable } from './vercel-env';

// Adicionar tipagem para o objeto ENV global na window
declare global {
  interface Window {
    ENV?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    };
  }
}

// Obter as variáveis de ambiente do Supabase
const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');

// Registrar no console para depuração
console.log('Supabase URL disponível:', !!supabaseUrl);
console.log('Supabase Anon Key disponível:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('As variáveis de ambiente do Supabase não estão configuradas corretamente.');
}

// Cria o cliente Supabase para o frontend
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);