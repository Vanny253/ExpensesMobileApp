import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { getIncome } from "../../api/expenseApi"; // <-- use your income API

interface Income {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export default function IncomeScreen() {
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const data = await getIncome(); // <-- fetch income table
        setIncomeList(data);
      } catch (err) {
        console.error("Failed to fetch income", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Income</Text>

      <FlatList
        data={incomeList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
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

  card: {
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