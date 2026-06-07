import dados from "../assets/dados.json";
import { getSupabaseClient } from "./supabase";

const TABELA_JOGOS = "jogos";
const CAMPO_UNICO = "id";

export function listarJogosDoJson() {
  const jogos = dados?.jogos;

  if (!Array.isArray(jogos) || jogos.length === 0) {
    throw new Error("Nenhum jogo encontrado no arquivo JSON.");
  }

  const jogoSemId = jogos.find(
    (jogo) => jogo[CAMPO_UNICO] === undefined || jogo[CAMPO_UNICO] === null
  );

  if (jogoSemId) {
    throw new Error("Todos os jogos precisam ter um ID para evitar duplicidade.");
  }

  const ids = jogos.map((jogo) => jogo[CAMPO_UNICO]);
  const idsUnicos = new Set(ids);

  if (idsUnicos.size !== jogos.length) {
    throw new Error("O JSON contém jogos com IDs duplicados.");
  }

  return jogos.map((jogo) => ({
    ...jogo,
    favorito: Boolean(jogo.favorito),
  }));
}

export async function importarJogosDoJson() {
  const supabase = getSupabaseClient();
  const jogos = listarJogosDoJson();

  const { error } = await supabase.from(TABELA_JOGOS).upsert(jogos, {
    onConflict: CAMPO_UNICO,
    ignoreDuplicates: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    total: jogos.length,
    tabela: TABELA_JOGOS,
    campoUnico: CAMPO_UNICO,
  };
}
