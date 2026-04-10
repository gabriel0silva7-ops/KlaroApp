import { Feather } from "@expo/vector-icons";
import {
  useGenerateInsights,
  useListInsights,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface InsightCardProps {
  title: string;
  description: string;
  recommendation: string;
  periodLabel: string;
}

function InsightCard({
  title,
  description,
  recommendation,
  periodLabel,
}: InsightCardProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: `${colors.primary}22`, borderRadius: 10 },
          ]}
        >
          <Feather name="zap" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.periodLabel, { color: colors.mutedForeground }]}>
          {periodLabel}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        {description}
      </Text>
      <View
        style={[
          styles.recommendationBox,
          {
            backgroundColor: `${colors.primary}11`,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.recommendationText, { color: colors.foreground }]}>
          {recommendation}
        </Text>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: insights, isLoading, refetch } = useListInsights();
  const generateMutation = useGenerateInsights();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleGenerate() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generateMutation.mutateAsync({});
    await refetch();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Insights
          </Text>
          <Text
            style={[styles.headerSub, { color: colors.mutedForeground }]}
          >
            Recomendações baseadas nos seus dados
          </Text>
        </View>
        <Pressable
          onPress={handleGenerate}
          disabled={generateMutation.isPending}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed || generateMutation.isPending ? 0.7 : 1,
            },
          ]}
        >
          {generateMutation.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Feather name="zap" size={18} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={Array.isArray(insights) ? insights : []}
          keyExtractor={(item, index) => item?.id != null ? String(item.id) : `insight-${index}`}
          renderItem={({ item }) => (
            <InsightCard
              title={item.title}
              description={item.description}
              recommendation={item.recommendation}
              periodLabel={item.periodLabel}
            />
          )}
          scrollEnabled={!!(insights && insights.length > 0)}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                insets.bottom + (Platform.OS === "web" ? 34 : 0) + 100,
              paddingTop: 16,
            },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather
                name="bar-chart-2"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyTitle, { color: colors.foreground }]}
              >
                Sem insights ainda
              </Text>
              <Text
                style={[styles.emptyText, { color: colors.mutedForeground }]}
              >
                Toque no ⚡ para gerar recomendações baseadas nas suas
                transações.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  generateBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    padding: 18,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBox: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  periodLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  recommendationBox: {
    padding: 12,
  },
  recommendationText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  emptyBox: {
    paddingTop: 60,
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
