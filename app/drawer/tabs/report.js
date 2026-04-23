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
import Svg, { Circle } from "react-native-svg";

export default function ReportScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [expenses, setExpenses] = useState(0);
  const [income, setIncome] = useState(0);

  // 🟦 Budget Overview (category-based)
  const [categoryBudgetTotal, setBudget] = useState(0);
  const [categoryBudgetRemaining, setRemaining] = useState(0);

  const [loading, setLoading] = useState(true);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // 🟩 Monthly Budget (user limit)
  const [monthlyBudgetLimit, setMonthlyBudget] = useState(0);

  // monthly expenses (this month only)
  const monthlySpent = expenses || 0;

  const monthlyBudgetRemaining =
    monthlyBudgetLimit > 0 ? monthlyBudgetLimit - monthlySpent : 0;

  const monthlyPercentage =
    monthlyBudgetLimit > 0
      ? (monthlyBudgetRemaining / monthlyBudgetLimit) * 100
      : 0;

  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress =
    monthlyBudgetLimit > 0
      ? Math.min(
          Math.max(
            ((monthlyBudgetLimit - monthlySpent) / monthlyBudgetLimit) * 100,
            0
          ),
          100
        )
      : 0;

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  const fetchReport = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const allExpenses = await getExpenses(user.user_id);
      const monthlyExpenses = allExpenses.filter((e) => {
        const date = new Date(e.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      });

      const totalExpenses = monthlyExpenses.reduce(
        (sum, e) => sum + e.amount,
        0
      );
      setExpenses(totalExpenses);

      const allIncome = await getIncome(user.user_id);
      const monthlyIncome = allIncome.filter((i) => {
        const date = new Date(i.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      });

      const totalIncome = monthlyIncome.reduce(
        (sum, i) => sum + i.amount,
        0
      );
      setIncome(totalIncome);

      // 🟦 Budget Overview (category budgets)
      const budgetsData = await getBudgets(user.user_id);

      const categoryBudget = budgetsData.reduce(
        (sum, b) => sum + b.budget,
        0
      );

      const categoryRemaining = budgetsData.reduce(
        (sum, b) => sum + b.remaining,
        0
      );

      setBudget(categoryBudget);
      setRemaining(categoryRemaining);

      // 🟩 Monthly Budget (limit)
      const res = await getMonthlyBudget(
        user.user_id,
        currentMonth + 1,
        currentYear
      );

      let mBudget = 0;

      if (Array.isArray(res.data) && res.data.length > 0) {
        mBudget = Number(res.data[0].amount || 0);
      } else if (res.data && typeof res.data === "object") {
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

  const categoryBudgetSpent =
    categoryBudgetTotal - categoryBudgetRemaining;

  const monthName = currentDate.toLocaleString("default", {
    month: "short",
  });

  // NAVIGATION
  const goToMonthlyStatistic = () => {
    if (!user) return;
    router.push({
      pathname: "/reportMonthlyStatistic",
      params: { user_id: user.user_id },
    });
  };

  const goToBudgetOverview = () => {
    if (!user) return;
    router.push({
      pathname: "/reportBudgetOverview",
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

        {!user && (
          <Text style={styles.guestText}>
            Guest Mode: Please login to view your financial report.
          </Text>
        )}

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
                {/* MONTHLY STATISTIC */}
                <TouchableOpacity onPress={goToMonthlyStatistic}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>
                      Monthly Statistic
                    </Text>

                    <View style={styles.row}>
                      <Text style={styles.month}>{monthName}</Text>

                      <View style={styles.statsRow}>
                        <Text>
                          Expenses{"\n"}RM {expenses.toFixed(2)}
                        </Text>
                        <Text>
                          Income{"\n"}RM {income.toFixed(2)}
                        </Text>
                        <Text>
                          Balance{"\n"}RM {balance.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* BUDGET OVERVIEW (CATEGORY) */}
                <TouchableOpacity onPress={goToBudgetOverview}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>
                      Budget Overview (Categories)
                    </Text>

                    <View style={styles.budgetContainer}>
                      <View
                        style={{
                          width: size,
                          height: size,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Svg width={size} height={size}>
                          {/* BACKGROUND RING */}
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#eee"
                            strokeWidth={strokeWidth}
                            fill="none"
                          />

                          {/* PROGRESS RING */}
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={
                              categoryBudgetRemaining < 0
                                ? "#f05850c4" // 🔴 EXCEED RED
                                : "#007AFF"   // 🔵 NORMAL BLUE
                            }
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={
                              categoryBudgetTotal > 0
                                ? circumference -
                                  ((categoryBudgetRemaining < 0
                                    ? 100
                                    : (categoryBudgetRemaining / categoryBudgetTotal) * 100) /
                                      100) *
                                    circumference
                                : circumference
                            }
                            strokeLinecap="round"
                            rotation="-90"
                            originX={size / 2}
                            originY={size / 2}
                          />
                        </Svg>

                        {/* CENTER TEXT */}
                        <View style={{ position: "absolute", alignItems: "center" }}>
                          {categoryBudgetRemaining < 0 ? (
                            <Text style={{ color: "#f05850c4", fontWeight: "bold" }}>
                              EXCEED
                            </Text>
                          ) : (
                            <>
                              <Text style={{ fontSize: 12 }}>Remaining</Text>
                              <Text style={{ fontWeight: "bold" }}>
                                {categoryBudgetTotal > 0
                                  ? (
                                      (categoryBudgetRemaining / categoryBudgetTotal) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                      <View>
                        <Text>
                          Remaining: RM {categoryBudgetRemaining.toFixed(2)}
                        </Text>
                        <Text>
                          Budget: RM {categoryBudgetTotal.toFixed(2)}
                        </Text>
                        <Text>
                          Expenses: RM {categoryBudgetSpent.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* MONTHLY BUDGET (LIMIT) */}
                <TouchableOpacity onPress={goToSetMonthlyBudget}>
                  <View style={styles.sectionBox}>
                    <Text style={styles.sectionTitle}>
                      Monthly Budget (Limit)
                    </Text>

                    <View style={styles.budgetContainer}>
                      <View
                        style={{
                          width: size,
                          height: size,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Svg width={size} height={size}>
                          {/* BACKGROUND RING */}
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#eee"
                            strokeWidth={strokeWidth}
                            fill="none"
                          />

                          {/* PROGRESS RING */}
                          <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={
                              monthlyBudgetRemaining < 0
                                ? "#f05850c4" // 🔴 EXCEED RED
                                : "#007AFF"   // 🔵 NORMAL BLUE
                            }
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={
                              monthlyBudgetLimit > 0
                                ? circumference -
                                  ((monthlyBudgetRemaining < 0
                                    ? 100
                                    : (monthlyBudgetRemaining / monthlyBudgetLimit) * 100) /
                                      100) *
                                    circumference
                                : circumference
                            }
                            strokeLinecap="round"
                            rotation="-90"
                            originX={size / 2}
                            originY={size / 2}
                          />
                        </Svg>

                        {/* CENTER TEXT */}
                        <View style={{ position: "absolute", alignItems: "center" }}>
                          {monthlyBudgetLimit === 0 ? (
                            <Text>SET</Text>
                          ) : monthlyBudgetRemaining < 0 ? (
                            <Text style={{ color: "#f05850c4", fontWeight: "bold" }}>
                              EXCEED
                            </Text>
                          ) : (
                            <>
                              <Text style={{ fontSize: 12 }}>Remaining</Text>
                              <Text style={{ fontWeight: "bold" }}>
                                {monthlyPercentage.toFixed(0)}%
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                      <View>
                        <Text>
                          Budget: RM {monthlyBudgetLimit.toFixed(2)}
                        </Text>
                        <Text>
                          Expenses: RM {monthlySpent.toFixed(2)}
                        </Text>
                        <Text>
                          Remaining: RM {monthlyBudgetRemaining.toFixed(2)}
                        </Text>
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