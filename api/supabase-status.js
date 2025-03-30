/**
 * API endpoint para verificação do status do Supabase
 * Verifica a conectividade com o Supabase e retorna o status
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

  // Variáveis de ambiente do Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Verificar se as variáveis de ambiente estão definidas
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      status: 'error',
      message: 'Variáveis de ambiente do Supabase não estão configuradas',
      environmentVars: {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }
    });
  }

  try {
    // Criar cliente do Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fazer uma consulta simples para verificar a conectividade
    const { data, error } = await supabase.from('subscription_um_chamado').select('count(*)', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao conectar ao Supabase',
        error: error.message,
        details: error
      });
    }

    // Retornar resposta de sucesso
    return res.status(200).json({
      status: 'success',
      message: 'Conectado ao Supabase com sucesso',
      timestamp: new Date().toISOString(),
      supabaseStatus: 'connected'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status do Supabase',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}