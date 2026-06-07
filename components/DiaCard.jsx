import { StyleSheet, Text, View } from "react-native";
import GameCard from "./GameCard";
import { isDataAtual, formatarDataBrasil } from "../utils/date";

// Renderiza o agrupamento de jogos de um único dia.
export default function DiaCard({
  data,
  jogos,
  isPalpitesDisponiveis,
  onAlternarFavorito,
  onAlterarPalpite,
  onSalvarPalpite,
  palpitesPorJogo,
  palpitesSalvandoPorJogo,
}) {
  // Verifica se a data do card corresponde ao dia atual.
  const isHoje = isDataAtual(data);

  return (
    // Aplica destaque visual quando o card representa o dia atual.
    <View style={[styles.card, isHoje && styles.cardHoje]}>
      {/* Cabeçalho com data formatada e badge opcional de hoje. */}
      <View style={styles.cabecalho}>
        <Text style={[styles.data, isHoje && styles.dataHoje]}>
          {formatarDataBrasil(data)}
        </Text>

        {isHoje && <Text style={styles.badgeHoje}>HOJE</Text>}
      </View>

      {/* Lista todos os jogos do dia. */}
      {jogos.map((jogo) => (
        <GameCard
          key={jogo.id}
          game={jogo}
          isFavorito={Boolean(jogo.favorito)}
          isPalpitesDisponiveis={isPalpitesDisponiveis}
          onAlternarFavorito={onAlternarFavorito}
          onAlterarPalpite={onAlterarPalpite}
          onSalvarPalpite={onSalvarPalpite}
          palpite={palpitesPorJogo[jogo.id]}
          isSalvandoPalpite={Boolean(palpitesSalvandoPorJogo[jogo.id])}
        />
      ))}
    </View>
  );
}

// Estilos do card de dia e do destaque de hoje.
const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    backgroundColor: "#0c1b2a",
    width: 320,
    borderRadius: 12,
    padding: 15,
  },
  cardHoje: {
    backgroundColor: "#102817",
    borderWidth: 1,
    borderColor: "#32d16d",
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  data: {
    color: "#f2cc2f",
    fontSize: 22,
    fontWeight: "bold",
  },
  dataHoje: {
    color: "#32d16d",
  },
  badgeHoje: {
    color: "#04120a",
    backgroundColor: "#32d16d",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
  },
});
