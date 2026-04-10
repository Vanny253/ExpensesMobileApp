import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { getExpenses, getIncome } from "../../../api/expenseApi";
import { getCategories } from "../../../api/categoryApi";
import { useUser } from "../../../context/UserContext";
import { PanGestureHandler } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "fast-food" },
  { name: "Transport", icon: "car" },
  { name: "Billing", icon: "receipt" },
  { name: "Shopping", icon: "cart" },
  { name: "Health", icon: "medkit" },
  { name: "Entertainment", icon: "game-controller" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "cash" },
  { name: "Gift", icon: "gift" },
  { name: "Investment", icon: "trending-up" },
  { name: "Bonus", icon: "wallet" },
  { name: "Freelance", icon: "laptop" },
];

export default function MainScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [balance, setBalance] = useState(0);

  const [currentDate, setCurrentDate] = useState(new Date());

  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);

  const today = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

  // ✅ ICON LOOKUP FIXED
  const getCategoryIcon = (categoryName, type) => {
    const list =
      type === "income"
        ? [...DEFAULT_INCOME_CATEGORIES, ...incomeCategories]
        : [...DEFAULT_EXPENSE_CATEGORIES, ...expenseCategories];

    const found = list.find((c) => c.name === categoryName);

    return found?.icon || "help-circle";
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setTotalExpense(0);
      setTotalIncome(0);
      setBalance(0);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        const [
          expenseData,
          incomeData,
          expenseCats,
          incomeCats,
        ] = await Promise.all([
          getExpenses(user.user_id),
          getIncome(user.user_id),
          getCategories(user.user_id, "expense"),
          getCategories(user.user_id, "income"),
        ]);

        setExpenseCategories(expenseCats || []);
        setIncomeCategories(incomeCats || []);

        const safeExpenses = Array.isArray(expenseData) ? expenseData : [];
        const safeIncome = Array.isArray(incomeData) ? incomeData : [];

        const allTransactions = [
          ...safeExpenses.map((e) => ({ ...e, type: "expense" })),
          ...safeIncome.map((i) => ({ ...i, type: "income" })),
        ];

        allTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        const filtered = allTransactions.filter((item) => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getMonth() === currentDate.getMonth() &&
            itemDate.getFullYear() === currentDate.getFullYear()
          );
        });

        setTransactions(filtered);

        const expenseTotal = filtered
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        const incomeTotal = filtered
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + (item.amount || 0), 0);

        setTotalExpense(expenseTotal);
        setTotalIncome(incomeTotal);
        setBalance(incomeTotal - expenseTotal);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentDate]);

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onEnded={(event) => {
          const { translationX } = event.nativeEvent;

          if (translationX > 50) {
            goToPreviousMonth();
          } else if (translationX < -50 && !isCurrentMonth) {
            goToNextMonth();
          }
        }}
      >
        <View>
          <Text style={styles.swipeHint}>
            ← Swipe to change month →
          </Text>
          <Text style={styles.date}>{today}</Text>
        </View>
      </PanGestureHandler>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Total Balance</Text>
          <Text style={styles.balanceValue}>
            RM {balance.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rowContainer}>
          <View style={[styles.smallCard, { backgroundColor: "#ddffdd" }]}>
            <Text style={styles.cardTitle}>Income</Text>
            <Text style={styles.cardValue}>
              RM {totalIncome.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.smallCard, { backgroundColor: "#ffdddd" }]}>
            <Text style={styles.cardTitle}>Expense</Text>
            <Text style={styles.cardValue}>
              RM {totalExpense.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {!user && (
        <Text style={styles.guestText}>
          Guest Mode: Please login to add and track transactions.
        </Text>
      )}

      {/* TRANSACTIONS */}
      {transactions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Transactions</Text>

          <FlatList
            data={transactions}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/transactionDetail",
                    params: {
                      id: item.id,
                      type: item.type,
                      title: item.title,
                      amount: item.amount,
                      category: item.category,
                      date: item.date,
                    },
                  })
                }
              >
                <View
                  style={[
                    styles.transactionCard,
                    item.type === "income"
                      ? { backgroundColor: "#ddffdd" }
                      : { backgroundColor: "#ffdddd" },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={getCategoryIcon(item.category, item.type)}
                      size={22}
                      color="#555"
                    />
                    <Text style={styles.title}>{item.title}</Text>
                  </View>

                  <View>
                    <Text style={styles.amount}>RM {item.amount}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {loading && user && (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={{ marginTop: 20 }}
        />
      )}

      {!loading && user && transactions.length === 0 && (
        <Text style={styles.guestText}>
          No transactions for this month.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    padding: 20,
    backgroundColor: "#fff",
  },
  date: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  swipeHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#aaa",
  },
  summaryContainer: {
    marginBottom: 10,
  },
  balanceCard: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 14,
    color: "#666",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallCard: {
    flex: 1,
    padding: 5,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cardTitle: {
    fontSize: 14,
    color: "#555",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 12,
    color: "#777",
  },
  guestText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});