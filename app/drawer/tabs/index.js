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

  const today = new Date().toDateString();

  useEffect(() => {
    if (!user) {
      // Guest mode
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
        // Fetch both expense and income
        const [expenseData, incomeData] = await Promise.all([
          getExpenses(user.user_id),
          getIncome(user.user_id),
        ]);

        // Combine and mark type for coloring
        const allTransactions = [
          ...expenseData.map((e) => ({ ...e, type: "expense" })),
          ...incomeData.map((i) => ({ ...i, type: "income" })),
        ];

        // Sort by date descending (latest first)
        allTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setTransactions(allTransactions);

        // Calculate totals
        const expenseTotal = expenseData.reduce((sum, item) => sum + item.amount, 0);
        const incomeTotal = incomeData.reduce((sum, item) => sum + item.amount, 0);

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
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.date}>{today}</Text>

      {/* SUMMARY CARDS */}
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

      {/* ALL TRANSACTIONS */}
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
        </>
      )}

      {loading && user && (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      )}

      {!loading && user && transactions.length === 0 && (
        <Text style={styles.guestText}>No transactions yet. Add new transactions!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  date: { fontSize: 18, color: "#666", marginBottom: 10 },
  summaryContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  card: { flex: 1, padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: "center" },
  cardTitle: { fontSize: 14, color: "#555" },
  cardValue: { fontSize: 20, fontWeight: "bold" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
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
  guestText: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#666" },
});