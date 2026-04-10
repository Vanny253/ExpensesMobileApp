// app/drawer/tabs/report.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useUser } from "../../../context/UserContext";
import { getExpenses, getIncome } from "../../../api/expenseApi";
import { getBudgets } from "../../../api/budgetApi";
import { useRouter } from "expo-router";

export default function ReportScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [expenses, setExpenses] = useState(0);
  const [income, setIncome] = useState(0);
  const [budget, setBudget] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const fetchReport = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch expenses
      const allExpenses = await getExpenses(user.user_id);
      const monthlyExpenses = allExpenses.filter((e) => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      setExpenses(totalExpenses);

      // Fetch income
      const allIncome = await getIncome(user.user_id);
      const monthlyIncome = allIncome.filter((i) => {
        const date = new Date(i.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const totalIncome = monthlyIncome.reduce((sum, i) => sum + i.amount, 0);
      setIncome(totalIncome);

      // Fetch budgets
      const budgetsData = await getBudgets(user.user_id);
      const monthlyBudget = budgetsData.reduce((sum, b) => sum + b.budget, 0);
      const monthlyRemaining = budgetsData.reduce((sum, b) => sum + b.remaining, 0);

      setBudget(monthlyBudget);
      setRemaining(monthlyRemaining);
    } catch (err) {
      console.log("Report Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReport();
  }, [user]);

  const balance = income - expenses;
  const percentage = budget > 0 ? (expenses / budget) * 100 : 0;
  const monthName = currentDate.toLocaleString("default", { month: "short" });

  // Navigate to reportMonthlyStatistic page
  const goToMonthlyStatistic = () => {
    if (!user) return;
    router.push({
      pathname: "/reportMonthlyStatistic",
      params: { user_id: user.user_id },
    });
  };

  // Navigate to reportMonthlyBudget page
  const goToMonthlyBudget = () => {
    if (!user) return;
    router.push({
      pathname: "/reportMonthlyBudget",
      params: { user_id: user.user_id },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <>
          {/* Monthly Statistic */}
          <TouchableOpacity onPress={goToMonthlyStatistic} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>Monthly Statistic</Text>
            <View style={styles.row}>
              <Text style={styles.month}>{monthName}</Text>
              <View style={styles.statsRow}>
                <Text>Expenses{"\n"}RM {expenses.toFixed(2)}</Text>
                <Text>Income{"\n"}RM {income.toFixed(2)}</Text>
                <Text>Balance{"\n"}RM {balance.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Monthly Budget */}
          <TouchableOpacity onPress={goToMonthlyBudget} activeOpacity={0.7}>
            <Text style={styles.sectionTitle}>Monthly Budget</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>{percentage.toFixed(0)}%</Text>
              </View>
              <View>
                <Text>Remaining: RM {remaining.toFixed(2)}</Text>
                <Text>Budget: RM {budget.toFixed(2)}</Text>
                <Text>Expenses: RM {expenses.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  month: { fontSize: 18, fontWeight: "bold" },
  statsRow: { flexDirection: "row", gap: 20 },
  budgetContainer: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 20 },
  circle: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, justifyContent: "center", alignItems: "center" },
  circleText: { fontWeight: "bold" },
});