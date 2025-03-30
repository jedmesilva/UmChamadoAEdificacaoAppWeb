/**
 * API endpoint para diagnóstico do ambiente Vercel e Supabase
 * Retorna informações importantes para diagnóstico da aplicação.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Coletar informações do ambiente
  const envVariables = {
    NODE_ENV: process.env.NODE_ENV || 'não definido',
    VERCEL_ENV: process.env.VERCEL_ENV || 'não definido',
    VERCEL_URL: process.env.VERCEL_URL || 'não definido',
    VERCEL_REGION: process.env.VERCEL_REGION || 'não definido',
    SUPABASE_URL_SET: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_KEY_SET: !!process.env.VITE_SUPABASE_ANON_KEY
  };

  // Verificar status do Supabase
  let supabaseStatus = {
    connected: false,
    error: null
  };

  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
      const { data, error } = await supabase.from('subscription_um_chamado').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        supabaseStatus.error = error.message;
      } else {
        supabaseStatus.connected = true;
      }
    } catch (error) {
      supabaseStatus.error = error.message;
    }
  }

  // Informações do runtime
  const runtimeInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Retornar todas as informações de diagnóstico
  return res.status(200).json({
    status: 'success',
    message: 'Diagnóstico de ambiente Vercel e Supabase',
    environment: envVariables,
    supabase: supabaseStatus,
    runtime: runtimeInfo
  });
}