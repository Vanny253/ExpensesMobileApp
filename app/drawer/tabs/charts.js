import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getCategories } from "../../../api/categoryApi";
import { getExpenses } from "../../../api/expenseApi";
import BackgroundWrapper from "../../../components/backgroundWrapper";
import { DEFAULT_EXPENSE_CATEGORIES } from "../../../components/defaultIcon";
import { useUser } from "../../../context/UserContext";

const screenWidth = Dimensions.get("window").width;

const colors = [
  "#FF6384", "#36A2EB", "#FFCE56", "#8A2BE2", "#FF7F50",
  "#20B2AA", "#FF69B4", "#CD5C5C", "#87CEEB", "#32CD32",
];

export default function ChartScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [timeframe, setTimeframe] = useState("month");
  const [subPeriod, setSubPeriod] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [subPeriodsList, setSubPeriodsList] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // ✅ FIXED resolver
  const resolveCategory = (value, categoriesList) => {
    if (!value) return null;

    const list = [
      ...(DEFAULT_EXPENSE_CATEGORIES || []),
      ...(categoriesList || []),
    ];

    return list.find((c) => {
      const id = String(c.id ?? c.category_id ?? c._id ?? "").trim();
      const name = (c.name || c.category_name || "").toLowerCase();

      return (
        id === String(value).trim() ||
        name === String(value).toLowerCase()
      );
    });
  };

  const getMonthLabel = (monthsAgo = 0) => {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() - monthsAgo);
    return month.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const generateSubPeriods = () => {
    const labels = [];
    for (let i = 0; i < 4; i++) {
      labels.push(getMonthLabel(i));
    }
    setSubPeriodsList(labels);
    setSubPeriod(0);
  };

  useEffect(() => {
    generateSubPeriods();
  }, [timeframe]);

  // ✅ 1. Fetch categories ONCE
  useEffect(() => {
    if (!user) return;

    const fetchCategories = async () => {
      try {
        const cats = await getCategories(user.user_id, "expense");
        setExpenseCategories(cats || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCategories();
  }, [user]);

  // ✅ 2. Fetch expenses when needed
  useEffect(() => {
    if (!user) return;

    const fetchExpenses = async () => {
      try {
        const data = await getExpenses(user.user_id);
        setExpenses(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchExpenses();
  }, [user, subPeriod]);

  // ✅ 3. Process chart AFTER both are ready
  useEffect(() => {
    if (!expenses.length) return;

    const now = new Date();
    const month = now.getMonth() - subPeriod;

    const filtered = expenses.filter((item) => {
      const date = new Date(item.date);
      return (
        date.getMonth() === month &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const categoryMap = {};

    filtered.forEach((item) => {
      const key =
        typeof item.category === "object"
          ? String(
              item.category.id ??
              item.category._id ??
              item.category.name
            )
          : String(item.category);

      if (!categoryMap[key]) categoryMap[key] = 0;
      categoryMap[key] += item.amount;
    });

    const chartData = Object.keys(categoryMap).map((cat, index) => {
      const resolved = resolveCategory(cat, expenseCategories);

      return {
        key: cat,
        name: resolved?.name || resolved?.category_name || "Unknown Category",
        icon: resolved?.icon || "help-circle",
        population: categoryMap[cat],
        color: colors[index % colors.length],
      };
    });

    setCategoryData(chartData);

  }, [expenses, expenseCategories, subPeriod]);

  const totalAmount = categoryData.reduce(
    (sum, item) => sum + item.population,
    0
  );

  return (
    <BackgroundWrapper>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* TOP BAR */}
          <View style={styles.topBar}>
            {["week", "month", "year"].map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.topButton,
                  timeframe === tf && styles.activeTopButton,
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text
                  style={[
                    styles.topButtonText,
                    timeframe === tf && styles.activeTopText,
                  ]}
                >
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SUB BAR */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subPeriodsList.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subButton,
                  subPeriod === index && styles.activeSubButton,
                ]}
                onPress={() => setSubPeriod(index)}
              >
                <Text
                  style={[
                    styles.subButtonText,
                    subPeriod === index && styles.activeSubText,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {!user && (
            <Text style={styles.guestText}>
              Guest Mode: Please login to view expense analytics.
            </Text>
          )}

          {/* PIE CHART */}
          <View style={styles.chartWrapper}>
            <PieChart
              data={categoryData.map((c) => ({
                name: c.name,
                population: c.population,
                color: c.color,
                legendFontColor: "#333",
                legendFontSize: 14,
              }))}
              width={screenWidth - 40}
              height={220}
              chartConfig={{ color: () => "#000" }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>

          {/* PROGRESS LIST */}
          <View style={styles.progressContainer}>
            {categoryData.map((item, index) => {
              const percentage =
                totalAmount > 0
                  ? (item.population / totalAmount) * 100
                  : 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.progressItem}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: "/chartProgressBar",
                      params: {
                        category: item.key,
                        name: item.name,
                        month: subPeriod,
                      },
                    })
                  }
                >
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>{item.name}</Text>
                    <Text style={styles.progressValue}>
                      RM {item.population.toFixed(2)} ({percentage.toFixed(1)}%)
                    </Text>
                  </View>

                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },

  container: {
    paddingTop: 20,
    paddingHorizontal: 25,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },

  topButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
  },

  activeTopButton: {
    backgroundColor: "#007AFF",
  },

  topButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
  },

  activeTopText: {
    color: "#fff",
  },

  subButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginRight: 8,
  },

  activeSubButton: {
    backgroundColor: "#007AFF",
  },

  subButtonText: {
    color: "#007AFF",
    fontSize: 13,
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
    overflow: "hidden",
  },

  activeSubText: {
    color: "#fff",
  },

  chartWrapper: {
    alignItems: "center",
    marginTop: 20,
  },

  progressContainer: {
    marginTop: 20,
  },

  progressItem: {
    marginBottom: 12,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
  },

  progressValue: {
    fontSize: 13,
    color: "#555",
  },

  progressBarBackground: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 5,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
});