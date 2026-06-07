// Agrupa a lista de jogos pela data de Brasília.
export function agruparJogosPorData(jogos) {
  const jogosPorData = jogos.reduce((acc, jogo) => {
    const data = jogo.data_brasilia;

    // Cria o grupo do dia quando ele ainda não existe.
    if (!acc[data]) {
      acc[data] = [];
    }

    // Adiciona o jogo ao grupo da data correspondente.
    acc[data].push(jogo);

    return acc;
  }, {});

  // Transforma o objeto agrupado em lista e ordena os jogos por horário.
  return Object.keys(jogosPorData).map((data) => ({
    data,
    jogos: ordenarJogosPorHorario(jogosPorData[data]),
  }));
}

// Ordena jogos em ordem crescente pelo horário de Brasília.
export function ordenarJogosPorHorario(jogos) {
  return [...jogos].sort((jogoA, jogoB) =>
    jogoA.hora_brasilia.localeCompare(jogoB.hora_brasilia)
  );
}

// Verifica se a partida tem Brasil como mandante ou visitante.
export function jogoTemBrasil(jogo) {
  return jogo.sigla_casa === "BRA" || jogo.sigla_fora === "BRA";
}
