import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface KlaroButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function KlaroButton({
  onPress,
  title,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
}: KlaroButtonProps) {
  const colors = useColors();

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.secondary
        : variant === "danger"
          ? colors.destructive
          : "transparent";

  const fg =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "ghost"
        ? colors.primary
        : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: bg, borderRadius: colors.radius },
        variant === "ghost" && { borderWidth: 1, borderColor: colors.border },
        (pressed || disabled) && { opacity: 0.7 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
