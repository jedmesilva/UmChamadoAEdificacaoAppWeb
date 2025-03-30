/**
 * Carregador de variáveis de ambiente para Vercel
 * 
 * Este arquivo assegura que as variáveis de ambiente estejam disponíveis
 * consistentemente na aplicação, independente do ambiente de execução.
 */

// Interface para o objeto Next.js global
declare global {
  interface Window {
    __NEXT_DATA__?: {
      env?: {
        [key: string]: string;
      };
    };
  }
}

// Verifica se já existe um objeto ENV na janela
if (typeof window !== 'undefined' && !window.ENV) {
  // Criar objeto ENV se não existir
  window.ENV = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string || "",
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string || ""
  };
  
  // Tentar obter variáveis do Vercel (caso seja injetado pelo servidor)
  if (typeof window.__NEXT_DATA__ !== 'undefined' && window.__NEXT_DATA__?.env) {
    const env = window.__NEXT_DATA__.env;
    if (env.VITE_SUPABASE_URL) window.ENV.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
    if (env.VITE_SUPABASE_ANON_KEY) window.ENV.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
  }
  
  // Verificar se alguma variável está faltando - avisar no console
  const missingVars = [];
  if (!window.ENV.VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!window.ENV.VITE_SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    console.warn(`[ENV] Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
  } else {
    console.log('[ENV] Variáveis de ambiente carregadas com sucesso');
  }
}

// Exportar função para obter variáveis
export function getEnvVariable(key: string): string {
  if (typeof window !== 'undefined' && window.ENV && window.ENV[key]) {
    return window.ENV[key] || "";
  }
  
  // Em ambientes Node.js
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || "";
  }
  
  // Em ambientes Vite
  if (import.meta && import.meta.env && (import.meta.env as any)[key]) {
    return (import.meta.env as any)[key] as string;
  }
  
  return "";
}

// Exportar as variáveis de ambiente diretamente para facilitar o uso
export const SUPABASE_URL = getEnvVariable('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnvVariable('VITE_SUPABASE_ANON_KEY');

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  getEnvVariable
};