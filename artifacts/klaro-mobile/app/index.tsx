import { Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function IndexPage() {
  const { user, isLoading } = useAuth();
  const colors = useColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
