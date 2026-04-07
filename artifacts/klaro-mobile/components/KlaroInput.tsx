import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface KlaroInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const KlaroInput = forwardRef<TextInput, KlaroInputProps>(
  ({ label, error, style, ...props }, ref) => {
    const colors = useColors();

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            {label}
          </Text>
        ) : null}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: colors.input,
              color: colors.foreground,
              borderColor: error ? colors.destructive : colors.border,
              borderRadius: colors.radius,
            },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          {...props}
        />
        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

KlaroInput.displayName = "KlaroInput";

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 50,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
