// API para verificar o status da conexão com o Supabase

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'OK' });
  }
  
  // Verificar se temos as variáveis de ambiente do Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      status: 'error',
      message: 'Variáveis de ambiente do Supabase não encontradas',
      details: {
        VITE_SUPABASE_URL: supabaseUrl ? 'configurado' : 'não configurado',
        VITE_SUPABASE_ANON_KEY: supabaseKey ? 'configurado' : 'não configurado',
      }
    });
  }
  
  try {
    // Inicializar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar a conexão com uma consulta simples
    const start = Date.now();
    const { data, error } = await supabase
      .from('subscription_um_chamado')
      .select('count', { count: 'exact' })
      .limit(1);
      
    const end = Date.now();
    const responseTime = end - start;
    
    if (error) {
      throw error;
    }
    
    // Responder com informações de status
    return res.status(200).json({
      status: 'online',
      message: 'Conexão com Supabase estabelecida com sucesso',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      counts: {
        subscriptions: data?.count || 0
      }
    });
    
  } catch (error) {
    console.error('Erro ao conectar com Supabase:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao conectar com Supabase',
      details: error.message || String(error),
      timestamp: new Date().toISOString()
    });
  }
}