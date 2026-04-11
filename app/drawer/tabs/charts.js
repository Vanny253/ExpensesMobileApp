import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useUser } from "../../../context/UserContext";
import { getExpenses } from "../../../api/expenseApi";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import {
  DEFAULT_EXPENSE_CATEGORIES,
} from "../../../components/defaultIcon";

const screenWidth = Dimensions.get("window").width;

const colors = [
  "#FF6384", "#36A2EB", "#FFCE56", "#8A2BE2", "#FF7F50",
  "#20B2AA", "#FF69B4", "#CD5C5C", "#87CEEB", "#32CD32",
];

export default function ChartScreen() {
  const { user } = useUser();

  const [timeframe, setTimeframe] = useState("month");
  const [subPeriod, setSubPeriod] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [subPeriodsList, setSubPeriodsList] = useState([]);

  /* ---------------- ICON HELPER ---------------- */
  const getCategoryIcon = (name) => {
    const found = DEFAULT_EXPENSE_CATEGORIES.find(
      (c) => c.name === name
    );
    return found?.icon || "help-circle";
  };

  /* ---------------- TIME HELPERS ---------------- */
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

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const expenses = await getExpenses(user.user_id);
        const now = new Date();

        const filtered = expenses.filter((item) => {
          const date = new Date(item.date);
          const month = now.getMonth() - subPeriod;

          return (
            date.getMonth() === month &&
            date.getFullYear() === now.getFullYear()
          );
        });

        const categoryMap = {};

        filtered.forEach((item) => {
          if (!categoryMap[item.category]) {
            categoryMap[item.category] = 0;
          }
          categoryMap[item.category] += item.amount;
        });

        const chartData = Object.keys(categoryMap).map((cat, index) => ({
          name: cat,
          population: categoryMap[cat],
          color: colors[index % colors.length],
        }));

        setCategoryData(chartData);
      } catch (err) {
        console.error("Failed to fetch expenses for chart", err);
      }
    };

    fetchData();
  }, [user, subPeriod]);

  const totalAmount = categoryData.reduce(
    (sum, item) => sum + item.population,
    0
  );

  return (
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
          chartConfig={{
            color: () => "#000",
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* PROGRESS BAR LIST */}
      <View style={styles.progressContainer}>
        {categoryData.map((item, index) => {
          const percentage =
            totalAmount > 0
              ? (item.population / totalAmount) * 100
              : 0;

          return (
            <View key={index} style={styles.progressItem}>

              {/* HEADER */}
              <View style={styles.progressHeader}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name={getCategoryIcon(item.name)}
                    size={18}
                    color="#007AFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.progressLabel}>
                    {item.name}
                  </Text>
                </View>

                <Text style={styles.progressValue}>
                  RM {item.population.toFixed(2)} ({percentage.toFixed(1)}%)
                </Text>
              </View>

              {/* BAR */}
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

            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
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
    borderColor: "#888",
    marginRight: 8,
  },

  activeSubButton: {
    backgroundColor: "#007AFF",
  },

  subButtonText: {
    color: "#555",
    fontSize: 13,
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