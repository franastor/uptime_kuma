import {
    useEffect,
    useRef,
    useState,
} from "react";
  
  import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
  
  import {
    colors,
    spacing,
    typography,
} from "@/src/shared/theme";
  
  type TwoFactorModalProps = {
    visible: boolean;
    serverName?: string;
    loading?: boolean;
    error?: string | null;
    onConfirm: (
      token: string,
    ) => void | Promise<void>;
    onCancel: () => void;
  };
  
  function normalizeToken(
    value: string,
  ): string {
    return value
      .replace(/\D/g, "")
      .slice(0, 6);
  }
  
  export function TwoFactorModal({
    visible,
    serverName,
    loading = false,
    error = null,
    onConfirm,
    onCancel,
  }: TwoFactorModalProps) {
    const inputRef =
      useRef<TextInput | null>(
        null,
      );
  
    const [
      token,
      setToken,
    ] = useState("");
  
    const [
      validationError,
      setValidationError,
    ] = useState<
      string | null
    >(null);
  
    useEffect(() => {
      if (!visible) {
        setToken("");
        setValidationError(
          null,
        );
  
        return;
      }
  
      const timeoutId =
        setTimeout(() => {
          inputRef.current?.focus();
        }, 250);
  
      return () => {
        clearTimeout(timeoutId);
      };
    }, [visible]);
  
    function handleRequestClose(): void {
      if (!loading) {
        onCancel();
      }
    }
  
    function handleTokenChange(
      value: string,
    ): void {
      const normalizedValue =
        normalizeToken(value);
  
      setToken(
        normalizedValue,
      );
  
      if (
        validationError &&
        normalizedValue.length === 6
      ) {
        setValidationError(
          null,
        );
      }
    }
  
    async function handleConfirm(): Promise<void> {
      if (loading) {
        return;
      }
  
      if (token.length !== 6) {
        setValidationError(
          "Introduce un código válido de 6 dígitos.",
        );
  
        return;
      }
  
      setValidationError(
        null,
      );
  
      try {
        await onConfirm(token);
      } catch (confirmError) {
        console.error("Two-factor confirmation failed:", confirmError);
        setValidationError(
          confirmError instanceof Error
            ? confirmError.message
            : "No se pudo validar el código de autenticación.",
        );
      }
    }
  
    const displayedError =
      validationError ?? error;
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={
          handleRequestClose
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          style={styles.overlay}
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            disabled={loading}
            onPress={
              handleRequestClose
            }
          />
  
          <View
            style={styles.modalCard}
          >
            <View
              style={
                styles.iconContainer
              }
            >
              <Text style={styles.icon}>
                🔐
              </Text>
            </View>
  
            <Text style={styles.title}>
              Autenticación en dos pasos
            </Text>
  
            <Text
              style={
                styles.description
              }
            >
              Introduce el código generado
              por tu aplicación de
              autenticación
              {serverName
                ? ` para conectar con "${serverName}".`
                : "."}
            </Text>
  
            <TextInput
              ref={inputRef}
              value={token}
              editable={!loading}
              maxLength={6}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              placeholder="000000"
              placeholderTextColor={
                colors.textMuted
              }
              selectionColor={
                colors.primary
              }
              onChangeText={
                handleTokenChange
              }
              onSubmitEditing={() =>
                void handleConfirm()
              }
              style={[
                styles.input,
                displayedError &&
                  styles.inputError,
              ]}
            />
  
            {displayedError ? (
              <Text
                style={
                  styles.errorMessage
                }
              >
                {displayedError}
              </Text>
            ) : null}
  
            <View
              style={styles.actions}
            >
              <Pressable
                disabled={loading}
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
  
                  pressed &&
                    styles.buttonPressed,
  
                  loading &&
                    styles.buttonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Cancelar
                </Text>
              </Pressable>
  
              <Pressable
                disabled={loading}
                onPress={() =>
                  void handleConfirm()
                }
                style={({ pressed }) => [
                  styles.button,
                  styles.confirmButton,
  
                  pressed &&
                    styles.buttonPressed,
  
                  loading &&
                    styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      colors.background
                    }
                  />
                ) : (
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    Conectar
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
  
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
      backgroundColor:
        "rgba(0, 0, 0, 0.65)",
    },
  
    modalCard: {
      width: "100%",
      maxWidth: 420,
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 24,
      backgroundColor:
        colors.surface,
    },
  
    iconContainer: {
      width: 52,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
      borderRadius: 26,
      backgroundColor:
        colors.surfaceElevated,
    },
  
    icon: {
      fontSize: 24,
    },
  
    title: {
      ...typography.heading,
      color: colors.text,
      textAlign: "center",
    },
  
    description: {
      ...typography.body,
      color:
        colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
  
    input: {
      width: "100%",
      minHeight: 58,
      paddingHorizontal:
        spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      backgroundColor:
        colors.surfaceElevated,
      color: colors.text,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: 8,
      textAlign: "center",
    },
  
    inputError: {
      borderColor: colors.danger,
    },
  
    errorMessage: {
      ...typography.caption,
      width: "100%",
      color: colors.danger,
      textAlign: "center",
    },
  
    actions: {
      width: "100%",
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.md,
    },
  
    button: {
      flex: 1,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal:
        spacing.md,
      borderRadius: 14,
    },
  
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor:
        colors.surfaceElevated,
    },
  
    confirmButton: {
      backgroundColor:
        colors.primary,
    },
  
    cancelButtonText: {
      ...typography.bodyMedium,
      color: colors.text,
    },
  
    confirmButtonText: {
      ...typography.bodyMedium,
      color: colors.background,
    },
  
    buttonPressed: {
      opacity: 0.75,
    },
  
    buttonDisabled: {
      opacity: 0.55,
    },
  });
  