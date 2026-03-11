import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { getExpenses } from "../../../api/expenseApi";
import { useUser } from "../../../context/UserContext";

interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function ExpensesScreen() {
  const { user } = useUser(); // <-- get logged-in user
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // <-- wait until user exists
    const fetchExpenses = async () => {
      try {
        const data = await getExpenses(user.user_id); // <-- pass user_id
        setExpenses(data);
      } catch (err) {
        console.error("Failed to fetch expenses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [user]); // <-- re-run when user changes (e.g., after login)

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Expenses</Text>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.expenseCard}>
            <Text>Title: {item.title}</Text>
            <Text>Amount: RM {item.amount}</Text>
            <Text>Category: {item.category}</Text>
            <Text>Date: {item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },

  expenseCard: {
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});