import React from "react";
import { Slot } from "expo-router";
import { UserProvider } from "../context/UserContext";
import { TransactionProvider } from "../context/TransactionContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <TransactionProvider>
          <Slot />
        </TransactionProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}