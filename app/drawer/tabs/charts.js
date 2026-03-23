import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from "react-native";
import { useUser } from "../../../context/UserContext";
import { getExpenses } from "../../../api/expenseApi";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

const colors = [
  "#FF6384", "#36A2EB", "#FFCE56", "#8A2BE2", "#FF7F50",
  "#20B2AA", "#FF69B4", "#CD5C5C", "#87CEEB", "#32CD32",
];

export default function ChartScreen() {
  const { user } = useUser();
  const [timeframe, setTimeframe] = useState("month"); // week, month, year
  const [subPeriod, setSubPeriod] = useState(0);
  const [categoryData, setCategoryData] = useState([]);
  const [subPeriodsList, setSubPeriodsList] = useState([]);

  // Helper functions
  const getWeekRange = (weeksAgo = 0) => {
    const now = new Date();
    const day = now.getDay(); // Sunday = 0
    const start = new Date(now);
    start.setDate(now.getDate() - day - 7 * weeksAgo);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} - ${end.toLocaleDateString("en-US", options)}`;
  };

  const getMonthLabel = (monthsAgo = 0) => {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() - monthsAgo);
    return month.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const getYearLabel = (yearsAgo = 0) => {
    const now = new Date();
    return `${now.getFullYear() - yearsAgo}`;
  };

  // Generate sub-bar labels
  const generateSubPeriods = () => {
    const labels = [];
    for (let i = 0; i < 4; i++) {
      if (timeframe === "week") labels.push(getWeekRange(i));
      else if (timeframe === "month") labels.push(getMonthLabel(i));
      else if (timeframe === "year") labels.push(getYearLabel(i));
    }
    setSubPeriodsList(labels);
    setSubPeriod(0);
  };

  useEffect(() => { generateSubPeriods(); }, [timeframe]);

  // Fetch expenses and filter by timeframe/subPeriod
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const expenses = await getExpenses(user.user_id);
        const now = new Date();

        const filtered = expenses.filter((item) => {
          const date = new Date(item.date);

          if (timeframe === "week") {
            const start = new Date();
            start.setDate(now.getDate() - now.getDay() - 7 * subPeriod);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return date >= start && date <= end;
          } else if (timeframe === "month") {
            const month = now.getMonth() - subPeriod;
            const year = now.getFullYear();
            return date.getMonth() === month && date.getFullYear() === year;
          } else if (timeframe === "year") {
            const year = now.getFullYear() - subPeriod;
            return date.getFullYear() === year;
          }
        });

        const categoryMap = {};
        filtered.forEach((item) => {
          if (!categoryMap[item.category]) categoryMap[item.category] = 0;
          categoryMap[item.category] += item.amount;
        });

        const chartData = Object.keys(categoryMap).map((cat, index) => ({
          name: cat,
          population: categoryMap[cat],
          color: colors[index % colors.length],
          legendFontColor: "#333",
          legendFontSize: 14,
        }));

        setCategoryData(chartData);
      } catch (err) {
        console.error("Failed to fetch expenses for chart", err);
      }
    };

    fetchData();
  }, [user, timeframe, subPeriod]);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        {["week", "month", "year"].map((tf) => (
          <TouchableOpacity
            key={tf}
            style={[styles.topButton, timeframe === tf && styles.activeTopButton]}
            onPress={() => setTimeframe(tf)}
          >
            <Text style={[styles.topButtonText, timeframe === tf && styles.activeTopText]}>
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sub-bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row", paddingLeft: 5 }}
      >
        {subPeriodsList.map((label, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.subButton, subPeriod === index && styles.activeSubButton]}
            onPress={() => setSubPeriod(index)}
          >
            <Text style={[styles.subButtonText, subPeriod === index && styles.activeSubText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pie Chart */}
      <View style={styles.chartWrapper}>
        <PieChart
          data={categoryData.map((c) => ({
            name: c.name,
            population: c.population,
            color: c.color,
            legendFontColor: c.legendFontColor,
            legendFontSize: 14,
          }))}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingTop: 20,
    paddingHorizontal: 25,
    alignItems: "stretch",
  },
  topBar: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    marginBottom: 10,
    width: "100%",
  },
  topButton: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  activeTopButton: { backgroundColor: "#007AFF" },
  topButtonText: { color: "#007AFF", fontWeight: "bold" },
  activeTopText: { color: "#fff" },

  subButton: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#888",
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },
  activeSubButton: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  subButtonText: {
    color: "#555",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  activeSubText: { color: "#fff" },

  noDataText: { textAlign: "center", fontSize: 16, color: "#666", marginTop: 20 },

  
});