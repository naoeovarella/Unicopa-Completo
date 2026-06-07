import { getSupabaseClient } from "./supabase";
import {
  STATUS_ENVIO_PALPITE_CONFIRMADO,
} from "./palpites";

const TABELA_PALPITES = "palpites";
const TABELA_USUARIOS = "usuarios";
const COLUNAS_PALPITE =
  "id,id_usuario,id_jogo,placar_time_casa,placar_time_fora,situacao,status_envio";

async function obterOuCriarUsuarioInterno(authUser) {
  const email = authUser?.email;

  if (!email) {
    throw new Error("Usuário autenticado sem e-mail para vincular ao cadastro interno.");
  }

  const supabase = getSupabaseClient();
  const { data: usuarioExistente, error: erroBusca } = await supabase
    .from(TABELA_USUARIOS)
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(erroBusca.message);
  }

  if (usuarioExistente?.id) {
    return usuarioExistente.id;
  }

  const nome =
    authUser.user_metadata?.nome ||
    authUser.user_metadata?.name ||
    authUser.user_metadata?.full_name ||
    email.split("@")[0];

  const { data: usuarioCriado, error: erroCriacao } = await supabase
    .from(TABELA_USUARIOS)
    .insert({ nome, email })
    .select("id")
    .single();

  if (erroCriacao) {
    throw new Error(erroCriacao.message);
  }

  return usuarioCriado.id;
}

export async function listarPalpitesDoUsuario(authUser) {
  const usuarioId = await obterOuCriarUsuarioInterno(authUser);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABELA_PALPITES)
    .select(COLUNAS_PALPITE)
    .eq("id_usuario", usuarioId);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function salvarPalpiteDoJogo({
  authUser,
  jogoId,
  golsCasa,
  golsFora,
  statusEnvio,
}) {
  const usuarioId = await obterOuCriarUsuarioInterno(authUser);
  const supabase = getSupabaseClient();

  const { data: palpiteExistente, error: erroBusca } = await supabase
    .from(TABELA_PALPITES)
    .select("id")
    .eq("id_usuario", usuarioId)
    .eq("id_jogo", jogoId)
    .maybeSingle();

  if (erroBusca) {
    throw new Error(erroBusca.message);
  }

  const palpite = {
    id_usuario: usuarioId,
    id_jogo: jogoId,
    placar_time_casa: golsCasa,
    placar_time_fora: golsFora,
  };

  if (statusEnvio) {
    palpite.status_envio = statusEnvio;
  }

  const query = palpiteExistente?.id
    ? supabase
        .from(TABELA_PALPITES)
        .update(palpite)
        .eq("id", palpiteExistente.id)
    : supabase.from(TABELA_PALPITES).insert(palpite);

  const { data, error } = await query
    .select(COLUNAS_PALPITE)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function confirmarPalpitesDoUsuario(authUser, palpites) {
  const palpitesConfirmados = [];

  for (const palpite of palpites) {
    const palpiteConfirmado = await salvarPalpiteDoJogo({
      authUser,
      jogoId: palpite.jogoId,
      golsCasa: palpite.golsCasa,
      golsFora: palpite.golsFora,
      statusEnvio: STATUS_ENVIO_PALPITE_CONFIRMADO,
    });

    palpitesConfirmados.push(palpiteConfirmado);
  }

  return palpitesConfirmados;
}
