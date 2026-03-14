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

import BottomTabs from "../../components/_BottomTabs";
import { getBudgets, addBudget } from "../../api/budgetApi";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";

export default function BudgetScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [budgets, setBudgets] = useState([]);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);

  // Load budgets
  const loadBudgets = async () => {
    if (!user) {
      // Guest mode: reset budgets
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
  }, [user]); // re-run when user changes

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

      setCategory("");
      setAmount("");
      loadBudgets();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add budget");
    }
  };

  // Open Budget Detail
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

        <TextInput
          placeholder="Category"
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

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

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
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