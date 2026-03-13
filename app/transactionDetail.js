// app/transactionDetail.js
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
import {
  updateExpense,
  deleteExpense,
  updateIncome,
  deleteIncome,
} from "../api/expenseApi";

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, type, title, amount, category, date } = params;

  // State for editing
  const [editTitle, setEditTitle] = useState(title);
  const [editAmount, setEditAmount] = useState(amount);
  const [editCategory, setEditCategory] = useState(category);

  const parsedAmount = parseFloat(amount);

  // Delete transaction
  const handleDelete = async () => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (type === "expense") {
              await deleteExpense(Number(id));
            } else {
              await deleteIncome(Number(id));
            }
            Alert.alert("Deleted", "Transaction deleted successfully!");
            router.back(); // go back to previous screen
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to delete transaction.");
          }
        },
      },
    ]);
  };

  // Update transaction
  const handleUpdate = async () => {
    if (!editTitle || !editAmount || !editCategory) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const updatedData = {
      title: editTitle,
      amount: parseFloat(editAmount),
      category: editCategory,
      date, // keep original date
    };

    try {
      if (type === "expense") {
        await updateExpense(Number(id), updatedData);
      } else {
        await updateIncome(Number(id), updatedData);
      }
      Alert.alert("Updated", "Transaction updated successfully!");
      router.back(); // go back to previous screen
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update transaction.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Transaction Details</Text>

      <View
        style={[
          styles.transactionCard,
          type === "income"
            ? { backgroundColor: "#ddffdd" }
            : { backgroundColor: "#ffdddd" },
        ]}
      >
        <View style={styles.row}>
          <Text style={styles.label}>Transaction ID:</Text>
          <Text style={styles.value}>{id}</Text>
        </View>

        {/* Editable fields */}
        <View style={styles.row}>
          <Text style={styles.label}>Title:</Text>
          <TextInput
            style={styles.input}
            value={editTitle}
            onChangeText={setEditTitle}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <TextInput
            style={styles.input}
            value={editCategory}
            onChangeText={setEditCategory}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <TextInput
            style={styles.input}
            value={editAmount}
            keyboardType="numeric"
            onChangeText={setEditAmount}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(date).toDateString()}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>{type}</Text>
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
  transactionCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
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
  buttonsContainer: {
    marginTop: 20,
  },
});