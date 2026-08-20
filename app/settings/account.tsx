import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAccountStore } from "@/src/modules/account/store/account.store";
import { AppButton } from "@/src/shared/components/AppButton";
import { AppTextInput } from "@/src/shared/components/AppTextInput";
import { Screen } from "@/src/shared/components/Screen";
import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

export default function AccountScreen() {
  const session = useAccountStore(
    (state) => state.session,
  );
  const busy = useAccountStore(
    (state) => state.busy,
  );
  const hydrate = useAccountStore(
    (state) => state.hydrate,
  );
  const register = useAccountStore(
    (state) => state.register,
  );
  const login = useAccountStore(
    (state) => state.login,
  );
  const logout = useAccountStore(
    (state) => state.logout,
  );

  const [mode, setMode] = useState<
    "login" | "register"
  >("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [emailError, setEmailError] = useState<
    string | undefined
  >();
  const [passwordError, setPasswordError] =
    useState<string | undefined>();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  function validate(): boolean {
    let valid = true;
    setEmailError(undefined);
    setPasswordError(undefined);

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setEmailError("Introduce un email válido.");
      valid = false;
    }

    if (password.length < 6) {
      setPasswordError(
        "La contraseña debe tener al menos 6 caracteres.",
      );
      valid = false;
    }

    if (
      mode === "register" &&
      password !== confirmPassword
    ) {
      setPasswordError(
        "Las contraseñas no coinciden.",
      );
      valid = false;
    }

    return valid;
  }

  async function handleSubmit(): Promise<void> {
    if (!validate()) {
      return;
    }

    try {
      if (mode === "register") {
        await register(email, password);
      } else {
        await login(email, password);
      }

      Alert.alert(
        mode === "register"
          ? "Cuenta creada"
          : "Sesión iniciada",
        mode === "register"
          ? "Tu cuenta está lista. Activa las notificaciones para recibir avisos push."
          : "Has iniciado sesión. Activa las notificaciones para recibir avisos push.",
        [
          {
            text: "Aceptar",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No se pudo completar la operación.",
      );
    }
  }

  async function handleLogout(): Promise<void> {
    await logout();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Cuenta",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <Screen scroll>
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          style={styles.container}
        >
          {session ? (
            <View style={styles.card}>
              <Text style={styles.title}>
                Sesión iniciada
              </Text>
              <Text style={styles.email}>
                {session.email}
              </Text>
              <Text style={styles.hint}>
                Tu token push está asociado a esta
                cuenta. Los avisos de tus servidores
                solo llegarán a tus dispositivos.
              </Text>
              <AppButton
                title="Cerrar sesión"
                onPress={() => {
                  void handleLogout();
                }}
              />
              <AppButton
                title="Configurar avisos push"
                onPress={() =>
                  router.push(
                    "/settings/notifications",
                  )
                }
              />
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.title}>
                {mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
              </Text>
              <Text style={styles.hint}>
                Con una cuenta, tus avisos push quedan
                asociados a ti. Si usas la app en varios
                dispositivos, todos recibirán los avisos
                de tus servidores.
              </Text>

              <AppTextInput
                label="Email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <AppTextInput
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />

              {mode === "register" ? (
                <AppTextInput
                  label="Repite la contraseña"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              ) : null}

              <AppButton
                title={
                  mode === "login"
                    ? "Iniciar sesión"
                    : "Crear cuenta"
                }
                loading={busy}
                onPress={() => {
                  void handleSubmit();
                }}
              />

              <AppButton
                title={
                  mode === "login"
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"
                }
                onPress={() => {
                  setMode(
                    mode === "login"
                      ? "register"
                      : "login",
                  );
                  setEmailError(undefined);
                  setPasswordError(undefined);
                }}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700",
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
