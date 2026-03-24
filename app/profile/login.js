// app/profile/login.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { loginUser } from "../../api/userApi";
import { useUser } from "../../context/UserContext";
import { router } from "expo-router";

export default function LoginScreen() {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser({
        email: email.trim(),
        password,
      });

      if (!result.user) throw new Error("Login failed: user not found");

      const loggedInUser = result.user;

      if (loggedInUser.profile_image && !loggedInUser.profile_image.startsWith("http")) {
        loggedInUser.profile_image = `http://192.168.0.10:5000/${loggedInUser.profile_image}`;
      }
      setUser(loggedInUser); // update context

      Alert.alert("Login successful", `Welcome ${loggedInUser.nickname}!`);

      router.replace("/drawer/tabs/profile"); // go to profile tab
    } catch (err) {
      const message =
        typeof err === "string"
          ? err
          : err?.message || "Invalid email or password";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <Button title="Login" onPress={handleLogin} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttonContainer: { marginTop: 10 },
});