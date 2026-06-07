import { useState } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({
  erroLogin,
  isEntrando,
  onAbrirCadastro,
  onEntrar,
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});

  const validarFormulario = () => {
    const proximosErros = {};
    const emailTratado = email.trim();

    if (!emailTratado) {
      proximosErros.email = "Informe o e-mail.";
    } else if (!EMAIL_REGEX.test(emailTratado)) {
      proximosErros.email = "Informe um e-mail válido.";
    }

    if (!senha) {
      proximosErros.senha = "Informe a senha.";
    }

    setErros(proximosErros);

    return Object.keys(proximosErros).length === 0;
  };

  const entrar = () => {
    if (!validarFormulario()) {
      return;
    }

    onEntrar(email.trim(), senha);
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/bg-overlay.png")}
    >
      <Image style={styles.logo} source={require("../assets/unicopa.png")} />

      <View style={styles.formulario}>
        <Text style={styles.titulo}>LOGIN</Text>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>E-MAIL</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="seu@email.com"
            placeholderTextColor="#5f7488"
            style={[styles.input, erros.email && styles.inputErro]}
          />
          {Boolean(erros.email) && (
            <Text style={styles.erroCampo}>{erros.email}</Text>
          )}
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>SENHA</Text>
          <TextInput
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            textContentType="password"
            placeholder="Digite sua senha"
            placeholderTextColor="#5f7488"
            style={[styles.input, erros.senha && styles.inputErro]}
          />
          {Boolean(erros.senha) && (
            <Text style={styles.erroCampo}>{erros.senha}</Text>
          )}
        </View>

        {Boolean(erroLogin) && (
          <Text style={styles.erroLogin}>{erroLogin}</Text>
        )}

        <Pressable
          onPress={entrar}
          disabled={isEntrando}
          style={[styles.botaoEntrar, isEntrando && styles.botaoDesabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Entrar no aplicativo"
        >
          <Text style={styles.botaoEntrarTexto}>
            {isEntrando ? "ENTRANDO..." : "ENTRAR"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onAbrirCadastro}
          style={styles.botaoCadastro}
          accessibilityRole="button"
          accessibilityLabel="Abrir tela de cadastro"
        >
          <Text style={styles.botaoCadastroTexto}>CRIAR CONTA</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#040b13",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 56,
    marginBottom: 28,
    resizeMode: "contain",
  },
  formulario: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#0c1b2a",
    padding: 20,
  },
  titulo: {
    color: "#f2cc2f",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  campo: {
    marginBottom: 14,
  },
  rotulo: {
    color: "#8fa3b8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#28415b",
    backgroundColor: "#07131f",
    color: "white",
    fontSize: 15,
    paddingHorizontal: 12,
  },
  inputErro: {
    borderColor: "#ff6b6b",
  },
  erroCampo: {
    color: "#ff9a9a",
    fontSize: 12,
    marginTop: 5,
  },
  erroLogin: {
    color: "#ff9a9a",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: "center",
  },
  botaoEntrar: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#32d16d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoEntrarTexto: {
    color: "#04120a",
    fontSize: 13,
    fontWeight: "700",
  },
  botaoCadastro: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  botaoCadastroTexto: {
    color: "#f2cc2f",
    fontSize: 12,
    fontWeight: "700",
  },
});
