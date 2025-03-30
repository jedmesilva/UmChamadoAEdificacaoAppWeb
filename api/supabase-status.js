export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Verifica se as variáveis de ambiente estão definidas
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  const hasEnvVars = !!supabaseUrl && !!supabaseAnonKey;
  
  // Tentar fazer um ping ao Supabase para verificar disponibilidade
  let supabaseAvailable = false;
  let supabaseError = null;
  let supabaseLatency = null;
  
  if (hasEnvVars) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
        },
      });
      const endTime = Date.now();
      supabaseLatency = endTime - startTime;
      
      if (response.ok) {
        const data = await response.json();
        supabaseAvailable = true;
      } else {
        supabaseError = `Erro HTTP ${response.status}: ${response.statusText}`;
      }
    } catch (error) {
      supabaseError = `Erro na conexão: ${error.message}`;
    }
  } else {
    supabaseError = 'Variáveis de ambiente não definidas';
  }
  
  // Responder com o status
  res.status(200).json({
    timestamp: new Date().toISOString(),
    env: {
      supabase_url_set: !!supabaseUrl,
      supabase_anon_key_set: !!supabaseAnonKey
    },
    supabase: {
      available: supabaseAvailable,
      latency: supabaseLatency,
      error: supabaseError
    },
    deployment: 'Vercel Serverless Function'
  });
}