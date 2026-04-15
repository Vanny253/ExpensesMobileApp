// app/profile/signup.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { signupUser } from "../../api/userApi";
import { router } from "expo-router";
import BackgroundWrapper from "../../components/backgroundWrapper";
import AppHeader from "../../components/appHeader";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      Alert.alert("Error", "Please fill in email, password, and nickname");
      return;
    }

    try {
      const result = await signupUser({
        email,
        password,
        nickname,
        phone_number: phone,
        gender,
        date_of_birth: dob,
      });

      Alert.alert("Signup successful!", "Please login now.");
      router.push("./login"); // go to login page
    } catch (err) {
      Alert.alert("Signup failed", err?.message || "Something went wrong");
    }
  };

  return (
    <BackgroundWrapper>
      <AppHeader backRoute="drawer/tabs/profile" /> 
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Signup</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Nickname"
          value={nickname}
          onChangeText={setNickname}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone number (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Gender (optional)"
          value={gender}
          onChangeText={setGender}
        />

        <TextInput
          style={styles.input}
          placeholder="Date of birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={setDob}
        />

        {/* CUSTOM BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Signup</Text>
        </TouchableOpacity>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
  backgroundColor: "#007AFF",
  padding: 14,
  borderRadius: 10,
  alignItems: "center",
  marginTop: 10,
},

buttonText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 16,
},
});