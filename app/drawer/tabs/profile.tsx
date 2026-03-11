// app/drawer/tabs/profile.tsx
import React from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { useUser } from "../../../context/UserContext";
import { router } from "expo-router";


export default function ProfileTab() {
  const { user, setUser } = useUser();

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user ? (
        <View style={styles.userContainer}>
          <Text style={styles.greeting}>Welcome, {user.nickname}!</Text>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.info}>{user.email}</Text>
          <Text style={styles.label}>Date of Birth:</Text>
          <Text style={styles.info}>{user.date_of_birth}</Text>

          <View style={styles.buttonContainer}>
            <Button title="Logout" onPress={handleLogout} color="#FF3B30" />
          </View>
        </View>
      ) : (
        <View style={styles.guestContainer}>
          <Text style={styles.greeting}>You are currently a Guest.</Text>
          <View style={styles.buttonContainer}>
            <Button title="Login" onPress={() => router.push("/profile/login")} />
            <Button title="Signup" onPress={() => router.push("/profile/signup")} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  userContainer: { width: "100%", alignItems: "flex-start" },
  guestContainer: { width: "100%", alignItems: "center" },
  greeting: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 10 },
  info: { fontSize: 16, marginBottom: 5 },
  buttonContainer: { width: "100%", marginTop: 20 },
});