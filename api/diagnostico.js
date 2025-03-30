/**
 * API endpoint para diagnóstico do ambiente Vercel e Supabase
 * Retorna informações importantes para diagnóstico da aplicação.
 */

export default async function handler(req, res) {
  try {
    // Verificar se as variáveis de ambiente estão definidas
    const envInfo = {
      environment: process.env.NODE_ENV || 'não definido',
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV || 'não definido',
      vercelRegion: process.env.VERCEL_REGION || 'não definido',
      supabaseUrlSet: !!process.env.VITE_SUPABASE_URL,
      supabaseAnonKeySet: !!process.env.VITE_SUPABASE_ANON_KEY,
      storageType: process.env.STORAGE_TYPE || 'não definido'
    };

    // Criar um objeto com os dados de diagnóstico
    const diagnosticData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envInfo,
      runningAt: 'vercel-serverless',
      version: '1.0.0'
    };

    // Retornar os dados de diagnóstico
    res.status(200).json(diagnosticData);
  } catch (error) {
    // Capturar e retornar qualquer erro que ocorra
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}