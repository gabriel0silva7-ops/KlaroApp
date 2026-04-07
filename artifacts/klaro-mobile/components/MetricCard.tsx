import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface MetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
  valueColor?: string;
}

export function MetricCard({
  label,
  value,
  sublabel,
  accent = false,
  valueColor,
}: MetricCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderRadius: colors.radius,
          borderWidth: 1,
          borderColor: accent ? "transparent" : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: accent ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: valueColor
              ? valueColor
              : accent
                ? colors.primaryForeground
                : colors.foreground,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sublabel ? (
        <Text
          style={[
            styles.sublabel,
            { color: accent ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 4,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  sublabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
