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
import { useUser } from "../../../context/UserContext";

export default function MainScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalExpense, setTotalExpense] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [balance, setBalance] = useState(0);

  // ✅ Month state
  const [currentDate, setCurrentDate] = useState(new Date());

  // ✅ Display month
  const today = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  // ✅ Navigation functions
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

  // ✅ Prevent future navigation
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() &&
    currentDate.getFullYear() === new Date().getFullYear();

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
        const [expenseData, incomeData] = await Promise.all([
          getExpenses(user.user_id),
          getIncome(user.user_id),
        ]);

        // Combine transactions
        const allTransactions = [
          ...expenseData.map((e) => ({ ...e, type: "expense" })),
          ...incomeData.map((i) => ({ ...i, type: "income" })),
        ];

        // Sort latest first
        allTransactions.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        // Filter by selected month
        const filtered = allTransactions.filter((item) => {
          const itemDate = new Date(item.date);
          return (
            itemDate.getMonth() === currentDate.getMonth() &&
            itemDate.getFullYear() === currentDate.getFullYear()
          );
        });

        setTransactions(filtered);

        // Calculate totals (filtered only)
        const expenseTotal = filtered
          .filter((item) => item.type === "expense")
          .reduce((sum, item) => sum + item.amount, 0);

        const incomeTotal = filtered
          .filter((item) => item.type === "income")
          .reduce((sum, item) => sum + item.amount, 0);

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
      <Text style={styles.date}>{today}</Text>

      {/* SUMMARY */}
      <View style={styles.summaryContainer}>
        <View style={[styles.card, { backgroundColor: "#ffdddd" }]}>
          <Text style={styles.cardTitle}>Expense</Text>
          <Text style={styles.cardValue}>RM {totalExpense.toFixed(2)}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#ddffdd" }]}>
          <Text style={styles.cardTitle}>Income</Text>
          <Text style={styles.cardValue}>RM {totalIncome.toFixed(2)}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: "#dde7ff" }]}>
          <Text style={styles.cardTitle}>Balance</Text>
          <Text style={styles.cardValue}>RM {balance.toFixed(2)}</Text>
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
                  <View>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.category}>{item.category}</Text>
                  </View>

                  <View>
                    <Text style={styles.amount}>RM {item.amount}</Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* MONTH NAVIGATION */}
          <View style={styles.monthButtonContainer}>
            <TouchableOpacity style={styles.monthButton} onPress={goToPreviousMonth}>
              <Text style={styles.monthButtonText}>⬅ Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.monthButton,
                isCurrentMonth && { backgroundColor: "#ccc" },
              ]}
              onPress={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <Text style={styles.monthButtonText}>Next ➡</Text>
            </TouchableOpacity>
          </View>
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
        <>
          <Text style={styles.guestText}>
            No transactions for this month.
          </Text>

          {/* STILL ALLOW NAVIGATION */}
          <View style={styles.monthButtonContainer}>
            <TouchableOpacity style={styles.monthButton} onPress={goToPreviousMonth}>
              <Text style={styles.monthButtonText}>⬅ Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.monthButton,
                isCurrentMonth && { backgroundColor: "#ccc" },
              ]}
              onPress={goToNextMonth}
              disabled={isCurrentMonth}
            >
              <Text style={styles.monthButtonText}>Next ➡</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },

  date: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },

  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  card: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },

  cardTitle: { fontSize: 14, color: "#555" },
  cardValue: { fontSize: 20, fontWeight: "bold" },

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
  },

  title: { fontSize: 16, fontWeight: "bold" },
  category: { color: "#666" },
  amount: { fontSize: 16, fontWeight: "bold" },
  dateText: { fontSize: 12, color: "#777" },

  guestText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },

  monthButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },

  monthButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },

  monthButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});