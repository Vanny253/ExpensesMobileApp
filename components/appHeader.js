import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function AppHeader({
  title,
  backgroundColor = "#a3d2fe",
  showBack = true,
  backRoute,
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backRoute) {
      router.replace(backRoute); // 👈 go to specific screen
    } else {
      router.back(); // default behavior
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { backgroundColor }]}>
        {showBack ? (
          <Ionicons
            name="arrow-back"
            size={24}
            color="#000"
            onPress={handleBack}
          />
        ) : (
          <View style={{ width: 24 }} />
        )}

        <Text style={styles.title}>{title}</Text>

        <View style={{ width: 24 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});