import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { getTeamLogo } from "../assets/teamLogos";
import { jogoTemBrasil } from "../utils/jogos";
import { isPalpiteBloqueado } from "../utils/date";
import { isPalpiteConfirmado } from "../utils/palpites";

// Renderiza as informações de uma partida.
export default function GameCard({
  game,
  isFavorito,
  isPalpitesDisponiveis,
  isSalvandoPalpite,
  onAlternarFavorito,
  onAlterarPalpite,
  onSalvarPalpite,
  palpite = {},
}) {
  // Identifica se a partida envolve a seleção brasileira.
  const isBrasilGame = jogoTemBrasil(game);
  const isBloqueado = isPalpiteBloqueado(game);
  const isConfirmado = isPalpiteConfirmado(palpite.status_envio);
  const isCampoPalpiteEditavel = !isSalvandoPalpite && !isBloqueado;
  const isPalpiteSalvavel = isPalpitesDisponiveis && !isBloqueado;
  const isSalvarDesabilitado =
    !isPalpiteSalvavel ||
    isSalvandoPalpite ||
    palpite.gols_casa === "" ||
    palpite.gols_casa === undefined ||
    palpite.gols_fora === "" ||
    palpite.gols_fora === undefined;

  return (
    // Aplica destaque visual em jogos do Brasil.
    <View
      style={[
        styles.jogo,
        isBrasilGame && styles.jogoBrasil,
        isFavorito && styles.jogoFavorito,
      ]}
    >
      {/* Mostra grupo/fase e confronto. */}
      <View style={styles.cabecalho}>
        <Text style={styles.grupo}>
          {game.grupo ? `GRUPO ${game.grupo}: ` : game.fase} {game.confronto}
        </Text>

        <Pressable
          onPress={() => onAlternarFavorito(game.id)}
          style={[
            styles.botaoFavorito,
            isFavorito && styles.botaoFavoritoAtivo,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorito
              ? "Remover jogo dos favoritos"
              : "Adicionar jogo aos favoritos"
          }
        >
          <Text
            style={[
              styles.botaoFavoritoTexto,
              isFavorito && styles.botaoFavoritoTextoAtivo,
            ]}
          >
            {isFavorito ? "FAV" : "+ FAV"}
          </Text>
        </Pressable>
      </View>

      {/* Linha principal com mandante, horário e visitante. */}
      <View style={styles.linhaPrincipal}>
        <View style={styles.time}>
          <TeamLogo sigla={game.sigla_casa} />
          <Text style={styles.sigla}>{game.sigla_casa}</Text>
        </View>

        <View style={styles.horario}>
          <Text style={styles.hora}>{game.hora_brasilia}</Text>
          <Text style={styles.subTitulo}>VS</Text>
        </View>

        <View style={styles.time}>
          <Text style={styles.sigla}>{game.sigla_fora}</Text>
          <TeamLogo sigla={game.sigla_fora} />
        </View>
      </View>

      {/* Informações do estádio e local da partida. */}
      <View style={styles.local}>
        <Text style={styles.subTitulo}>{game.estadio}</Text>
        <Text style={styles.subTitulo}>
          {game.cidade} - {game.pais}
        </Text>
      </View>

      <View style={styles.palpiteContainer}>
        <View style={styles.palpiteCabecalho}>
          <Text style={styles.palpiteTitulo}>PALPITE</Text>
          {isConfirmado && (
            <Text style={styles.palpiteConfirmado}>CONFIRMADO</Text>
          )}
        </View>

        <View style={styles.palpiteLinha}>
          <TextInput
            value={palpite.gols_casa ?? ""}
            onChangeText={(valor) =>
              onAlterarPalpite(game.id, "gols_casa", valor)
            }
            editable={isCampoPalpiteEditavel}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#5f7488"
            style={[
              styles.palpiteInput,
              !isCampoPalpiteEditavel && styles.palpiteInputDesabilitado,
            ]}
            accessibilityLabel={`Gols ${game.sigla_casa}`}
          />

          <Text style={styles.palpiteSeparador}>x</Text>

          <TextInput
            value={palpite.gols_fora ?? ""}
            onChangeText={(valor) =>
              onAlterarPalpite(game.id, "gols_fora", valor)
            }
            editable={isCampoPalpiteEditavel}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#5f7488"
            style={[
              styles.palpiteInput,
              !isCampoPalpiteEditavel && styles.palpiteInputDesabilitado,
            ]}
            accessibilityLabel={`Gols ${game.sigla_fora}`}
          />

          <Pressable
            onPress={() => onSalvarPalpite(game)}
            disabled={isSalvarDesabilitado}
            style={[
              styles.botaoSalvarPalpite,
              isSalvarDesabilitado && styles.botaoSalvarPalpiteDesabilitado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Salvar palpite do jogo"
          >
            <Text style={styles.botaoSalvarPalpiteTexto}>
              {isSalvandoPalpite ? "..." : "SALVAR"}
            </Text>
          </Pressable>
        </View>

        {!isPalpitesDisponiveis && (
          <Text style={styles.palpiteStatus}>
            Salvamento disponível somente para usuários autenticados com Supabase configurado.
          </Text>
        )}

        {isPalpitesDisponiveis && isBloqueado && (
          <Text style={styles.palpiteStatus}>
            Edição bloqueada após o início do jogo.
          </Text>
        )}
      </View>
    </View>
  );
}

// Exibe a bandeira da seleção ou um marcador quando não houver logo.
function TeamLogo({ sigla }) {
  // Busca a imagem da seleção pelo código de sigla.
  const logo = getTeamLogo(sigla);

  if (!logo) {
    // Fallback para fases eliminatórias ainda sem seleção definida.
    return (
      <View style={styles.bandeiraPlaceholder}>
        <Text style={styles.placeholderText}>{sigla.slice(0, 2)}</Text>
      </View>
    );
  }

  return <Image style={styles.bandeira} source={logo} />;
}

// Estilos do card de jogo, bandeiras e textos.
const styles = StyleSheet.create({
  jogo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1e2d3d",
    paddingBottom: 15,
    paddingHorizontal: 8,
  },
  jogoBrasil: {
    backgroundColor: "rgba(242, 204, 47, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#f2cc2f",
    borderRadius: 8,
    paddingTop: 10,
  },
  jogoFavorito: {
    backgroundColor: "rgba(242, 204, 47, 0.14)",
    borderRightWidth: 4,
    borderRightColor: "#f2cc2f",
    borderRadius: 8,
    paddingTop: 10,
  },
  cabecalho: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  grupo: {
    color: "#8fa3b8",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  botaoFavorito: {
    minWidth: 58,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  botaoFavoritoAtivo: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  botaoFavoritoTexto: {
    color: "#8fa3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  botaoFavoritoTextoAtivo: {
    color: "#04120a",
  },
  linhaPrincipal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bandeira: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bandeiraPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1e2d3d",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#8fa3b8",
    fontSize: 9,
    fontWeight: "700",
  },
  sigla: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  horario: {
    alignItems: "center",
  },
  hora: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  local: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  subTitulo: {
    color: "#8fa3b8",
    fontSize: 12,
    flexShrink: 1,
  },
  palpiteContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1e2d3d",
    paddingTop: 12,
  },
  palpiteTitulo: {
    color: "#f2cc2f",
    fontSize: 11,
    fontWeight: "700",
  },
  palpiteCabecalho: {
    minHeight: 18,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  palpiteConfirmado: {
    color: "#32d16d",
    fontSize: 10,
    fontWeight: "700",
  },
  palpiteLinha: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  palpiteInput: {
    width: 42,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#07131f",
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  palpiteInputDesabilitado: {
    opacity: 0.55,
  },
  palpiteSeparador: {
    color: "#8fa3b8",
    fontSize: 14,
    fontWeight: "700",
  },
  botaoSalvarPalpite: {
    height: 36,
    minWidth: 74,
    borderRadius: 8,
    backgroundColor: "#32d16d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  botaoSalvarPalpiteDesabilitado: {
    opacity: 0.45,
  },
  botaoSalvarPalpiteTexto: {
    color: "#04120a",
    fontSize: 11,
    fontWeight: "700",
  },
  palpiteStatus: {
    color: "#8fa3b8",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
});
