import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import BackgroundWrapper from "../components/backgroundWrapper";

// API
import { setMonthlyBudget } from "../api/budgetApi";

export default function SetMonthlyBudget() {
  const router = useRouter();
  const { user_id } = useLocalSearchParams();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (loading) return;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid amount greater than 0.");
      return;
    }

    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; // 1-12
    const year = currentDate.getFullYear();

    try {
      setLoading(true);

      await setMonthlyBudget({
        user_id,
        amount: Number(amount),
        month,
        year,
      });

      Alert.alert("Success", "Monthly budget saved!");
      router.replace("/drawer/tabs/report");
    } catch (error) {
      console.log("Set Monthly Budget Error:", error);
      Alert.alert("Error", "Failed to save monthly budget.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Set Monthly Budget</Text>

        <Text style={styles.label}>Enter Amount (RM)</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 2000"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  label: {
    fontSize: 16,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});