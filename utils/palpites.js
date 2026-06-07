export const STATUS_ENVIO_PALPITE_RASCUNHO = "RASCUNHO";
export const STATUS_ENVIO_PALPITE_CONFIRMADO = "CONFIRMADO";

export function normalizarStatusEnvioPalpite(statusEnvio) {
  return String(statusEnvio || STATUS_ENVIO_PALPITE_RASCUNHO)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isPalpiteConfirmado(statusEnvio) {
  return (
    normalizarStatusEnvioPalpite(statusEnvio) ===
    normalizarStatusEnvioPalpite(STATUS_ENVIO_PALPITE_CONFIRMADO)
  );
}
