// app/reportMonthlyStatistic.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useUser } from "../context/UserContext";
import { getExpenses, getIncome } from "../api/expenseApi";
import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";

export default function ReportMonthlyStatistic() {
  const { user } = useUser();

  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllMonthsStatistics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allExpenses = await getExpenses(user.user_id);
      const allIncome = await getIncome(user.user_id);

      // Combine all months in an object
      const monthsMap = {};

      // Process expenses
      allExpenses.forEach((e) => {
        const date = new Date(e.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`; // YYYY-M
        if (!monthsMap[key]) monthsMap[key] = { expenses: 0, income: 0 };
        monthsMap[key].expenses += e.amount;
      });

      // Process income
      allIncome.forEach((i) => {
        const date = new Date(i.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthsMap[key]) monthsMap[key] = { expenses: 0, income: 0 };
        monthsMap[key].income += i.amount;
      });

      // Convert map to array and sort by date descending
      const monthlyArray = Object.keys(monthsMap)
        .map((key) => {
          const [year, month] = key.split("-").map(Number);
          const expenses = monthsMap[key].expenses;
          const income = monthsMap[key].income;
          return {
            year,
            month,
            expenses,
            income,
            balance: income - expenses,
          };
        })
        .sort((a, b) => new Date(b.year, b.month) - new Date(a.year, a.month));

      setMonthlyData(monthlyArray);
    } catch (err) {
      console.log("Monthly Statistic Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAllMonthsStatistics();
  }, [user]);

  return (
      
    <View style={{ flex: 1 }}>
      
      <AppHeader
        title="Monthly Statistic"
        backRoute="/drawer/tabs/report"
      />

        <BackgroundWrapper>
      <ScrollView style={styles.container}>

          <View style={styles.contentContainer}>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#007AFF"
                style={{ marginTop: 20 }}
              />
            ) : (
              monthlyData.map((monthData) => {
                const monthName = new Date(
                  monthData.year,
                  monthData.month
                ).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                });

                return (
                  <View
                    key={`${monthData.year}-${monthData.month}`}
                    style={styles.statsContainer}
                  >
                    <Text style={styles.monthLabel}>{monthName}</Text>
                    <Text style={styles.statText}>
                      Expenses: RM {monthData.expenses.toFixed(2)}
                    </Text>
                    <Text style={styles.statText}>
                      Income: RM {monthData.income.toFixed(2)}
                    </Text>
                    <Text style={styles.statText}>
                      Balance: RM {monthData.balance.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}

          </View>

      </ScrollView>
        </BackgroundWrapper>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    paddingTop: 80,
  },

  statsContainer: {
    padding: 20,
    backgroundColor: "#ffffff71",
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",

    borderRadius: 10,
    marginBottom: 15,
  },
  monthLabel: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  statText: { fontSize: 16, marginBottom: 5 },
});