// app/budgetDetail.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateBudget, deleteBudget } from "../api/budgetApi";
import { DEFAULT_EXPENSE_CATEGORIES } from "../components/defaultIcon";

import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";

export default function BudgetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const {
    id,
    category,
    budget,
    spent,
    remaining,
  } = params;

    const defaultCategoryMap = DEFAULT_EXPENSE_CATEGORIES.reduce((map, item, index) => {
    map[item.id] = item.name;

    // IMPORTANT: handle backend default-1, default-2, etc
    map[`default-${index + 1}`] = item.name;

    return map;
  }, {});

  const budgetAmount = parseFloat(budget) || 0;
  const spentAmount = parseFloat(spent) || 0;
  const remainingAmount = parseFloat(remaining) || 0;

  const [editBudget, setEditBudget] = useState(budgetAmount.toString());

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this budget?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBudget(Number(id));
              Alert.alert("Deleted", "Budget deleted successfully!");
              router.replace("/drawer/budget");
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete budget.");
            }
          },
        },
      ]
    );
  };

  const getCategoryName = (value) => {
    if (!value) return "-";

    const key = value.toLowerCase().trim();

    // 1. direct match
    if (defaultCategoryMap[key]) return defaultCategoryMap[key];

    // 2. fallback clean text
    return value
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleUpdate = async () => {
    if (!editBudget) {
      Alert.alert("Error", "Please enter an amount.");
      return;
    }

    try {
      await updateBudget(Number(id), parseFloat(editBudget));
      Alert.alert("Updated", "Budget updated successfully!");
      router.replace("/drawer/budget");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update budget.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppHeader
        title="Budget Details"
        backRoute="/drawer/budget"
      />

      <BackgroundWrapper>
        <View style={styles.card}>

          <View style={styles.row}>
            <Text style={styles.label}>Budget ID:</Text>
            <Text style={styles.value}>{id}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Category:</Text>
            <Text style={styles.category}>
              {getCategoryName(category)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Budget Amount:</Text>
            <TextInput
              style={styles.input}
              value={editBudget}
              keyboardType="numeric"
              onChangeText={setEditBudget}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Spent:</Text>
            <Text style={styles.value}>RM {spentAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Remaining:</Text>
            <Text style={styles.value}>RM {remainingAmount.toFixed(2)}</Text>
          </View>

  

        </View>

        {/* Buttons (styled like regularPaymentDetail) */}
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdate}
        >
          <Text style={styles.buttonText}>Update Budget</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={[styles.updateButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Delete Budget</Text>
        </TouchableOpacity>

      </BackgroundWrapper>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 80,
  },

  centerWrapper: {
    flex: 1,
    justifyContent: "center",
  },

  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff71",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgb(182,182,182)",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  label: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#555",
  },

  value: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },

  input: {
    borderWidth: 1,
    borderColor: "rgb(182,182,182)",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    textAlign: "right",
    backgroundColor: "#fff",
  },

  updateButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  deleteButton: {
    backgroundColor: "#ff3b30",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});