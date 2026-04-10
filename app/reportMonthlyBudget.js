// app/reportMonthlyBudget.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // ✅ Correct import
import { useUser } from "../context/UserContext";
import { getMonthlyBudgets } from "../api/reportApi";

export default function ReportMonthlyBudget() {
  const { user } = useUser();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const YEARS = [2023, 2024, 2025, 2026];

  const loadBudgets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getMonthlyBudgets(user.user_id, selectedMonth, selectedYear);
      setBudgets(data);
    } catch (err) {
      console.error("Error fetching monthly budgets:", err);
      Alert.alert(
        "Error",
        "Failed to load monthly budgets. Please check your server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [user, selectedMonth, selectedYear]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Monthly Budget Report</Text>

        {/* Month Picker */}
        <Text style={styles.label}>Month</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={(val) => setSelectedMonth(val)}
          >
            {MONTHS.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} />
            ))}
          </Picker>
        </View>

        {/* Year Picker */}
        <Text style={styles.label}>Year</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={(val) => setSelectedYear(val)}
          >
            {YEARS.map((y) => (
              <Picker.Item key={y} label={y.toString()} value={y} />
            ))}
          </Picker>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                No budgets for this month.
              </Text>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.category}>{item.category}</Text>
                <Text>Budget: RM{item.budget.toFixed(2)}</Text>
                <Text>Spent: RM{item.spent.toFixed(2)}</Text>
                <Text>Remaining: RM{item.remaining.toFixed(2)}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: "bold" },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  category: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
});