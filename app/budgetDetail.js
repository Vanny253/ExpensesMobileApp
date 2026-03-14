// app/budgetDetail.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateBudget, deleteBudget } from "../api/budgetApi";

export default function BudgetDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Destructure and parse numbers from params
  const {
    id,
    category,
    budget,
    spent,
    remaining,
    month,
    year,
  } = params;

  const budgetAmount = parseFloat(budget) || 0;
  const spentAmount = parseFloat(spent) || 0;
  const remainingAmount = parseFloat(remaining) || 0;

  // State for editing budget amount
  const [editBudget, setEditBudget] = useState(budgetAmount.toString());

  // Delete budget
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
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete budget.");
            }
          },
        },
      ]
    );
  };

  // Update budget
  const handleUpdate = async () => {
    if (!editBudget) {
      Alert.alert("Error", "Please enter an amount.");
      return;
    }

    try {
      await updateBudget(Number(id), parseFloat(editBudget));
      Alert.alert("Updated", "Budget updated successfully!");
      router.back(); // go back to BudgetScreen
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update budget.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Budget Details</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Budget ID:</Text>
          <Text style={styles.value}>{id}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{category}</Text>
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

        <View style={styles.row}>
          <Text style={styles.label}>Month:</Text>
          <Text style={styles.value}>{month}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Year:</Text>
          <Text style={styles.value}>{year}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <Button title="Update" onPress={handleUpdate} color="#007bff" />
        <View style={{ height: 10 }} />
        <Button title="Delete" onPress={handleDelete} color="#ff3b30" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  label: { fontWeight: "bold", fontSize: 16, color: "#555" },
  value: { fontSize: 16, color: "#333", flex: 1, textAlign: "right" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
    flex: 1,
    textAlign: "right",
  },
  buttonsContainer: { marginTop: 20 },
});