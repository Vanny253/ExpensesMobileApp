// app/drawer/tabs/budget.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import { Picker } from "@react-native-picker/picker";
import BottomTabs from "../../components/_BottomTabs";
import { getBudgets, addBudget } from "../../api/budgetApi";
import { useUser } from "../../context/UserContext";
import { getCategories } from "../../api/categoryApi";
import { useRouter } from "expo-router";

export default function BudgetScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const DEFAULT_CATEGORIES = [
    { name: "Food" },
    { name: "Transport" },
    { name: "Billing" },
    { name: "Shopping" },
    { name: "Health" },
    { name: "Entertainment" },
  ];

  // Load categories
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
      console.error(err);
      Alert.alert("Error", "Failed to load categories");
    }
  };

  // Load budgets
  const loadBudgets = async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getBudgets(user.user_id);
      setBudgets(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadCategories();
  }, [user]);

  // Add budget
  const handleAddBudget = async () => {
    if (!user) {
      Alert.alert("Guest Mode", "Please login to add budgets");
      return;
    }

    if (!category || !amount) {
      Alert.alert("Error", "Enter category and amount");
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

      setAmount("");

      // reset category to first
      if (categories.length > 0) {
        setCategory(categories[0].name);
      }

      loadBudgets();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add budget");
    }
  };

  const handleOpenDetail = (budget) => {
    if (!user) {
      Alert.alert("Guest Mode", "Please login to view budget details");
      return;
    }

    router.push({
      pathname: "/budgetDetail",
      params: {
        id: budget.id,
        category: budget.category,
        budget: budget.budget,
        spent: budget.spent,
        remaining: budget.remaining,
        month: budget.month,
        year: budget.year,
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Budget</Text>

        {/* Category Dropdown */}
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

        <Button title="Add Budget" onPress={handleAddBudget} />

        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleOpenDetail(item)}>
                <View style={styles.card}>
                  <Text style={styles.category}>{item.category}</Text>
                  <Text>Budget: RM{item.budget.toFixed(2)}</Text>
                  <Text>Spent: RM{item.spent.toFixed(2)}</Text>
                  <Text>Remaining: RM{item.remaining.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                No budgets yet. Add one!
              </Text>
            }
          />
        )}
      </View>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "bold",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },

  category: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
});