// app/reportBudgetOverview.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useUser } from "../context/UserContext";
import { getMonthlyBudgets } from "../api/reportApi";
import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";
import Svg, { Circle } from "react-native-svg";
import { getCategories } from "../api/categoryApi";
import { DEFAULT_EXPENSE_CATEGORIES } from "../components/defaultIcon";

export default function ReportMonthlyBudget() {
  const { user } = useUser();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState({});

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

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


  

const CircularRemaining = ({ budget, spent }) => {
  const size = 110;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const remaining = budget - spent;
  const percent = budget > 0 ? Math.max(0, (remaining / budget) * 100) : 0;

  const isExceeded = remaining < 0;

  const strokeDashoffset =
    circumference - (percent / 100) * circumference;

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* background */}
        <Circle
          stroke={isExceeded ? "#f05850c4" : "#e6e6e6"} 
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* progress */}
        <Circle
          stroke={isExceeded ? "#f05850c4" : "#007AFF"}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      {/* CENTER TEXT */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        {remaining < 0 ? (
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#f05850c4" }}>
            Exceed
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 11, color: "#666" }}>
              Remaining
            </Text>

            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {percent.toFixed(0)}%
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const getCategoryName = (value) => {
  if (!value) return "-";

  const key = String(value).toLowerCase().trim();

  if (categoryMap[key]) return categoryMap[key];

  if (key.startsWith("default-")) {
    const index = parseInt(key.split("-")[1], 10) - 1;
    const match = DEFAULT_EXPENSE_CATEGORIES[index];
    if (match) return match.name;
  }

  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};


  const loadBudgets = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getMonthlyBudgets(
        user.user_id,
        selectedMonth,
        selectedYear
      );
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

  const loadCategoryMap = async () => {
    if (!user) return;

    try {
      const dbCats = await getCategories(user.user_id, "expense");

      const map = {};

      dbCats.forEach((c) => {
        const id = String(c?.id ?? "").toLowerCase().trim();
        const name = c?.name || id;

        if (id) map[id] = name;
        if (name) map[name.toLowerCase()] = name;
      });

      DEFAULT_EXPENSE_CATEGORIES.forEach((c) => {
        map[c.id.toLowerCase()] = c.name;
        map[c.name.toLowerCase()] = c.name;
      });

      setCategoryMap(map);
    } catch (err) {
      console.log("CATEGORY MAP ERROR:", err);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadCategoryMap(); 
  }, [user, selectedMonth, selectedYear]);

  return (
    <View style={{ flex: 1 }}>
      <AppHeader
        title="Monthly Budget Report"
        backRoute="/drawer/tabs/report"
      />

      <BackgroundWrapper>
        <View style={styles.container}>

          {/* Labels */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>Month</Text>
            <Text style={styles.label}>Year</Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickerRow}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedMonth}
                onValueChange={(val) => setSelectedMonth(val)}
              >
                {MONTHS.map((m) => (
                  <Picker.Item
                    key={m.value}
                    label={m.label}
                    value={m.value}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedYear}
                onValueChange={(val) => setSelectedYear(val)}
              >
                {YEARS.map((y) => (
                  <Picker.Item
                    key={y}
                    label={y.toString()}
                    value={y}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Data */}
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
                <Text style={styles.emptyText}>
                  No budgets for this month.
                </Text>
              }
              renderItem={({ item }) => {
                const remaining = item.budget - item.spent;

                return (
                  <View style={styles.cardRow}>
                    {/* LEFT: circle */}
                    <CircularRemaining
                      budget={item.budget}
                      spent={item.spent}
                    />

                    {/* RIGHT: details */}
                    <View style={styles.infoBox}>
                      <Text style={styles.category}>
                        {getCategoryName(item.category)}
                      </Text>

                      <Text style={styles.text}>
                        Remaining: RM {remaining.toFixed(2)}
                      </Text>

                      <Text style={styles.text}>
                        Budget: RM {item.budget.toFixed(2)}
                      </Text>

                      <Text style={styles.text}>
                        Spent: RM {item.spent.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}

        </View>
      </BackgroundWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 65,
  },

  label: {
    fontWeight: "bold",
    flex: 1,
  },

  pickerRow: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
  },

  pickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    backgroundColor: "#ffffff71",
    borderRadius: 5,
    marginHorizontal: 5,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#ffffff71",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: "#ffffff71",
  },

  infoBox: {
    flex: 1,
    marginLeft: 15,
  },

  text: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },

  category: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
  },
});