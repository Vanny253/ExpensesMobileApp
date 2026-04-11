import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useUser } from "../context/UserContext";
import { getExpenses, getIncome } from "../api/expenseApi";
import { getCategories } from "../api/categoryApi";
import { DEFAULT_EXPENSE_CATEGORIES } from "../components/defaultIcon";
import { Ionicons } from "@expo/vector-icons";

export default function ChartProgressBar() {
  const { user } = useUser();
  const { category, name, month } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  /* ---------------- CATEGORY RESOLVER ---------------- */
  const resolveCategory = (value) => {
    if (!value) return null;

    const list = [...DEFAULT_EXPENSE_CATEGORIES, ...expenseCategories];

    let found = list.find((c) => String(c.id) === String(value));

    if (!found) {
      found = list.find(
        (c) =>
          c.name?.toLowerCase() === String(value).toLowerCase()
      );
    }

    return found;
  };

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const [expenses, income, cats] = await Promise.all([
          getExpenses(user.user_id),
          getIncome(user.user_id),
          getCategories(user.user_id, "expense"),
        ]);

        setExpenseCategories(cats || []);

        const all = [
          ...expenses.map((e) => ({ ...e, type: "expense" })),
          ...income.map((i) => ({ ...i, type: "income" })),
        ];

        const now = new Date();
        const targetMonth = now.getMonth() - Number(month);

        const filtered = all.filter((item) => {
          const d = new Date(item.date);

          const matchMonth =
            d.getMonth() === targetMonth &&
            d.getFullYear() === now.getFullYear();

          const matchCategory =
            String(item.category) === String(category);

          return matchMonth && matchCategory;
        });

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(filtered);
      } catch (err) {
        console.error("Failed to load category details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, category, month]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <Text style={styles.title}>
        {name || "Category"}
      </Text>

      <Text style={styles.subtitle}>
        {transactions.length} transactions
      </Text>

      {/* LIST */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => {
          const resolved = resolveCategory(item.category);

          return (
            <View style={styles.card}>

              {/* LEFT SIDE */}
              <View style={styles.left}>
                <Ionicons
                  name={resolved?.icon || "help-circle"}
                  size={20}
                  color="#555"
                />

                <Text style={styles.itemTitle}>
                  {resolved?.name || item.category}
                </Text>
              </View>

              {/* RIGHT SIDE */}
              <View style={styles.right}>
                <Text
                  style={[
                    styles.amount,
                    {
                      color:
                        item.type === "income"
                          ? "#1aa34a"
                          : "#e03131",
                    },
                  ]}
                >
                  RM {item.amount}
                </Text>

                <Text style={styles.date}>
                  {item.date}
                </Text>
              </View>

            </View>
          );
        }}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    marginBottom: 15,
    color: "#666",
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  right: {
    alignItems: "flex-end",
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },

  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },

  date: {
    fontSize: 12,
    color: "#777",
  },
});