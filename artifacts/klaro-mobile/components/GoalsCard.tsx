import { useGoalsSummary } from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function ProgressBar({
  percentage,
  onTrack,
}: {
  percentage: number;
  onTrack: boolean;
}) {
  const colors = useColors();
  const clamped = Math.min(Math.max(percentage, 0), 100);
  return (
    <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
      <View
        style={[
          styles.barFill,
          {
            width: `${clamped}%`,
            backgroundColor: onTrack ? colors.income : colors.expense,
          },
        ]}
      />
    </View>
  );
}

export function GoalsCard() {
  const colors = useColors();
  const { data: goals } = useGoalsSummary();

  if (!goals?.hasGoals) return null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Metas do mês
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/profile")}>
          <Text style={[styles.editLink, { color: colors.primary }]}>
            Editar
          </Text>
        </Pressable>
      </View>

      {goals.revenue && (
        <View style={styles.goalSection}>
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
              Receita
            </Text>
            <View style={styles.goalValues}>
              <Text style={[styles.goalCurrent, { color: colors.foreground }]}>
                {formatBRL(goals.revenue.current)}
              </Text>
              <Text style={[styles.goalSep, { color: colors.mutedForeground }]}>
                {" / "}
              </Text>
              <Text
                style={[styles.goalTarget, { color: colors.mutedForeground }]}
              >
                {formatBRL(goals.revenue.goal)}
              </Text>
            </View>
          </View>
          <ProgressBar
            percentage={goals.revenue.percentage}
            onTrack={goals.revenue.onTrack}
          />
          <View style={styles.goalFooter}>
            <Text
              style={[
                styles.goalPct,
                {
                  color: goals.revenue.onTrack
                    ? colors.income
                    : colors.expense,
                },
              ]}
            >
              {goals.revenue.percentage}%
            </Text>
            <Text
              style={[styles.goalHint, { color: colors.mutedForeground }]}
            >
              {goals.revenue.onTrack
                ? "no ritmo"
                : `projeção ${formatBRL(goals.revenue.projected)}`}
              {"  ·  "}
              {goals.revenue.daysLeft}d restantes
            </Text>
          </View>
        </View>
      )}

      {goals.margin && (
        <View
          style={[
            styles.goalSection,
            goals.revenue
              ? { borderTopWidth: 1, borderTopColor: colors.border }
              : null,
          ]}
        >
          <View style={styles.goalRow}>
            <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
              Margem
            </Text>
            <View style={styles.goalValues}>
              <Text style={[styles.goalCurrent, { color: colors.foreground }]}>
                {goals.margin.current.toFixed(1)}%
              </Text>
              <Text style={[styles.goalSep, { color: colors.mutedForeground }]}>
                {" / "}
              </Text>
              <Text
                style={[styles.goalTarget, { color: colors.mutedForeground }]}
              >
                {goals.margin.goal}%
              </Text>
            </View>
          </View>
          <ProgressBar
            percentage={goals.margin.percentage}
            onTrack={goals.margin.onTrack}
          />
          <View style={styles.goalFooter}>
            <Text
              style={[
                styles.goalPct,
                {
                  color: goals.margin.onTrack ? colors.income : colors.expense,
                },
              ]}
            >
              {goals.margin.percentage}%
            </Text>
            <Text
              style={[styles.goalHint, { color: colors.mutedForeground }]}
            >
              {goals.margin.onTrack ? "no ritmo" : "abaixo da meta"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  editLink: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  goalSection: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  goalValues: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  goalCurrent: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  goalSep: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  goalTarget: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goalPct: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  goalHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
