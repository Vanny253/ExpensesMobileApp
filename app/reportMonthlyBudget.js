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
import { Picker } from "@react-native-picker/picker";
import { useUser } from "../context/UserContext";
import { getMonthlyBudgets } from "../api/reportApi";
import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";

export default function ReportMonthlyBudget() {
  const { user } = useUser();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadBudgets();
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
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.category}>
                    {item.category}
                  </Text>
                  <Text>Budget: RM{item.budget.toFixed(2)}</Text>
                  <Text>Spent: RM{item.spent.toFixed(2)}</Text>
                  <Text>
                    Remaining: RM{item.remaining.toFixed(2)}
                  </Text>
                </View>
              )}
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