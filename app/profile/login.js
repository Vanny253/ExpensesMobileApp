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
  TouchableOpacity, // ✅ ADD
} from "react-native";
import { loginUser } from "../../api/userApi";
import { useUser } from "../../context/UserContext";
import { router } from "expo-router";
import API_URL from "../../api/config";
import BackgroundWrapper from "../../components/backgroundWrapper";
import AppHeader from "../../components/appHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        loggedInUser.profile_image = `${API_URL}/${loggedInUser.profile_image}`;
      }
      setUser(loggedInUser);
      await AsyncStorage.setItem("user", JSON.stringify(loggedInUser));

      Alert.alert("Login successful", `Welcome ${loggedInUser.nickname}!`);

      router.replace("/drawer/tabs");
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
    <BackgroundWrapper>
      <AppHeader backRoute="/drawer/tabs/profile" />

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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Button title="Login" onPress={handleLogin} />
          )}
        </View>

        {/* ✅ NEW SIGNUP LINK */}
        <TouchableOpacity
          onPress={() => router.push("/profile/signup")}
          style={styles.signupContainer}
        >
          <Text style={styles.signupText}>
            Don’t have an account?{" "}
            <Text style={styles.signupLink}>Create a new account</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },

  // ✅ NEW STYLES
  signupContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  signupText: {
    fontSize: 14,
    color: "#555",
  },
  signupLink: {
    color: "#007AFF",
    fontWeight: "bold",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },

  eye: {
    fontSize: 18,
    marginLeft: 10,
  },
});