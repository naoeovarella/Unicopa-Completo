import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DiaCard from "./components/DiaCard";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import { agruparJogosPorData } from "./utils/jogos";
import { importarJogosDoJson, listarJogosDoJson } from "./utils/importarJogos";
import {
  atualizarFavoritoDoJogo,
  listarJogosDoBanco,
} from "./utils/jogosBanco";
import {
  confirmarPalpitesDoUsuario,
  listarPalpitesDoUsuario,
  salvarPalpiteDoJogo,
} from "./utils/palpitesBanco";
import {
  isPalpiteConfirmado,
  STATUS_ENVIO_PALPITE_CONFIRMADO,
  STATUS_ENVIO_PALPITE_RASCUNHO,
} from "./utils/palpites";
import { getSupabaseClient, isSupabaseConfigurado } from "./utils/supabase";
import { isPalpiteBloqueado } from "./utils/date";

// O Supabase é inicializado em utils/supabase.js.
// Use getSupabaseClient() para acessar o cliente e fazer consultas ou autenticação.

export default function App() {
  const [telaPrincipal, setTelaPrincipal] = useState("calendario");
  const [grupoSelecionado, setGrupoSelecionado] = useState("Todos");
  const [filtroMeusPalpites, setFiltroMeusPalpites] = useState("todos");
  const [jogos, setJogos] = useState([]);
  const [isCarregandoJogos, setIsCarregandoJogos] = useState(true);
  const [isCarregandoPalpites, setIsCarregandoPalpites] = useState(false);
  const [isImportandoJogos, setIsImportandoJogos] = useState(false);
  const [erroJogos, setErroJogos] = useState("");
  const [isUsandoJogosLocais, setIsUsandoJogosLocais] = useState(false);
  const [session, setSession] = useState(null);
  const [isVerificandoSessao, setIsVerificandoSessao] = useState(false);
  const [isEntrando, setIsEntrando] = useState(false);
  const [erroLogin, setErroLogin] = useState("");
  const [telaAutenticacao, setTelaAutenticacao] = useState("login");
  const [isCadastrando, setIsCadastrando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState("");
  const [mensagemCadastro, setMensagemCadastro] = useState("");
  const [palpitesPorJogo, setPalpitesPorJogo] = useState({});
  const [palpitesSalvandoPorJogo, setPalpitesSalvandoPorJogo] = useState({});
  const [isRevisaoPalpitesVisivel, setIsRevisaoPalpitesVisivel] =
    useState(false);
  const [isConfirmandoPalpites, setIsConfirmandoPalpites] = useState(false);
  const filtrosScrollRef = useRef(null);
  const [filtroScrollX, setFiltroScrollX] = useState(0);
  const [filtrosLargura, setFiltrosLargura] = useState(0);
  const [filtrosConteudoLargura, setFiltrosConteudoLargura] = useState(0);

  const maxFiltroScrollX = Math.max(0, filtrosConteudoLargura - filtrosLargura);
  const podeRolarFiltrosParaEsquerda = filtroScrollX > 0;
  const podeRolarFiltrosParaDireita = filtroScrollX < maxFiltroScrollX - 1;

  const normalizarJogos = (jogosParaNormalizar) =>
    jogosParaNormalizar.map((jogo) => ({
      ...jogo,
      favorito: Boolean(jogo.favorito),
    }));

  const normalizarPalpites = (palpitesParaNormalizar) =>
    palpitesParaNormalizar.reduce((acc, palpite) => {
      const jogoId = palpite.id_jogo ?? palpite.jogo_id;
      const golsCasa = palpite.placar_time_casa ?? palpite.gols_casa ?? "";
      const golsFora = palpite.placar_time_fora ?? palpite.gols_fora ?? "";

      acc[jogoId] = {
        id: palpite.id,
        gols_casa: String(golsCasa),
        gols_fora: String(golsFora),
        situacao: palpite.situacao,
        status_envio:
          palpite.status_envio || STATUS_ENVIO_PALPITE_RASCUNHO,
      };

      return acc;
    }, {});

  const carregarPalpitesDoUsuario = async () => {
    if (!session?.user || !isSupabaseConfigurado()) {
      setPalpitesPorJogo({});
      return;
    }

    setIsCarregandoPalpites(true);

    try {
      const palpitesDoUsuario = await listarPalpitesDoUsuario(session.user);

      setPalpitesPorJogo(normalizarPalpites(palpitesDoUsuario));
    } catch (error) {
      Alert.alert("Erro ao carregar palpites", traduzirErroPalpite(error));
    } finally {
      setIsCarregandoPalpites(false);
    }
  };

  const traduzirErroLogin = (error) => {
    const mensagem = error?.message || "";

    if (mensagem.includes("Invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (mensagem.includes("Email not confirmed")) {
      return "Sua conta ainda está aguardando confirmação de e-mail no Supabase.";
    }

    if (mensagem.includes("Configuração do Supabase ausente")) {
      return mensagem;
    }

    return "Não foi possível entrar. Confira seus dados e tente novamente.";
  };

  const traduzirErroCadastro = (error) => {
    const mensagem = error?.message || "";

    if (mensagem.includes("User already registered")) {
      return "Este e-mail já está cadastrado. Volte ao login para entrar.";
    }

    if (
      mensagem.includes("Password should be at least") ||
      mensagem.toLowerCase().includes("weak password") ||
      error?.code === "weak_password"
    ) {
      return "A senha deve ter pelo menos 6 caracteres.";
    }

    if (
      mensagem.includes("Signup is disabled") ||
      error?.code === "signup_disabled"
    ) {
      return "O cadastro de novos usuários está desabilitado no Supabase.";
    }

    if (
      mensagem.toLowerCase().includes("invalid email") ||
      error?.code === "email_address_invalid"
    ) {
      return "Informe um e-mail válido para criar a conta.";
    }

    if (
      mensagem.toLowerCase().includes("database error") ||
      mensagem.toLowerCase().includes("saving new user")
    ) {
      return "O cadastro foi recusado por uma regra do banco no Supabase. Verifique os gatilhos (triggers) ou as políticas da tabela de perfil vinculada ao usuário.";
    }

    if (mensagem.includes("Configuração do Supabase ausente")) {
      return mensagem;
    }

    return mensagem
      ? `Não foi possível criar sua conta: ${mensagem}`
      : "Não foi possível criar sua conta. Confira os dados e tente novamente.";
  };

  useEffect(() => {
    setSession(null);
    setTelaAutenticacao("login");
    setIsVerificandoSessao(false);
  }, []);

  const carregarJogos = async () => {
    setIsCarregandoJogos(true);
    setErroJogos("");

    try {
      if (!isSupabaseConfigurado()) {
        setJogos(listarJogosDoJson());
        setIsUsandoJogosLocais(true);
        return;
      }

      try {
        const jogosDoBanco = await listarJogosDoBanco();

        setJogos(normalizarJogos(jogosDoBanco));
        setIsUsandoJogosLocais(false);

        try {
          const palpitesDoUsuario = await listarPalpitesDoUsuario(
            session.user
          );

          setPalpitesPorJogo(normalizarPalpites(palpitesDoUsuario));
        } catch (errorPalpites) {
          console.warn(
            "Não foi possível carregar palpites do Supabase.",
            errorPalpites
          );
          setPalpitesPorJogo({});
        }
      } catch (errorBanco) {
        console.warn(
          "Não foi possível carregar jogos do Supabase. Usando JSON local.",
          errorBanco
        );
        setJogos(listarJogosDoJson());
        setPalpitesPorJogo({});
        setIsUsandoJogosLocais(true);
      }
    } catch (error) {
      const mensagem =
        error?.message || "Não foi possível carregar os jogos.";

      setErroJogos(mensagem);
      Alert.alert("Erro ao carregar jogos", mensagem);
    } finally {
      setIsCarregandoJogos(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setIsCarregandoJogos(false);
      return;
    }

    carregarJogos();
  }, [session]);

  useEffect(() => {
    if (session && telaPrincipal === "palpites") {
      carregarPalpitesDoUsuario();
    }
  }, [session, telaPrincipal]);

  const grupos = useMemo(
    () =>
      [
        "Todos",
        ...new Set(
          jogos
            .map((jogo) => jogo.grupo)
            .filter(Boolean)
            .sort((grupoA, grupoB) => grupoA.localeCompare(grupoB))
        ),
      ],
    [jogos]
  );

  const jogosFiltrados = useMemo(() => {
    if (grupoSelecionado === "Todos") {
      return jogos;
    }

    return jogos.filter((jogo) => jogo.grupo === grupoSelecionado);
  }, [grupoSelecionado, jogos]);

  const jogosPorDia = useMemo(
    () => agruparJogosPorData(jogosFiltrados),
    [jogosFiltrados]
  );

  const palpitesPreenchidos = useMemo(
    () =>
      jogos
        .map((jogo) => {
          const palpite = palpitesPorJogo[jogo.id] || {};
          const golsCasa = Number.parseInt(palpite.gols_casa, 10);
          const golsFora = Number.parseInt(palpite.gols_fora, 10);

          if (Number.isNaN(golsCasa) || Number.isNaN(golsFora)) {
            return null;
          }

          return {
            jogo,
            jogoId: jogo.id,
            golsCasa,
            golsFora,
            status_envio:
              palpite.status_envio || STATUS_ENVIO_PALPITE_RASCUNHO,
          };
        })
        .filter(Boolean),
    [jogos, palpitesPorJogo]
  );

  const quantidadePalpitesConfirmados = useMemo(
    () =>
      palpitesPreenchidos.filter(
        (palpite) => isPalpiteConfirmado(palpite.status_envio)
      ).length,
    [palpitesPreenchidos]
  );

  const meusPalpitesFiltrados = useMemo(() => {
    if (filtroMeusPalpites === "confirmados") {
      return palpitesPreenchidos.filter((palpite) =>
        isPalpiteConfirmado(palpite.status_envio)
      );
    }

    if (filtroMeusPalpites === "pendentes") {
      return palpitesPreenchidos.filter(
        (palpite) => !isPalpiteConfirmado(palpite.status_envio)
      );
    }

    return palpitesPreenchidos;
  }, [filtroMeusPalpites, palpitesPreenchidos]);

  const meusPalpitesPorData = useMemo(() => {
    const palpitesPorData = meusPalpitesFiltrados.reduce((acc, palpite) => {
      const data = palpite.jogo.data_brasilia || "Sem data";

      if (!acc[data]) {
        acc[data] = [];
      }

      acc[data].push(palpite);
      return acc;
    }, {});

    return Object.keys(palpitesPorData)
      .sort((dataA, dataB) => dataA.localeCompare(dataB))
      .map((data) => ({
        data,
        palpites: palpitesPorData[data].sort((palpiteA, palpiteB) =>
          palpiteA.jogo.hora_brasilia.localeCompare(
            palpiteB.jogo.hora_brasilia
          )
        ),
      }));
  }, [meusPalpitesFiltrados]);

  const rolarFiltros = (direcao) => {
    const proximoScrollX = Math.min(
      Math.max(filtroScrollX + direcao * 140, 0),
      maxFiltroScrollX
    );

    filtrosScrollRef.current?.scrollTo({
      x: proximoScrollX,
      animated: true,
    });
  };

  const alternarFavorito = async (jogoId) => {
    const jogoAtual = jogos.find((jogo) => jogo.id === jogoId);

    if (!jogoAtual) {
      return;
    }

    const novoFavorito = !Boolean(jogoAtual.favorito);

    setJogos((jogosAtuais) =>
      jogosAtuais.map((jogo) =>
        jogo.id === jogoId ? { ...jogo, favorito: novoFavorito } : jogo
      )
    );

    if (isUsandoJogosLocais || !isSupabaseConfigurado()) {
      return;
    }

    try {
      await atualizarFavoritoDoJogo(jogoId, novoFavorito);
    } catch (error) {
      setJogos((jogosAtuais) =>
        jogosAtuais.map((jogo) =>
          jogo.id === jogoId ? { ...jogo, favorito: jogoAtual.favorito } : jogo
        )
      );

      Alert.alert(
        "Erro ao atualizar favorito",
        error?.message || "Não foi possível salvar o favorito no banco."
      );
    }
  };

  const importarJogos = async () => {
    setIsImportandoJogos(true);

    try {
      if (!isSupabaseConfigurado()) {
        const jogosDoJson = listarJogosDoJson();

        setJogos(jogosDoJson);
        setIsUsandoJogosLocais(true);

        Alert.alert(
          "Jogos carregados",
          `${jogosDoJson.length} jogos foram carregados do JSON local. Configure o Supabase para importar para o banco.`
        );
        return;
      }

      const resultado = await importarJogosDoJson();

      Alert.alert(
        "Importação concluída",
        `${resultado.total} jogos foram processados na tabela ${resultado.tabela} usando ${resultado.campoUnico} para evitar duplicidade.`
      );

      await carregarJogos();
    } catch (error) {
      try {
        const jogosDoJson = listarJogosDoJson();

        setJogos(jogosDoJson);
        setIsUsandoJogosLocais(true);

        Alert.alert(
          "Jogos carregados do JSON",
          `${jogosDoJson.length} jogos foram carregados localmente. Não foi possível importar para o Supabase: ${
            error?.message || "erro desconhecido"
          }`
        );
      } catch (errorJson) {
        Alert.alert(
          "Erro na importação",
          errorJson?.message || "Não foi possível importar os jogos do JSON."
        );
      }
    } finally {
      setIsImportandoJogos(false);
    }
  };

  const alterarPalpite = (jogoId, campo, valor) => {
    const valorNumerico = valor.replace(/\D/g, "").slice(0, 2);

    setPalpitesPorJogo((palpitesAtuais) => ({
      ...palpitesAtuais,
      [jogoId]: {
        gols_casa: "",
        gols_fora: "",
        ...palpitesAtuais[jogoId],
        [campo]: valorNumerico,
        status_envio: STATUS_ENVIO_PALPITE_RASCUNHO,
      },
    }));
  };

  const traduzirErroPalpite = (error) => {
    const mensagem = error?.message || "";
    const mensagemMinuscula = mensagem.toLowerCase();

    if (
      mensagemMinuscula.includes("duplicate") ||
      mensagemMinuscula.includes("unique")
    ) {
      return "Existe mais de um palpite para este usuário e este jogo. Verifique a restrição única id_usuario+id_jogo no Supabase.";
    }

    if (
      mensagemMinuscula.includes("row-level security") ||
      mensagemMinuscula.includes("permission denied")
    ) {
      return "Sem permissão para salvar o palpite. Verifique as políticas RLS da tabela palpites para usuários autenticados.";
    }

    if (mensagemMinuscula.includes("column")) {
      return `A estrutura da tabela palpites está diferente do esperado: ${mensagem}`;
    }

    return mensagem || "Não foi possível salvar o palpite.";
  };

  const salvarPalpite = async (jogo) => {
    if (!session?.user?.id) {
      Alert.alert("Login necessário", "Entre novamente para salvar palpites.");
      return;
    }

    if (!isSupabaseConfigurado()) {
      Alert.alert(
        "Palpite indisponível",
        "Os palpites só podem ser salvos com o Supabase configurado."
      );
      return;
    }

    if (isPalpiteBloqueado(jogo)) {
      Alert.alert(
        "Palpite bloqueado",
        "Não é possível editar o palpite depois do horário do jogo."
      );
      return;
    }

    const palpite = palpitesPorJogo[jogo.id] || {};
    const golsCasa = Number.parseInt(palpite.gols_casa, 10);
    const golsFora = Number.parseInt(palpite.gols_fora, 10);
    const statusEnvio =
      palpite.status_envio || STATUS_ENVIO_PALPITE_RASCUNHO;

    if (Number.isNaN(golsCasa) || Number.isNaN(golsFora)) {
      Alert.alert(
        "Palpite incompleto",
        "Informe os gols dos dois times antes de salvar."
      );
      return;
    }

    setPalpitesSalvandoPorJogo((palpitesAtuais) => ({
      ...palpitesAtuais,
      [jogo.id]: true,
    }));

    try {
      const palpiteSalvo = await salvarPalpiteDoJogo({
        authUser: session.user,
        jogoId: jogo.id,
        golsCasa,
        golsFora,
        statusEnvio,
      });

      setPalpitesPorJogo((palpitesAtuais) => ({
        ...palpitesAtuais,
        [jogo.id]: {
          id: palpiteSalvo.id,
          gols_casa: String(
            palpiteSalvo.placar_time_casa ?? palpiteSalvo.gols_casa
          ),
          gols_fora: String(
            palpiteSalvo.placar_time_fora ?? palpiteSalvo.gols_fora
          ),
          situacao: palpiteSalvo.situacao,
          status_envio:
            palpiteSalvo.status_envio || STATUS_ENVIO_PALPITE_RASCUNHO,
        },
      }));

      Alert.alert("Palpite salvo", "Seu palpite foi registrado.");
    } catch (error) {
      console.error("Erro ao salvar palpite:", error);
      const mensagemErro = traduzirErroPalpite(error);
      const detalhes = error?.details || error?.hint || error?.message;

      Alert.alert(
        "Erro ao salvar palpite",
        detalhes ? `${mensagemErro}\n${detalhes}`.trim() : mensagemErro
      );
    } finally {
      setPalpitesSalvandoPorJogo((palpitesAtuais) => ({
        ...palpitesAtuais,
        [jogo.id]: false,
      }));
    }
  };

  const abrirRevisaoPalpites = () => {
    if (!session?.user?.id) {
      Alert.alert("Login necessário", "Entre novamente para confirmar palpites.");
      return;
    }

    if (!isSupabaseConfigurado()) {
      Alert.alert(
        "Confirmação indisponível",
        "Os palpites só podem ser confirmados com o Supabase configurado."
      );
      return;
    }

    if (palpitesPreenchidos.length === 0) {
      Alert.alert(
        "Nenhum palpite preenchido",
        "Preencha ao menos um placar antes de revisar."
      );
      return;
    }

    setIsRevisaoPalpitesVisivel(true);
  };

  const confirmarEnvioPalpites = async () => {
    setIsConfirmandoPalpites(true);

    try {
      await confirmarPalpitesDoUsuario(
        session.user,
        palpitesPreenchidos
      );

      setPalpitesPorJogo((palpitesAtuais) => {
        const proximosPalpites = { ...palpitesAtuais };

        palpitesPreenchidos.forEach((palpite) => {
          proximosPalpites[palpite.jogoId] = {
            ...proximosPalpites[palpite.jogoId],
            gols_casa: String(palpite.golsCasa),
            gols_fora: String(palpite.golsFora),
            status_envio: STATUS_ENVIO_PALPITE_CONFIRMADO,
          };
        });

        return proximosPalpites;
      });

      setIsRevisaoPalpitesVisivel(false);
      Alert.alert("Palpites confirmados", "Seus palpites foram enviados.");
    } catch (error) {
      Alert.alert("Erro ao confirmar palpites", traduzirErroPalpite(error));
    } finally {
      setIsConfirmandoPalpites(false);
    }
  };

  const entrar = async (email, senha) => {
    setIsEntrando(true);
    setErroLogin("");

    try {
      if (!isSupabaseConfigurado()) {
        throw new Error(
          "Configuração do Supabase ausente. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local e reinicie o Expo."
        );
      }

      const { data, error } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        setErroLogin(traduzirErroLogin(error));
        return;
      }

      if (!data.session) {
        setErroLogin("Login realizado, mas nenhuma sessão foi iniciada.");
        return;
      }

      setSession(data.session);
    } catch (error) {
      setErroLogin(traduzirErroLogin(error));
    } finally {
      setIsEntrando(false);
    }
  };

  const cadastrar = async ({ nome, email, senha }) => {
    setIsCadastrando(true);
    setErroCadastro("");
    setMensagemCadastro("");

    try {
      if (!isSupabaseConfigurado()) {
        throw new Error(
          "Configuração do Supabase ausente. Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no arquivo .env.local e reinicie o Expo."
        );
      }

      const { data, error } = await getSupabaseClient().auth.signUp({
        email,
        password: senha,
        options: {
          data: nome ? { nome, name: nome, full_name: nome } : {},
        },
      });

      if (error) {
        console.warn("Erro ao cadastrar usuário no Supabase:", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
        setErroCadastro(traduzirErroCadastro(error));
        return;
      }

      if (data.session) {
        setSession(data.session);
        return;
      }

      setMensagemCadastro(
        "Cadastro realizado, mas o Supabase não iniciou uma sessão automaticamente. Verifique se a confirmação de e-mail está desabilitada e volte ao login."
      );
    } catch (error) {
      setErroCadastro(traduzirErroCadastro(error));
    } finally {
      setIsCadastrando(false);
    }
  };

  if (isVerificandoSessao) {
    return (
      <ImageBackground
        style={styles.container}
        source={require("./assets/bg-overlay.png")}
      >
        <Image style={styles.logo} source={require("./assets/unicopa.png")} />
        <Text style={styles.statusLista}>VERIFICANDO LOGIN...</Text>
      </ImageBackground>
    );
  }

  if (!session) {
    if (telaAutenticacao === "cadastro") {
      return (
        <RegisterScreen
          erroCadastro={erroCadastro}
          isCadastrando={isCadastrando}
          mensagemCadastro={mensagemCadastro}
          onCadastrar={cadastrar}
          onVoltarLogin={() => {
            setTelaAutenticacao("login");
            setErroCadastro("");
            setMensagemCadastro("");
          }}
        />
      );
    }

    return (
      <LoginScreen
        erroLogin={erroLogin}
        isEntrando={isEntrando}
        onAbrirCadastro={() => {
          setTelaAutenticacao("cadastro");
          setErroLogin("");
        }}
        onEntrar={entrar}
      />
    );
  }

  return (
    <ImageBackground
      style={styles.container}
      source={require("./assets/bg-overlay.png")}
    >
      <Image style={styles.logo} source={require("./assets/unicopa.png")} />

      <Text style={styles.title}>
        {telaPrincipal === "calendario" ? "CALENDÁRIO" : "MEUS PALPITES"}
      </Text>

      <View style={styles.abasContainer}>
        <Pressable
          onPress={() => setTelaPrincipal("calendario")}
          style={[
            styles.abaPrincipal,
            telaPrincipal === "calendario" && styles.abaPrincipalAtiva,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Abrir calendário"
        >
          <Text
            style={[
              styles.abaPrincipalTexto,
              telaPrincipal === "calendario" && styles.abaPrincipalTextoAtivo,
            ]}
          >
            CALENDÁRIO
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setTelaPrincipal("palpites")}
          style={[
            styles.abaPrincipal,
            telaPrincipal === "palpites" && styles.abaPrincipalAtiva,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Abrir meus palpites"
        >
          <Text
            style={[
              styles.abaPrincipalTexto,
              telaPrincipal === "palpites" && styles.abaPrincipalTextoAtivo,
            ]}
          >
            MEUS PALPITES
          </Text>
        </Pressable>
      </View>

      {telaPrincipal === "calendario" ? (
        <>
      <View style={styles.filtrosContainer}>
        <Pressable
          onPress={() => rolarFiltros(-1)}
          disabled={!podeRolarFiltrosParaEsquerda}
          style={[
            styles.botaoRolagemFiltro,
            !podeRolarFiltrosParaEsquerda &&
              styles.botaoRolagemFiltroDesabilitado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Rolar filtros para a esquerda"
        >
          <Text style={styles.botaoRolagemFiltroTexto}>{"<"}</Text>
        </Pressable>

        <ScrollView
          ref={filtrosScrollRef}
          horizontal
          style={styles.filtrosScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
          onLayout={(event) => setFiltrosLargura(event.nativeEvent.layout.width)}
          onContentSizeChange={(largura) => setFiltrosConteudoLargura(largura)}
          onScroll={(event) =>
            setFiltroScrollX(event.nativeEvent.contentOffset.x)
          }
          scrollEventThrottle={16}
        >
          {grupos.map((grupo) => {
            const isSelecionado = grupo === grupoSelecionado;

            return (
              <Pressable
                key={grupo}
                onPress={() => setGrupoSelecionado(grupo)}
                style={[
                  styles.filtroGrupo,
                  isSelecionado && styles.filtroGrupoSelecionado,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  grupo === "Todos"
                    ? "Exibir todos os grupos"
                    : `Filtrar jogos do grupo ${grupo}`
                }
              >
                <Text
                  style={[
                    styles.filtroGrupoTexto,
                    isSelecionado && styles.filtroGrupoTextoSelecionado,
                  ]}
                >
                  {grupo === "Todos" ? "TODOS" : `GRUPO ${grupo}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => rolarFiltros(1)}
          disabled={!podeRolarFiltrosParaDireita}
          style={[
            styles.botaoRolagemFiltro,
            !podeRolarFiltrosParaDireita &&
              styles.botaoRolagemFiltroDesabilitado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Rolar filtros para a direita"
        >
          <Text style={styles.botaoRolagemFiltroTexto}>{">"}</Text>
        </Pressable>
      </View>

      <View style={styles.importacaoContainer}>
        <Pressable
          onPress={importarJogos}
          disabled={isImportandoJogos || isCarregandoJogos}
          style={[
            styles.botaoImportar,
            (isImportandoJogos || isCarregandoJogos) &&
              styles.botaoImportarDesabilitado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Importar jogos do JSON para o banco"
        >
          <Text style={styles.botaoImportarTexto}>
            {isImportandoJogos ? "IMPORTANDO..." : "IMPORTAR JOGOS"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.confirmacaoContainer}>
        <Pressable
          onPress={abrirRevisaoPalpites}
          disabled={isConfirmandoPalpites || palpitesPreenchidos.length === 0}
          style={[
            styles.botaoConfirmarPalpites,
            (isConfirmandoPalpites || palpitesPreenchidos.length === 0) &&
              styles.botaoConfirmarPalpitesDesabilitado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Revisar e confirmar palpites"
        >
          <Text style={styles.botaoConfirmarPalpitesTexto}>
            {isConfirmandoPalpites ? "ENVIANDO..." : "REVISAR PALPITES"}
          </Text>
        </Pressable>

        <Text style={styles.resumoPalpites}>
          {palpitesPreenchidos.length} preenchidos ·{" "}
          {quantidadePalpitesConfirmados} confirmados
        </Text>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isRevisaoPalpitesVisivel}
        onRequestClose={() => {
          if (!isConfirmandoPalpites) {
            setIsRevisaoPalpitesVisivel(false);
          }
        }}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalRevisao}>
            <View style={styles.modalCabecalho}>
              <Text style={styles.modalTitulo}>REVISÃO</Text>
              <Pressable
                onPress={() => setIsRevisaoPalpitesVisivel(false)}
                disabled={isConfirmandoPalpites}
                style={[
                  styles.botaoFecharModal,
                  isConfirmandoPalpites && styles.botaoFecharModalDesabilitado,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Fechar revisão de palpites"
              >
                <Text style={styles.botaoFecharModalTexto}>X</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.listaRevisao}
              contentContainerStyle={styles.listaRevisaoConteudo}
              showsVerticalScrollIndicator={false}
            >
              {palpitesPreenchidos.map((palpite) => (
                <View key={palpite.jogoId} style={styles.itemRevisao}>
                  <View style={styles.itemRevisaoTimes}>
                    <Text style={styles.itemRevisaoConfronto}>
                      {palpite.jogo.sigla_casa} x {palpite.jogo.sigla_fora}
                    </Text>
                    <Text style={styles.itemRevisaoDetalhe}>
                      {palpite.jogo.data_brasilia} · {palpite.jogo.hora_brasilia}
                    </Text>
                  </View>

                  <View style={styles.itemRevisaoPlacar}>
                    <Text style={styles.itemRevisaoPlacarTexto}>
                      {palpite.golsCasa} x {palpite.golsFora}
                    </Text>
                    <Text style={styles.itemRevisaoSituacao}>
                      {isPalpiteConfirmado(palpite.status_envio)
                        ? "CONFIRMADO"
                        : "RASCUNHO"}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalAcoes}>
              <Pressable
                onPress={() => setIsRevisaoPalpitesVisivel(false)}
                disabled={isConfirmandoPalpites}
                style={[
                  styles.botaoCancelarRevisao,
                  isConfirmandoPalpites &&
                    styles.botaoCancelarRevisaoDesabilitado,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancelar revisão de palpites"
              >
                <Text style={styles.botaoCancelarRevisaoTexto}>CANCELAR</Text>
              </Pressable>

              <Pressable
                onPress={confirmarEnvioPalpites}
                disabled={isConfirmandoPalpites}
                style={[
                  styles.botaoEnviarPalpites,
                  isConfirmandoPalpites && styles.botaoEnviarPalpitesDesabilitado,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Confirmar envio dos palpites"
              >
                <Text style={styles.botaoEnviarPalpitesTexto}>
                  {isConfirmandoPalpites ? "ENVIANDO..." : "CONFIRMAR"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {isCarregandoJogos && (
        <Text style={styles.statusLista}>CARREGANDO JOGOS...</Text>
      )}

      {!isCarregandoJogos && Boolean(erroJogos) && (
        <Text style={styles.statusLista}>ERRO AO CARREGAR JOGOS</Text>
      )}

      <FlatList
        data={jogosPorDia}
        keyExtractor={(item) => item.data}
        renderItem={({ item }) => (
          <DiaCard
            data={item.data}
            jogos={item.jogos}
            isPalpitesDisponiveis={
              Boolean(session?.user?.id) && isSupabaseConfigurado()
            }
            onAlternarFavorito={alternarFavorito}
            onAlterarPalpite={alterarPalpite}
            onSalvarPalpite={salvarPalpite}
            palpitesPorJogo={palpitesPorJogo}
            palpitesSalvandoPorJogo={palpitesSalvandoPorJogo}
          />
        )}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          !isCarregandoJogos && !erroJogos ? (
            <View style={styles.cardVazio}>
              <Text style={styles.cardVazioTitulo}>Nenhum jogo carregado</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
        </>
      ) : (
        <>
          <View style={styles.filtrosPalpitesContainer}>
            {[
              { valor: "todos", rotulo: "TODOS" },
              { valor: "pendentes", rotulo: "PENDENTES" },
              { valor: "confirmados", rotulo: "CONFIRMADOS" },
            ].map((filtro) => {
              const isSelecionado = filtroMeusPalpites === filtro.valor;

              return (
                <Pressable
                  key={filtro.valor}
                  onPress={() => setFiltroMeusPalpites(filtro.valor)}
                  style={[
                    styles.filtroPalpite,
                    isSelecionado && styles.filtroPalpiteSelecionado,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtrar palpites: ${filtro.rotulo}`}
                >
                  <Text
                    style={[
                      styles.filtroPalpiteTexto,
                      isSelecionado && styles.filtroPalpiteTextoSelecionado,
                    ]}
                  >
                    {filtro.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isCarregandoPalpites && (
            <Text style={styles.statusLista}>CARREGANDO PALPITES...</Text>
          )}

          <FlatList
            data={meusPalpitesPorData}
            keyExtractor={(item) => item.data}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !isCarregandoPalpites ? (
                <View style={styles.cardVazio}>
                  <Text style={styles.cardVazioTitulo}>
                    Você ainda não cadastrou palpites
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <DiaCard
                data={item.data}
                jogos={item.palpites.map((palpite) => palpite.jogo)}
                isPalpitesDisponiveis={
                  Boolean(session?.user?.id) && isSupabaseConfigurado()
                }
                onAlternarFavorito={alternarFavorito}
                onAlterarPalpite={alterarPalpite}
                onSalvarPalpite={salvarPalpite}
                palpitesPorJogo={palpitesPorJogo}
                palpitesSalvandoPorJogo={palpitesSalvandoPorJogo}
              />

            )}
          />
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
  },
  logo: {
    marginTop: 20,
    width: 200,
    height: 50,
    resizeMode: "contain",
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: "white",
  },
  abasContainer: {
    width: 320,
    height: 42,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  abaPrincipal: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  abaPrincipalAtiva: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  abaPrincipalTexto: {
    color: "#8fa3b8",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  abaPrincipalTextoAtivo: {
    color: "#04120a",
  },
  filtrosContainer: {
    width: 320,
    height: 66,
    marginTop: 12,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  botaoRolagemFiltro: {
    width: 32,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f2cc2f",
    backgroundColor: "#102817",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoRolagemFiltroDesabilitado: {
    opacity: 0.35,
  },
  botaoRolagemFiltroTexto: {
    color: "#f2cc2f",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  filtrosScroll: {
    flex: 1,
  },
  filtros: {
    minHeight: 54,
    paddingHorizontal: 2,
    paddingVertical: 8,
    alignItems: "center",
    gap: 8,
  },
  filtroGrupo: {
    height: 38,
    minWidth: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  filtroGrupoSelecionado: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  filtroGrupoTexto: {
    color: "#8fa3b8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
  filtroGrupoTextoSelecionado: {
    color: "#04120a",
  },
  lista: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  statusLista: {
    width: 320,
    marginTop: 20,
    color: "#8fa3b8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  cardVazio: {
    width: 320,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
  },
  cardVazioTitulo: {
    color: "#f2cc2f",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  importacaoContainer: {
    width: 320,
    marginTop: 2,
    marginBottom: 2,
  },
  botaoImportar: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#32d16d",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoImportarDesabilitado: {
    opacity: 0.6,
  },
  botaoImportarTexto: {
    color: "#04120a",
    fontSize: 12,
    fontWeight: "700",
  },
  confirmacaoContainer: {
    width: 320,
    marginTop: 8,
    marginBottom: 2,
  },
  botaoConfirmarPalpites: {
    height: 38,
    borderRadius: 8,
    backgroundColor: "#f2cc2f",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoConfirmarPalpitesDesabilitado: {
    opacity: 0.45,
  },
  botaoConfirmarPalpitesTexto: {
    color: "#04120a",
    fontSize: 12,
    fontWeight: "700",
  },
  resumoPalpites: {
    marginTop: 6,
    color: "#8fa3b8",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  modalFundo: {
    flex: 1,
    backgroundColor: "rgba(4, 11, 19, 0.86)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalRevisao: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "82%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    padding: 14,
  },
  modalCabecalho: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  modalTitulo: {
    color: "#f2cc2f",
    fontSize: 18,
    fontWeight: "700",
  },
  botaoFecharModal: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoFecharModalDesabilitado: {
    opacity: 0.45,
  },
  botaoFecharModalTexto: {
    color: "#8fa3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  listaRevisao: {
    maxHeight: 360,
  },
  listaRevisaoConteudo: {
    gap: 8,
    paddingBottom: 4,
  },
  itemRevisao: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1e2d3d",
    backgroundColor: "#07131f",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemRevisaoTimes: {
    flex: 1,
    minWidth: 0,
  },
  itemRevisaoConfronto: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  itemRevisaoDetalhe: {
    marginTop: 3,
    color: "#8fa3b8",
    fontSize: 11,
    fontWeight: "700",
  },
  itemRevisaoPlacar: {
    minWidth: 86,
    alignItems: "flex-end",
  },
  itemRevisaoPlacarTexto: {
    color: "#f2cc2f",
    fontSize: 16,
    fontWeight: "700",
  },
  itemRevisaoSituacao: {
    marginTop: 3,
    color: "#32d16d",
    fontSize: 9,
    fontWeight: "700",
  },
  modalAcoes: {
    minHeight: 40,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  botaoCancelarRevisao: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoCancelarRevisaoDesabilitado: {
    opacity: 0.45,
  },
  botaoCancelarRevisaoTexto: {
    color: "#8fa3b8",
    fontSize: 12,
    fontWeight: "700",
  },
  botaoEnviarPalpites: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#32d16d",
    alignItems: "center",
    justifyContent: "center",
  },
  botaoEnviarPalpitesDesabilitado: {
    opacity: 0.55,
  },
  botaoEnviarPalpitesTexto: {
    color: "#04120a",
    fontSize: 12,
    fontWeight: "700",
  },
  filtrosPalpitesContainer: {
    width: 320,
    minHeight: 54,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filtroPalpite: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filtroPalpiteSelecionado: {
    backgroundColor: "#f2cc2f",
    borderColor: "#f2cc2f",
  },
  filtroPalpiteTexto: {
    color: "#8fa3b8",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  filtroPalpiteTextoSelecionado: {
    color: "#04120a",
  },
});
