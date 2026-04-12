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

export default function ChartProgressBar() {
  const { user } = useUser();
  const router = useRouter();
  const { category, name, month } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  const resolveCategory = (value) => {
    if (!value) return null;

    const list = [...DEFAULT_EXPENSE_CATEGORIES, ...expenseCategories];

    let found = list.find((c) => String(c.id) === String(value));

    if (!found) {
      found = list.find(
        (c) => c.name?.toLowerCase() === String(value).toLowerCase()
      );
    }

    return found;
  };

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

          return (
            d.getMonth() === targetMonth &&
            d.getFullYear() === now.getFullYear() &&
            String(item.category) === String(category)
          );
        });

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, category, month]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER - Outside BackgroundWrapper */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <Ionicons
            name="arrow-back"
            size={24}
            color="#000000"
            onPress={() => router.replace("/drawer/tabs/charts")}
          />

          <Text style={styles.headerTitle}>
            Progress Bar Detail
          </Text>

          <View style={{ width: 24 }} />
        </View>
      </View>

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
            keyExtractor={(item) => `${item.type}-${item.id}`}
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

                    <Text style={styles.date}>{item.date}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* HEADER - Full width blue, outside BackgroundWrapper */
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#a3d2fe",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },

  /* CONTENT - Padding inside BackgroundWrapper */
  contentPadding: {
    flex: 1,
    paddingTop: 90,      // Push below header
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
    borderColor: "rgb(182, 182, 182)",
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