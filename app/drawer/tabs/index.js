import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { getCategories } from "../../../api/categoryApi";
import { getExpenses, getIncome } from "../../../api/expenseApi";
import BackgroundWrapper from "../../../components/backgroundWrapper";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../../../components/defaultIcon";
import { useUser } from "../../../context/UserContext";

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

  /* ---------------- CATEGORY RESOLVER (FIXED) ---------------- */
  const resolveCategory = (value, type) => {
    if (!value) return null;

    const list =
      type === "income"
        ? [...DEFAULT_INCOME_CATEGORIES, ...incomeCategories]
        : [...DEFAULT_EXPENSE_CATEGORIES, ...expenseCategories];

    // 1. match by ID ONLY (main rule)
    let found = list.find((c) => String(c.id) === String(value));

    // 2. fallback ONLY for old NAME data
    if (!found) {
      found = list.find(
        (c) =>
          c.name?.toLowerCase() === String(value).toLowerCase()
      );
    }

    return found;
  };


  const getCategoryIcon = (categoryValue, type) => {
    return resolveCategory(categoryValue, type)?.icon || "help-circle";
  };

  const getCategoryName = (categoryValue, type) => {
    return resolveCategory(categoryValue, type)?.name || "Unknown";
  };

  /* ---------------- FETCH DATA ---------------- */
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
        const [expenseData, incomeData, expenseCats, incomeCats] =
          await Promise.all([
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

        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

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
    <BackgroundWrapper>
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
          <Text style={styles.swipeHint}>← Swipe to change month →</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
      </PanGestureHandler>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <ImageBackground
          source={require("../../../assets/balanceCard1.png")}
          style={styles.balanceCard}
          imageStyle={{ borderRadius: 14 }}
        >
          <Text style={styles.balanceTitle}>Total Balance</Text>

          <Text style={styles.balanceValue}>RM {balance.toFixed(2)}</Text>

          <View style={styles.rowContainer}>
            <View style={[styles.smallCard, { backgroundColor: "#ddffdd" }]}>
              <Text style={styles.cardTitle}>Income</Text>
              <Text style={styles.cardValue}>
                RM {totalIncome.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.smallCard, { backgroundColor: "#fae8e8" }]}>
              <Text style={styles.cardTitle}>Expense</Text>
              <Text style={styles.cardValue}>
                RM {totalExpense.toFixed(2)}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* GUEST */}
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
                <View style={styles.transactionCard}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={getCategoryIcon(item.category, item.type)}
                      size={22}
                      color="#555"
                    />
                    <Text style={styles.title}>
                      {getCategoryName(item.category, item.type)}
                    </Text>
                  </View>

                  <View>
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
    </BackgroundWrapper>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  swipeHint: {
    textAlign: "center",
    fontSize: 12,
    color: "#928b9e",
  },
  date: {
    fontSize: 18,
    color: "#404041",
    marginBottom: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  summaryContainer: {
    marginBottom: 3,
  },
  balanceCard: {
    backgroundColor: "#b3d0ec",
    padding: 8,
    paddingBottom: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "rgba(178, 175, 175, 0.4)",
  },
  balanceTitle: {
    fontSize: 14,
    color: "#515151",

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
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
  },
  cardTitle: {
    fontSize: 14,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    marginBottom: 8,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    backgroundColor: "#ffffff71",
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
    color: "#333",
  },
});