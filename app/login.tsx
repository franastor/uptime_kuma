import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Stack,
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { kumaService } from "@/src/core/services/KumaService";
import { registerPushToken } from "@/src/notifications/PushRegistration";

import { getServerCredentials } from "@/src/core/storage/serverStorage";

import { useMonitorStore } from "@/src/modules/monitor/store/monitor.store";
import { useHeartbeatHistoryStore } from "@/src/modules/monitor/store/heartbeatHistory.store";
import { useMonitorStatsStore } from "@/src/modules/monitor/store/monitorStats.store";

import { useServerStore } from "@/src/modules/servers/store/server.store";

import { AppButton } from "@/src/shared/components/AppButton";
import { BrandHeader } from "@/src/shared/components/BrandHeader";
import { AppTextInput } from "@/src/shared/components/AppTextInput";
import { Screen } from "@/src/shared/components/Screen";

import {
  colors,
  spacing,
  typography,
} from "@/src/shared/theme";

function isValidHttpUrl(
  value: string,
): boolean {
  try {
    const parsedUrl =
      new URL(value);

    return (
      parsedUrl.protocol ===
        "http:" ||
      parsedUrl.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

export default function AddServerScreen() {
  const params =
    useLocalSearchParams<{
      serverId?:
        | string
        | string[];
    }>();

  const serverId = Array.isArray(
    params.serverId,
  )
    ? params.serverId[0]
    : params.serverId;

  const isEditing =
    Boolean(serverId);

  const initializedServerId =
    useRef<string | null>(
      null,
    );

  const addServer =
    useServerStore(
      (state) =>
        state.addServer,
    );

  const updateServer =
    useServerStore(
      (state) =>
        state.updateServer,
    );

  const servers =
    useServerStore(
      (state) =>
        state.servers,
    );

  const hydrated =
    useServerStore(
      (state) =>
        state.hydrated,
    );

  const hydrate =
    useServerStore(
      (state) =>
        state.hydrate,
    );

  const saving =
    useServerStore(
      (state) =>
        state.saving,
    );

  const [
    loadingServer,
    setLoadingServer,
  ] = useState(
    Boolean(serverId),
  );

  const [
    name,
    setName,
  ] = useState("");

  const [
    url,
    setUrl,
  ] = useState("");

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    hasTwoFactor,
    setHasTwoFactor,
  ] = useState(false);

  const [
    nameError,
    setNameError,
  ] = useState<string>();

  const [
    urlError,
    setUrlError,
  ] = useState<string>();

  const [
    usernameError,
    setUsernameError,
  ] = useState<string>();

  const [
    passwordError,
    setPasswordError,
  ] = useState<string>();

  const [submitError, setSubmitError] =
    useState<string>();

  useEffect(() => {
    if (!hydrated) {
      void hydrate();
    }
  }, [
    hydrate,
    hydrated,
  ]);

  useEffect(() => {
    if (
      !serverId ||
      !hydrated ||
      initializedServerId.current === serverId
    ) {
      return;
    }
  
    const currentServerId = serverId;
  
    initializedServerId.current =
      currentServerId;
  
    async function loadServer(): Promise<void> {
      const server =
        servers.find(
          (item) =>
            item.id === currentServerId,
        );
  
      if (!server) {
        Alert.alert(
          "Servidor no encontrado",
          "No se ha podido localizar la conexión que quieres editar.",
          [
            {
              text: "Volver",
              onPress: () =>
                router.replace("/"),
            },
          ],
        );
  
        setLoadingServer(false);
        return;
      }
  
      try {
        const credentials =
          await getServerCredentials(
            currentServerId,
          );
  
        setName(server.name);
        setUrl(server.url);
        setUsername(server.username);
  
        setPassword(
          credentials?.password ?? "",
        );
  
        setHasTwoFactor(
          server.hasTwoFactor,
        );
      } catch (error) {
        console.error(
          "Error loading server credentials:",
          error,
        );
  
        Alert.alert(
          "No se pudo cargar",
          "No se han podido recuperar las credenciales del servidor.",
        );
      } finally {
        setLoadingServer(false);
      }
    }
  
    void loadServer();
  }, [
    hydrated,
    serverId,
    servers,
  ]);

  function validateForm(): boolean {
    let valid = true;

    setNameError(undefined);
    setUrlError(undefined);
    setUsernameError(
      undefined,
    );
    setPasswordError(
      undefined,
    );

    if (!name.trim()) {
      setNameError(
        "Introduce un nombre para el servidor.",
      );

      valid = false;
    }

    if (!url.trim()) {
      setUrlError(
        "Introduce la URL del servidor.",
      );

      valid = false;
    } else if (
      !isValidHttpUrl(
        url.trim(),
      )
    ) {
      setUrlError(
        "La URL debe comenzar por http:// o https://.",
      );

      valid = false;
    }

    if (!username.trim()) {
      setUsernameError(
        "Introduce el usuario.",
      );

      valid = false;
    }

    if (!password) {
      setPasswordError(
        "Introduce la contraseña.",
      );

      valid = false;
    }

    return valid;
  }

  async function handleSave(): Promise<void> {
    setSubmitError(undefined);
    if (!validateForm()) {
      return;
    }

    try {
      if (
        isEditing &&
        serverId
      ) {
        kumaService.disconnect(
          serverId,
        );

        useMonitorStore
          .getState()
          .clearServer(
            serverId,
          );
        useHeartbeatHistoryStore
          .getState()
          .clearServer(serverId);
        useMonitorStatsStore
          .getState()
          .clearServer(serverId);

        await updateServer({
          serverId,
          name,
          url,
          username,
          password,
          hasTwoFactor,
        });
      } else {
        await addServer({
          name,
          url,
          username,
          password,
          hasTwoFactor,
        });
      }

      // El token push se asocia a los servidores del usuario:
      // al guardar/editar, re-registrar para actualizar serverIds.
      void registerPushToken();

      router.replace("/");
    } catch (error) {
      console.error(
        "Error saving server:",
        error,
      );

      const message =
        error instanceof Error
          ? error.message
          : "Ha ocurrido un error al guardar el servidor.";
      setSubmitError(message);

      if (Platform.OS !== "web") {
        Alert.alert(
          isEditing
            ? "No se pudo actualizar"
            : "No se pudo guardar",
          message,
        );
      }
    }
  }

  if (
    !hydrated ||
    loadingServer
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            title: isEditing
              ? "Editar conexión"
              : "Añadir servidor",
          }}
        />

        <Screen
          contentContainerStyle={
            styles.loadingScreen
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.primary
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Cargando conexión...
          </Text>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing
            ? "Editar conexión"
            : "Añadir servidor",
        }}
      />

      <Screen scroll>
        <KeyboardAvoidingView
          behavior={
            Platform.OS ===
            "ios"
              ? "padding"
              : undefined
          }
          style={
            styles.container
          }
        >
          <BrandHeader compact={isEditing} />

          <View
            style={
              styles.header
            }
          >
            <Text
              style={
                styles.title
              }
            >
              {isEditing
                ? "Editar conexión"
                : "Conecta tu primer servidor"}
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {isEditing
                ? "Modifica los datos utilizados para conectar con esta instancia de Uptime Kuma."
                : "Añade tu instancia de Uptime Kuma y consulta el pulso de todos tus servicios desde KumaPulse."}
            </Text>
          </View>

          <View
            style={
              styles.form
            }
          >
            <AppTextInput
              label="Nombre"
              placeholder="Por ejemplo, Kuma Gana"
              value={name}
              onChangeText={
                setName
              }
              error={
                nameError
              }
              autoCapitalize="words"
            />

            <AppTextInput
              label="URL del servidor"
              placeholder="https://aquivatuservidor"
              value={url}
              onChangeText={
                setUrl
              }
              error={urlError}
              autoCapitalize="none"
              autoCorrect={
                false
              }
              keyboardType="url"
            />

            <AppTextInput
              label="Usuario"
              placeholder="Usuario de Uptime Kuma"
              value={
                username
              }
              onChangeText={
                setUsername
              }
              error={
                usernameError
              }
              autoCapitalize="none"
              autoCorrect={
                false
              }
            />

            <AppTextInput
              label="Contraseña"
              placeholder="Contraseña"
              value={
                password
              }
              onChangeText={
                setPassword
              }
              error={
                passwordError
              }
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={
                false
              }
            />

            <View
              style={
                styles.switchCard
              }
            >
              <View
                style={
                  styles.switchText
                }
              >
                <Text
                  style={
                    styles.switchTitle
                  }
                >
                  Autenticación en dos pasos
                </Text>

                <Text
                  style={
                    styles.switchDescription
                  }
                >
                  La aplicación solicitará el código cuando Uptime Kuma lo necesite.
                </Text>
              </View>

              <Switch
                value={
                  hasTwoFactor
                }
                onValueChange={
                  setHasTwoFactor
                }
                trackColor={{
                  false:
                    colors.border,
                  true: colors.primary,
                }}
                thumbColor={
                  hasTwoFactor
                    ? colors.primaryDark
                    : colors.textSecondary
                }
              />
            </View>

            <AppButton
              title={
                isEditing
                  ? "Guardar cambios"
                  : "Guardar servidor"
              }
              loading={saving}
              onPress={() =>
                void handleSave()
              }
            />

            {submitError ? (
              <Text style={styles.submitError}>
                {submitError}
              </Text>
            ) : null}

            <AppButton
              title="Cancelar"
              variant="ghost"
              disabled={saving}
              onPress={() =>
                router.back()
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}

const styles =
  StyleSheet.create({
    loadingScreen: {
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: spacing.md,
    },

    loadingText: {
      ...typography.body,
      color:
        colors.textSecondary,
    },

    container: {
      flex: 1,
    },

    header: {
      gap: spacing.sm,
      marginBottom:
        spacing.xxl,
    },

    title: {
      ...typography.title,
      color: colors.text,
    },

    description: {
      ...typography.body,
      color:
        colors.textSecondary,
    },

    form: {
      gap: spacing.xl,
    },

    submitError: {
      ...typography.caption,
      color: colors.danger,
      textAlign: "center",
    },

    switchCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: spacing.lg,
      padding:
        spacing.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 14,
      backgroundColor:
        colors.surface,
    },

    switchText: {
      flex: 1,
      gap: spacing.xs,
    },

    switchTitle: {
      ...typography.bodyMedium,
      color: colors.text,
    },

    switchDescription: {
      ...typography.caption,
      color:
        colors.textSecondary,
    },
  });