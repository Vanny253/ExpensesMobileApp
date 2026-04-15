import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getCategories } from "../api/categoryApi";
import { getExpenses, getIncome } from "../api/expenseApi";
import BackgroundWrapper from "../components/backgroundWrapper";
import { DEFAULT_EXPENSE_CATEGORIES } from "../components/defaultIcon";
import { useUser } from "../context/UserContext";
import AppHeader from "../components/appHeader";

export default function ChartProgressBar() {
  const { user } = useUser();
  const router = useRouter();

  const {
    category,
    name,
    timeframe,
    subPeriod,
    startDate,
    endDate,
  } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // -----------------------------
  // CATEGORY RESOLVER
  // -----------------------------
  const resolveCategory = (value) => {
    if (!value) return null;

    const list = [
      ...(DEFAULT_EXPENSE_CATEGORIES || []),
      ...(expenseCategories || []),
    ];

    return (
      list.find((c) => String(c.id) === String(value)) ||
      list.find(
        (c) =>
          (c.name || "").toLowerCase() === String(value).toLowerCase()
      )
    );
  };

  // -----------------------------
  // CATEGORY MATCH FIX (IMPORTANT)
  // -----------------------------
  const matchCategory = (item) => {
    const target = String(category);

    const cat = item.category;

    if (!cat) return false;

    if (String(cat) === target) return true;

    if (typeof cat === "object") {
      return (
        String(cat.id) === target ||
        String(cat._id) === target ||
        String(cat.name).toLowerCase() === target.toLowerCase()
      );
    }

    return (
      String(cat).toLowerCase() === target.toLowerCase()
    );
  };

  // -----------------------------
  // FETCH DATA
  // -----------------------------
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
          ...(expenses || []).map((e) => ({
            ...e,
            type: "expense",
          })),
          ...(income || []).map((i) => ({
            ...i,
            type: "income",
          })),
        ];

        const filtered = all.filter((item) => {
          if (!matchCategory(item)) return false;

          const d = new Date(item.date);

          // ---------------------
          // WEEK MODE (FIXED)
          // ---------------------
          if (timeframe === "week") {
            if (!startDate || !endDate) return false;

            const start = new Date(startDate);
            const end = new Date(endDate);

            return d >= start && d <= end;
          }

          // ---------------------
          // MONTH MODE
          // ---------------------
          if (timeframe === "month") {
            const now = new Date();

            const targetMonth = new Date(
              now.getFullYear(),
              now.getMonth() - Number(subPeriod),
              1
            );

            return (
              d.getMonth() === targetMonth.getMonth() &&
              d.getFullYear() === targetMonth.getFullYear()
            );
          }

          // ---------------------
          // YEAR MODE
          // ---------------------
          if (timeframe === "year") {
            return (
              d.getFullYear() ===
              new Date().getFullYear()
            );
          }

          return false;
        });

        filtered.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setTransactions(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    user,
    category,
    timeframe,
    subPeriod,
    startDate,
    endDate,
  ]);

  // -----------------------------
  // LOADING
  // -----------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <View style={styles.container}>

      <AppHeader
          title="Regular Payment Detail"
          backRoute="/drawer/tabs/charts"
        />

      <BackgroundWrapper>
        <View style={styles.contentPadding}>

          <Text style={styles.title}>
            {name || "Category"}
          </Text>

          <Text style={styles.subtitle}>
            {transactions.length} transactions
          </Text>

          <FlatList
            data={transactions}
            keyExtractor={(item, index) =>
              `${item.type}-${index}`
            }
            renderItem={({ item }) => {
              const resolved = resolveCategory(item.category);

              return (
                <View style={styles.card}>

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
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>

                </View>
              );
            }}
          />

        </View>
      </BackgroundWrapper>
    </View>
  );
}

// -----------------------------
const styles = StyleSheet.create({
  container: { 
    flex: 1,
   },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  

  contentPadding: {
    flex: 1,
    paddingTop: 90,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
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
    backgroundColor: "#ffffff71",
    borderWidth: 1,
    borderColor: "#b6b6b6",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
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