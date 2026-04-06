import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

type Role = 'aluno' | 'professor' | 'admin'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { nome, email, password, role } = await req.json()

    if (!nome || !email || !password || !role) {
      return new Response(
        JSON.stringify({ error: 'Preencha nome, email, senha e role.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!['aluno', 'professor', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Role inválido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: createdUserData, error: createUserError } =
      await supabase.auth.admin.createUser({
        email: String(email).trim().toLowerCase(),
        password: String(password),
        email_confirm: true,
        user_metadata: {
          nome: String(nome).trim(),
          role: role as Role,
        },
      })

    if (createUserError || !createdUserData.user) {
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'Erro ao criar usuário.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const newUser = createdUserData.user

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: newUser.id,
        nome: String(nome).trim(),
        email: String(email).trim().toLowerCase(),
        role: role as Role,
      })

    if (profileError) {
      return new Response(
        JSON.stringify({ error: profileError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.id,
          nome,
          email,
          role,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro interno.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})