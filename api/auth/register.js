// API de registro de usuários para Vercel Serverless
// Suporte tanto para ESM quanto CommonJS

// Importações ESM (com fallback para CommonJS)
let createClient, uuidv4;
try {
  // Tentativa de importação ESM
  createClient = (await import('@supabase/supabase-js')).createClient;
  uuidv4 = (await import('uuid')).v4;
} catch (err) {
  try {
    // Fallback para CommonJS
    createClient = require('@supabase/supabase-js').createClient;
    uuidv4 = require('uuid').v4;
  } catch (commonjsErr) {
    console.error('Erro ao importar módulos:', err, commonjsErr);
    // Stubs para não quebrar a aplicação
    createClient = (url, key) => ({
      auth: { admin: { createUser: () => ({ error: { message: 'Falha ao carregar supabase-js' } }) } },
      from: () => ({ select: () => ({ error: { message: 'Falha ao carregar supabase-js' } }) })
    });
    uuidv4 = () => 'fallback-uuid';
  }
}

export default async function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Lidar com preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a preflight request com 200 OK');
    return res.status(200).end();
  }

  // Apenas o método POST é permitido para esta rota
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Método não permitido', 
      method: req.method,
      allowedMethods: ['POST']
    });
  }

  // Garantindo que req.body esteja corretamente parseado se for JSON
  if (req.body && typeof req.body === 'string' && req.headers['content-type']?.includes('application/json')) {
    try {
      req.body = JSON.parse(req.body);
      console.log('Body JSON parseado com sucesso');
    } catch (error) {
      console.error('Erro ao parsear JSON do body:', error);
    }
  }

  // Configurar cliente Supabase
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  // Usar a chave de serviço em vez da chave anônima para operações de API backend
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  // Escolha a chave apropriada (preferencialmente a chave de serviço)
  const supabaseKey = supabaseServiceKey || supabaseAnonKey;

  console.log(`Configurando Supabase com URL: ${supabaseUrl ? 'disponível' : 'não disponível'}, 
            ROLE KEY: ${supabaseServiceKey ? 'disponível' : 'não disponível'},
            ANON KEY: ${supabaseAnonKey ? 'disponível' : 'não disponível'}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Configuração do Supabase não encontrada no ambiente');
    return res.status(500).json({ 
      error: 'Configuração do Supabase não encontrada no ambiente' 
    });
  }

  try {
    // Extrair dados de registro
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: "Email, senha e nome são obrigatórios" 
      });
    }

    console.log(`Processando registro para o email: ${email}`);
    
    // Inicializar cliente Supabase com SERVICE ROLE (bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Verificar se o usuário já existe
    const { data: existingUser, error: userError } = await supabase
      .auth.admin.getUserByEmail(email);
      
    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao verificar usuário existente:', userError);
      return res.status(500).json({
        error: 'Erro ao verificar usuário existente',
        details: userError.message
      });
    }
    
    if (existingUser) {
      console.log(`Usuário já existe no Auth: ${email}`);
      return res.status(409).json({
        error: 'Este email já está registrado'
      });
    }
    
    // 2. Criar o usuário na tabela auth.users com metadados
    const { data: authUserData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        name: name,
      },
    });

    if (signUpError) {
      console.error('Erro ao criar usuário:', signUpError);
      return res.status(500).json({
        error: 'Erro ao criar usuário',
        details: signUpError.message
      });
    }
    
    const authUser = authUserData.user;
    
    if (!authUser) {
      return res.status(500).json({
        error: 'Falha ao criar usuário no Supabase Auth'
      });
    }

    // 3. Buscar se já existe um account_user com este email
    const { data: existingAccount, error: accountCheckError } = await supabase
      .from('account_user')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (accountCheckError && accountCheckError.code !== 'PGRST116') {
      console.error('Erro ao verificar conta existente:', accountCheckError);
    }
    
    let accountUser;
    
    if (existingAccount) {
      // Atualizar o usuário existente
      const { data: updatedUser, error: updateError } = await supabase
        .from('account_user')
        .update({
          id: authUser.id, // Atualiza para usar o ID do auth.users 
          user_id: authUser.id,
          name,
          status: 'active',
          created_at: new Date().toISOString(), // Campo obrigatório
        })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        console.error('Erro ao atualizar conta existente:', updateError);
        return res.status(500).json({
          error: 'Erro ao atualizar conta existente',
          details: updateError.message
        });
      }
      
      accountUser = updatedUser;
    } else {
      // Criar um novo account_user
      const { data: newUser, error: insertError } = await supabase
        .from('account_user')
        .insert({
          id: authUser.id, // Usando o mesmo ID do auth.users
          user_id: authUser.id,
          name,
          email,
          status: 'active',
          created_at: new Date().toISOString(), // Campo obrigatório
        })
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar conta de usuário:', insertError);
        return res.status(500).json({
          error: 'Erro ao criar conta de usuário',
          details: insertError.message
        });
      }
      
      accountUser = newUser;
    }
    
    console.log(`Usuário cadastrado com sucesso: ${email}, ID: ${authUser.id}`);
    console.log(`Conta de usuário: ${JSON.stringify(accountUser)}`);
    
    return res.status(201).json({
      message: "Usuário criado com sucesso",
      userId: authUser.id, 
      email: authUser.email,
      name: accountUser.name,
      accountUser: accountUser // Incluindo os dados da tabela account_user
    });
    
  } catch (error) {
    console.error('Erro ao processar registro:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message || String(error)
    });
  }
}