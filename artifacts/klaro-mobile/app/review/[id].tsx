import { Feather } from "@expo/vector-icons";
import {
  useConfirmParsedRecords,
  useGetUpload,
} from "@workspace/api-client-react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KlaroButton } from "@/components/KlaroButton";
import { useColors } from "@/hooks/useColors";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  const { data: upload, isLoading } = useGetUpload(Number(id));
  const confirmMutation = useConfirmParsedRecords();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleConfirm() {
    if (!id) return;
    setConfirming(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await confirmMutation.mutateAsync({
        data: { rawInputId: Number(id) },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Confirmado!",
        `${result.confirmedCount} transações foram salvas.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch {
      Alert.alert("Erro", "Não foi possível confirmar. Tente novamente.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setConfirming(false);
    }
  }

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingRoot,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const records = upload?.parsedRecords ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text
            style={[styles.fileName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {upload?.fileName ?? "Revisão"}
          </Text>
          <Text
            style={[styles.recordCount, { color: colors.mutedForeground }]}
          >
            {records.length} registros extraídos
          </Text>
        </View>
      </View>

      {records.length === 0 ? (
        <View style={styles.emptyBox}>
          <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Nenhum registro foi extraído deste arquivo.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={records}
            keyExtractor={(item, index) => item?.id != null ? String(item.id) : `record-${index}`}
            renderItem={({ item }) => {
              const isIncome = item.type === "income";
              const formattedAmount = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.amount);

              return (
                <View
                  style={[
                    styles.recordRow,
                    {
                      backgroundColor: colors.card,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.recordLeft}>
                    <Text
                      style={[styles.recordDate, { color: colors.mutedForeground }]}
                    >
                      {item.date}
                    </Text>
                    <Text
                      style={[styles.recordDesc, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                    <Text
                      style={[
                        styles.recordCategory,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.category}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.recordAmount,
                      {
                        color: isIncome ? colors.income : colors.expense,
                      },
                    ]}
                  >
                    {isIncome ? "+" : "-"}
                    {formattedAmount}
                  </Text>
                </View>
              );
            }}
            contentContainerStyle={[
              styles.list,
              {
                paddingBottom:
                  insets.bottom + (Platform.OS === "web" ? 34 : 0) + 120,
              },
            ]}
          />

          {/* Confirm button */}
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 16,
                paddingTop: 16,
                paddingHorizontal: 20,
                backgroundColor: colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
              Revise os dados acima antes de confirmar
            </Text>
            <KlaroButton
              title={`Confirmar ${records.length} transações`}
              onPress={handleConfirm}
              loading={confirming}
              fullWidth
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  recordCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  list: {
    gap: 1,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  recordLeft: {
    flex: 1,
    gap: 3,
  },
  recordDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  recordDesc: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  recordCategory: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textTransform: "capitalize",
  },
  recordAmount: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    gap: 10,
  },
  footerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
