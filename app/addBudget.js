import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import { useUser } from "../context/UserContext";
import { getCategories } from "../api/categoryApi";
import { addBudget } from "../api/budgetApi";

import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";
import { DEFAULT_EXPENSE_CATEGORIES } from "../components/defaultIcon";

export default function AddBudget() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState([]);
  const [prefilled, setPrefilled] = useState(false);

  // =========================
  // RESET ON FOCUS
  // =========================
  useFocusEffect(
    useCallback(() => {
      setAmount("");
      setCategory("");
      setPrefilled(false);
    }, [])
  );

  // =========================
  // PREFILL FROM AI / VOICE
  // =========================
  useEffect(() => {
    if (prefilled) return;
    if (!params) return;
    if (categories.length === 0) return; // 🔥 IMPORTANT FIX

    const scannedAmount = params.scannedAmount ?? params.amount;
    const scannedCategory = params.scannedCategory;

    if (scannedAmount) {
      setAmount(String(scannedAmount));
    }

    if (scannedCategory) {
      const normalized = scannedCategory.toLowerCase().trim();

      const matched = categories.find(
        (c) =>
          c.id === normalized ||     // 👈 IMPORTANT
          c.name.toLowerCase() === normalized
      );

      if (matched) {
        setCategory(matched.id);
      } else {
        setCategory("");
      }
    }

    setPrefilled(true);
  }, [params, categories]);

  // =========================
  // LOAD CATEGORIES
  // =========================
 const loadCategories = async () => {
  if (!user) return;

  try {
    const dbCategories = await getCategories(user.user_id, "expense");

    const safeDb = (dbCategories || []).map((c) => ({
      id: c?.id ? String(c.id).toLowerCase() : "",
      name: c?.name || "",
    }));

    const defaultCats = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      id: String(c.id).toLowerCase(),
      name: c.name,
    }));

    const merged = [...defaultCats, ...safeDb];

    const unique = merged.filter(
      (item, index, self) =>
        item.id && index === self.findIndex((t) => t.id === item.id)
    );

    setCategories(unique);

    if (!category && unique.length > 0) {
      setCategory(unique[0].id);
    }
  } catch (err) {
    console.log("CATEGORY LOAD ERROR:", err);
  }
};

  useEffect(() => {
    loadCategories();
  }, [user]);

  // =========================
  // SAVE BUDGET
  // =========================
  const handleAddBudget = async () => {
    if (!user) {
      Alert.alert("Error", "Please login first");
      return;
    }

    if (!category || !amount) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const now = new Date();

    try {
      await addBudget({
        user_id: user.user_id,
        category,
        amount: parseFloat(amount),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      Alert.alert("Success", "Budget added");
      router.push("/drawer/budget");
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add budget");
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <View style={styles.container}>
      <AppHeader title="Add Budget" backRoute="/drawer/budget" />

      <BackgroundWrapper>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Category</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(val) => setCategory(val)}
            >
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.id} />
              ))}
            </Picker>
          </View>

          <TextInput
            placeholder="Amount"
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleAddBudget}
          >
            <Text style={styles.saveButtonText}>Save Budget</Text>
          </TouchableOpacity>
        </View>
      </BackgroundWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  formContainer: {
    flex: 1,
    paddingTop: 100,
  },

  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },

  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#ffffff71",
  },

  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});