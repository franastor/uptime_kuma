import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
  
  import {
    colors,
    spacing,
    typography,
} from "@/src/shared/theme";
  
  type ConfirmModalProps = {
    visible: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };
  
  export function ConfirmModal({
    visible,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    destructive = false,
    loading = false,
    onConfirm,
    onCancel,
  }: ConfirmModalProps) {
    function handleRequestClose() {
      if (!loading) {
        onCancel();
      }
    }
  
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleRequestClose}
      >
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            disabled={loading}
            onPress={handleRequestClose}
          />
  
          <View style={styles.modalCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>
                !
              </Text>
            </View>
  
            <Text style={styles.title}>
              {title}
            </Text>
  
            <Text style={styles.description}>
              {description}
            </Text>
  
            <View style={styles.actions}>
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
                  {cancelLabel}
                </Text>
              </Pressable>
  
              <Pressable
                disabled={loading}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.button,
                  destructive
                    ? styles.destructiveButton
                    : styles.confirmButton,
                  pressed &&
                    styles.buttonPressed,
                  loading &&
                    styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.background}
                  />
                ) : (
                  <Text
                    style={
                      styles.confirmButtonText
                    }
                  >
                    {confirmLabel}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
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
      backgroundColor: colors.surface,
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
      fontSize: 26,
      fontWeight: "800",
      color: colors.danger,
    },
  
    title: {
      ...typography.heading,
      color: colors.text,
      textAlign: "center",
    },
  
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
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
      paddingHorizontal: spacing.md,
      borderRadius: 14,
    },
  
    cancelButton: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor:
        colors.surfaceElevated,
    },
  
    confirmButton: {
      backgroundColor: colors.primary,
    },
  
    destructiveButton: {
      backgroundColor: colors.danger,
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