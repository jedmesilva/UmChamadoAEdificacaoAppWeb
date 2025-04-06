// API para verificar o status da conexão com o Supabase
// Suporte tanto para ESM quanto CommonJS

// Importações ESM (com fallback para CommonJS)
let createClient;
try {
  // Tentativa de importação ESM
  createClient = (await import('@supabase/supabase-js')).createClient;
} catch (err) {
  try {
    // Fallback para CommonJS
    createClient = require('@supabase/supabase-js').createClient;
  } catch (commonjsErr) {
    console.error('Erro ao importar supabase-js:', err, commonjsErr);
    // Stub para não quebrar a aplicação
    createClient = (url, key) => ({
      from: () => ({ 
        select: () => ({ data: { count: 0 }, error: null })
      })
    });
  }
}

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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  // Usar preferencialmente a service key
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      status: 'error',
      message: 'Variáveis de ambiente do Supabase não encontradas',
      details: {
        SUPABASE_URL: supabaseUrl ? 'configurado' : 'não configurado',
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'configurado' : 'não configurado',
        SUPABASE_ANON_KEY: supabaseAnonKey ? 'configurado' : 'não configurado',
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