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
import { getMonthlyBudget } from "../../../api/budgetApi";
import { getBudgets } from "../../../api/budgetApi";
import { useRouter } from "expo-router";
import BackgroundWrapper from "../../../components/backgroundWrapper";


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

  const [monthlyBudget, setMonthlyBudget] = useState(0);

  // const monthlyExpenses = expenses;
  // const monthlyRemaining =
  //   monthlyBudget > 0 ? monthlyBudget - monthlyExpenses : 0;

  // const monthlyPercentage =
  //   monthlyBudget > 0 ? (monthlyRemaining / monthlyBudget) * 100 : 0;
  
  const monthlyExpenseTotal = expenses || 0;

  const monthlyRemaining =
    monthlyBudget > 0 ? monthlyBudget - monthlyExpenseTotal : 0;

  const monthlyPercentage =
    monthlyBudget > 0
      ? (monthlyRemaining / monthlyBudget) * 100
      : 0;


  
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
      const categoryBudget = budgetsData.reduce((sum, b) => sum + b.budget, 0);
      const categoryRemaining = budgetsData.reduce((sum, b) => sum + b.remaining, 0);
      // const res = await getMonthlyBudget(
      //   user.user_id,
      //   currentMonth + 1,
      //   currentYear
      // );

      // const data = res.data?.[0]; // single record

      // const mBudget = data ? Number(data.amount) : 0;

      // setMonthlyBudget(mBudget);

      setBudget(categoryBudget);
      setRemaining(categoryRemaining);


      // MONTHLY BUDGET (NEW)
      const res = await getMonthlyBudget(
        user.user_id,
        currentMonth + 1,
        currentYear
      );

      console.log("MONTHLY BUDGET API:", res.data);

      let mBudget = 0;

      // case 1: array response
      if (Array.isArray(res.data) && res.data.length > 0) {
        mBudget = Number(res.data[0].amount || 0);
      }

      // case 2: object response
      else if (res.data && typeof res.data === "object") {
        mBudget = Number(res.data.amount || 0);
      }

      setMonthlyBudget(mBudget);

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
  const percentage = budget > 0 ? (remaining / budget) * 100 : 0;
  const monthName = currentDate.toLocaleString("default", { month: "short" });
  const budgetExpenses = budget - remaining;


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

    const goToSetMonthlyBudget = () => {
      if (!user) return;
      router.push({
        pathname: "/setMonthlyBudget",
        params: { user_id: user.user_id },
      });
    };

  return (
    <BackgroundWrapper>
      <ScrollView style={styles.container}>
        
        {/* ✅ GUEST MODE */}
        {!user && (
          <Text style={styles.guestText}>
            Guest Mode: Please login to view your financial report.
          </Text>
        )}

        {/* USER MODE */}
        {user && (
          <>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginTop: 20 }}
              />
            ) : (
              <>
                {/* Monthly Statistic */}
                <TouchableOpacity onPress={goToMonthlyStatistic} activeOpacity={0.7}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Monthly Statistic</Text>

                    <View style={styles.row}>
                      <Text style={styles.month}>{monthName}</Text>

                      <View style={styles.statsRow}>
                        <Text>Expenses{"\n"}RM {expenses.toFixed(2)}</Text>
                        <Text>Income{"\n"}RM {income.toFixed(2)}</Text>
                        <Text>Balance{"\n"}RM {balance.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Monthly Budget */}
                <TouchableOpacity onPress={goToMonthlyBudget} activeOpacity={0.7}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Budget Overview</Text>

                    <View style={styles.budgetContainer}>
                      <View
                        style={[
                          styles.circle,
                          {
                            borderColor: remaining < 0 ? "#f05850c4" : "#007AFF",
                          },
                        ]}
                      >
                        {remaining < 0 ? (
                          <Text style={{ color: "#f05850c4", fontWeight: "bold", fontSize: 11 }}>
                            EXCEED
                          </Text>
                        ) : (
                          <>
                            <Text style={{ fontSize: 12, color: "#555" }}>
                              Remaining
                            </Text>

                            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                              {percentage.toFixed(0)}%
                            </Text>
                          </>
                        )}
                      </View>

                      <View>
                        <Text>Remaining: RM {remaining.toFixed(2)}</Text>
                        <Text>Budget: RM {budget.toFixed(2)}</Text>
                        <Text>Expenses: RM {budgetExpenses.toFixed(2)}</Text>                      
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Monthly Budget */}
                <TouchableOpacity onPress={goToSetMonthlyBudget} activeOpacity={0.7}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>Monthly Budget</Text>

                    <View style={styles.budgetContainer}>
                      <View
                        style={[
                          styles.circle,
                          {
                            borderColor:
                              monthlyBudget > 0 && monthlyRemaining < 0
                                ? "#f05850c4"
                                : "#007AFF",
                          },
                        ]}
                      >
                        {monthlyBudget === 0 ? (
                          <Text style={{ fontSize: 11, color: "#555" }}>
                            SET
                          </Text>
                        ) : monthlyRemaining < 0 ? (
                          <Text
                            style={{
                              color: "#f05850c4",
                              fontWeight: "bold",
                              fontSize: 11,
                            }}
                          >
                            EXCEED
                          </Text>
                        ) : (
                          <>
                            <Text style={{ fontSize: 12, color: "#555" }}>
                              Remaining
                            </Text>

                            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                              {monthlyPercentage.toFixed(0)}%
                            </Text>
                          </>
                        )}
                      </View>

                      <View>
                        <Text>Budget: RM {monthlyBudget.toFixed(2)}</Text>
                        <Text>Expenses: RM {monthlyExpenseTotal.toFixed(2)}</Text>
                        <Text>Remaining: RM {monthlyRemaining.toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  // 📦 Layout
  container: {
    flex: 1,
  },

  guestText: {
    textAlign: "center",
    marginTop: 20,
    marginBottom: 10,
    fontSize: 14,
    color: "#333",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  statsRow: {
    flexDirection: "row",
    gap: 20,
  },

  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 20,
  },

  sectionBox: {
    borderWidth: 1,
    borderColor: "#a3d2fe",
    backgroundColor: "#ffffff71",
    borderRadius: 10,
    paddingTop: 0,
    padding: 15,
    marginTop: 15,
  },

  // 📝 Text
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,

  },

  month: {
    fontSize: 18,
    fontWeight: "bold",
  },

  circleText: {
    fontWeight: "bold",
  },

  // 🎯 Components
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});