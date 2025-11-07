import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

// Headers CORS para permitir que o seu site chame a função
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // O browser envia uma requisição OPTIONS primeiro, que precisa ser tratada
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Extrai os dados do usuário do corpo da requisição
    const { userRecord } = await req.json();
    if (!userRecord) throw new Error("Dados do usuário não fornecidos.");

    // 2. Cria um cliente Supabase com permissões de administrador
    // Isso é necessário para poder criar/editar usuários sem restrições de RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Prepara o objeto de dados para salvar no banco
    const dataToUpsert: any = {
      id: userRecord.id || undefined, // Se for um novo usuário, o id será undefined
      username: userRecord.username,
      role: userRecord.role,
      active: userRecord.active,
    };

    // 4. Se uma nova senha foi fornecida, hasheia ela
    if (userRecord.password) {
      if (userRecord.password.length < 6) {
        throw new Error("A senha deve ter no mínimo 6 caracteres.");
      }
      const salt = await bcrypt.genSalt(10);
      dataToUpsert.password_hash = await bcrypt.hash(userRecord.password, salt);
    }

    // 5. Usa o comando `upsert` para criar ou atualizar o usuário
    // O `upsert` irá INSERIR se o `id` for nulo, ou ATUALIZAR se o `id` existir.
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(dataToUpsert)
      .select("id, username, role, active") // Retorna o usuário salvo sem o hash
      .single();

    if (error) {
      // Trata erro de username duplicado
      if (error.message.includes('duplicate key value violates unique constraint "users_username_key"')) {
          throw new Error(`O nome de usuário '${userRecord.username}' já está em uso.`);
      }
      throw error;
    }

    // 6. Retorna o usuário salvo como confirmação
    return new Response(JSON.stringify({ user: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Retorna qualquer erro que ocorrer durante o processo
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
