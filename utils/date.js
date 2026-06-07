// Converte data no formato YYYY-MM-DD para DD/MM.
export function formatarDataBrasil(data) {
  const [ano, mes, dia] = data.split("-");

  // Mantém o valor original caso a data venha em formato inesperado.
  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}`;
}

// Retorna a data local do sistema no formato YYYY-MM-DD.
export function obterDataAtualLocal() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

// Compara uma data do calendário com a data atual do sistema.
export function isDataAtual(data) {
  return data === obterDataAtualLocal();
}

// Interpreta data/hora de Brasília com offset fixo BRT.
export function obterDataHoraBrasilia(data, hora) {
  if (!data || !hora) {
    return null;
  }

  const [horaParte, minutoParte] = String(hora).split(":");
  const horaNormalizada = `${horaParte?.padStart(2, "0")}:${(
    minutoParte || "00"
  ).padStart(2, "0")}`;
  const dataHora = new Date(`${data}T${horaNormalizada}:00-03:00`);

  if (Number.isNaN(dataHora.getTime())) {
    return null;
  }

  return dataHora;
}

// Bloqueia palpites quando o horário de início do jogo já chegou.
export function isPalpiteBloqueado(jogo, agora = new Date()) {
  const dataHoraJogo = obterDataHoraBrasilia(
    jogo.data_brasilia,
    jogo.hora_brasilia
  );

  if (!dataHoraJogo) {
    return true;
  }

  return agora >= dataHoraJogo;
}
