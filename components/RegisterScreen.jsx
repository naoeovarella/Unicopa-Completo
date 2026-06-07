import { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MINIMA = 6;

export default function RegisterScreen({
  erroCadastro,
  isCadastrando,
  mensagemCadastro,
  onCadastrar,
  onVoltarLogin,
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
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
    } else if (senha.length < SENHA_MINIMA) {
      proximosErros.senha = `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;
    }

    if (!confirmarSenha) {
      proximosErros.confirmarSenha = "Confirme a senha.";
    } else if (senha !== confirmarSenha) {
      proximosErros.confirmarSenha = "As senhas precisam ser iguais.";
    }

    setErros(proximosErros);

    return Object.keys(proximosErros).length === 0;
  };

  const cadastrar = () => {
    if (!validarFormulario()) {
      return;
    }

    onCadastrar({
      nome: nome.trim(),
      email: email.trim(),
      senha,
    });
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("../assets/bg-overlay.png")}
    >
      <Image style={styles.logo} source={require("../assets/unicopa.png")} />

      <View style={styles.formulario}>
        <Text style={styles.titulo}>REGISTRAR-SE</Text>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>NOME</Text>
          <TextInput
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            textContentType="name"
            placeholder="Opcional"
            placeholderTextColor="#5f7488"
            style={styles.input}
          />
        </View>

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
            textContentType="newPassword"
            placeholder="Mínimo de 6 caracteres"
            placeholderTextColor="#5f7488"
            style={[styles.input, erros.senha && styles.inputErro]}
          />
          {Boolean(erros.senha) && (
            <Text style={styles.erroCampo}>{erros.senha}</Text>
          )}
        </View>

        <View style={styles.campo}>
          <Text style={styles.rotulo}>CONFIRMAR SENHA</Text>
          <TextInput
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry
            textContentType="newPassword"
            placeholder="Repita a senha"
            placeholderTextColor="#5f7488"
            style={[styles.input, erros.confirmarSenha && styles.inputErro]}
          />
          {Boolean(erros.confirmarSenha) && (
            <Text style={styles.erroCampo}>{erros.confirmarSenha}</Text>
          )}
        </View>

        {Boolean(erroCadastro) && (
          <Text style={styles.erroCadastro}>{erroCadastro}</Text>
        )}
        {Boolean(mensagemCadastro) && (
          <Text style={styles.mensagemCadastro}>{mensagemCadastro}</Text>
        )}

        {!Boolean(mensagemCadastro) && (
          <Pressable
            onPress={cadastrar}
            disabled={isCadastrando}
            style={[
              styles.botaoPrimario,
              isCadastrando && styles.botaoDesabilitado,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Criar nova conta"
          >
            <Text style={styles.botaoPrimarioTexto}>
              {isCadastrando ? "CADASTRANDO..." : "CADASTRAR"}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={onVoltarLogin}
          style={styles.botaoSecundario}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o login"
        >
          <Text style={styles.botaoSecundarioTexto}>VOLTAR AO LOGIN</Text>
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
    marginBottom: 20,
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
    marginBottom: 18,
    textAlign: "center",
  },
  campo: {
    marginBottom: 12,
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
  erroCadastro: {
    color: "#ff9a9a",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  mensagemCadastro: {
    color: "#9ee6b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  botaoPrimario: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#32d16d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  botaoPrimarioTexto: {
    color: "#04120a",
    fontSize: 13,
    fontWeight: "700",
  },
  botaoSecundario: {
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  botaoSecundarioTexto: {
    color: "#f2cc2f",
    fontSize: 12,
    fontWeight: "700",
  },
});
