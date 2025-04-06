import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Handler para verificar o status da inscrição de um usuário
 * 
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
export default async function handler(req, res) {
  // Verifica se é uma requisição OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Apenas aceita requisições POST
  if (req.method !== 'POST') {
    console.warn(`Método ${req.method} não permitido para verificação de status de inscrição`);
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      method: req.method
    });
  }
  
  // Configuração do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Verificação de configurações
  if (!supabaseUrl || !supabaseKey) {
    console.error('Configuração do Supabase faltando para verificação de status');
    return res.status(500).json({
      success: false,
      message: 'Erro de configuração do servidor'
    });
  }
  
  try {
    // Extrai o email da requisição
    const { email } = req.body;
    
    // Valida o email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.warn('Email inválido para verificação de status:', email);
      return res.status(400).json({
        success: false,
        message: 'Email inválido. Por favor, forneça um email válido'
      });
    }
    
    console.log(`Verificando status de inscrição para: ${email}`);
    
    // Inicialização do cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`Cliente Supabase inicializado para verificação de status`);
    
    // Busca a inscrição do usuário
    let subscription = null;
    let queryError = null;
    
    try {
      const result = await supabase
        .from('subscription_um_chamado')
        .select('*')
        .eq('email_subscription', email)
        .single();
      
      subscription = result.data;
      queryError = result.error;
    } catch (err) {
      console.error('Erro ao consultar inscrição para verificação de status:', err);
      queryError = err;
    }
    
    // Se houver erro na consulta
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Erro ao verificar status de inscrição:', queryError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar status de inscrição',
        details: queryError.message
      });
    }
    
    // Se não encontrou inscrição
    if (!subscription) {
      console.log(`Inscrição não encontrada para: ${email}`);
      return res.status(200).json({
        success: true,
        isSubscribed: false,
        hasSubscriptionStatus: false,
        message: 'Usuário não inscrito'
      });
    }
    
    // Inscrição encontrada
    const hasSubscriptionStatus = !!subscription.status_subscription && 
                                 subscription.status_subscription === 'is_subscription_um_chamado';
    
    console.log(`Status de inscrição para ${email}: ${hasSubscriptionStatus ? 'Inscrito' : 'Sem status definido'}`);
    
    return res.status(200).json({
      success: true,
      isSubscribed: true,
      hasSubscriptionStatus: hasSubscriptionStatus,
      message: hasSubscriptionStatus 
        ? 'Usuário inscrito com status confirmado' 
        : 'Usuário inscrito, mas sem status confirmado'
    });
    
  } catch (error) {
    console.error('Erro crítico ao verificar status de inscrição:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor', 
      message: 'Não foi possível verificar o status da inscrição',
      details: error.message || String(error)
    });
  }
}