// app/drawer/tabs/addBudget.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import { getCategories } from "../api/categoryApi";
import { addBudget } from "../api/budgetApi";

import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";

export default function AddBudget() {
  const { user } = useUser();
  const router = useRouter();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState([]);

  const DEFAULT_CATEGORIES = [
    { name: "Food" },
    { name: "Transport" },
    { name: "Billing" },
    { name: "Shopping" },
    { name: "Health" },
    { name: "Entertainment" },
  ];

  const loadCategories = async () => {
    if (!user) return;

    try {
      const dbCategories = await getCategories(user.user_id, "expense");
      const dbNames = dbCategories.map((c) => c.name);

      const defaultNames = DEFAULT_CATEGORIES.map((c) => c.name);

      const mergedNames = [
        ...defaultNames,
        ...dbNames.filter((n) => !defaultNames.includes(n)),
      ];

      const finalCategories = mergedNames.map((name, idx) => ({
        id: idx,
        name,
      }));

      setCategories(finalCategories);

      if (finalCategories.length > 0) {
        setCategory(finalCategories[0].name);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load categories");
    }
  };

  useEffect(() => {
    loadCategories();
  }, [user]);

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
      router.back();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to add budget");
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Add Budget"
        backRoute="/drawer/budget"
      />

      <BackgroundWrapper>
        <View style={styles.formContainer}>

          <Text style={styles.label}>Category</Text>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(val) => setCategory(val)}
            >
              {categories.map((c) => (
                <Picker.Item key={c.id} label={c.name} value={c.name} />
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