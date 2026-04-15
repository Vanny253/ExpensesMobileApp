// app/drawer/tabs/budget.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import BottomTabs from "../../components/_BottomTabs";
import { getBudgets } from "../../api/budgetApi";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import BackgroundWrapper from "../../components/backgroundWrapper";
import AppHeader from "../../components/appHeader";

export default function BudgetScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();

      const data = await getBudgets(
        user.user_id,
        now.getMonth() + 1,
        now.getFullYear()
      );

      setBudgets(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [user]);

  const handleOpenDetail = (budget) => {
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


  if (!user) {
      return (
        <BackgroundWrapper>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.guestContainer}>
              <Text style={styles.guestText}>
                Guest Mode: Please login to manage budgets.
              </Text>
            </View>
          </View>
  
          <BottomTabs />
        </BackgroundWrapper>
      );
    }

  return (
    <BackgroundWrapper>
      <View style={{ flex: 1 }}>


        <View style={styles.container}>

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

          {/* 👇 BUTTON BELOW LIST (same style as regular_payment) */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/addBudget")}
          >
            <Text style={styles.addButtonText}>Add New Budget</Text>
          </TouchableOpacity>

        </View>

        <BottomTabs />

      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginLeft: -15,
    marginTop: -15,
    marginRight: -15,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "rgb(182,182,182)",
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#ffffff71",
  },

  category: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  guestText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 16,
  },
});