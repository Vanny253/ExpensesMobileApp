// app/drawer/tabs/add_expense.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addExpense, addIncome } from "../../../api/expenseApi";
import { useUser } from "../../../context/UserContext";

const TransactionForm = ({ type }: { type: "expense" | "income" }) => {
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to add transactions.");
      return;
    }

    if (!title || !amount || !category) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const data = {
      user_id: user.user_id, // ⭐ important
      title: title,
      amount: parseFloat(amount),
      category: category,
      date: date.toISOString().split("T")[0],
    };

    try {
      if (type === "expense") {
        await addExpense(data);
        Alert.alert("Expense Saved", `${title} - RM${amount}`);
      } else {
        await addIncome(data);
        Alert.alert("Income Saved", `${title} - RM${amount}`);
      }

      // reset form
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date());
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save transaction.");
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const categories =
    type === "expense"
      ? ["Food", "Transport", "Shopping", "Bills", "Other"]
      : ["Salary", "Bonus", "Gift", "Investment", "Other"];

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter ${type} title`}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter ${type} amount`}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
        >
          <Picker.Item label={`Select ${type} category`} value="" />
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Date</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" onChange={onDateChange} />
      )}

      <Button title={`Add ${type}`} onPress={handleSubmit} />
    </View>
  );
};

const AddExpenseScreen = () => {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "expense" && styles.activeTab]}
          onPress={() => setActiveTab("expense")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "expense" && styles.activeTabText,
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "income" && styles.activeTab]}
          onPress={() => setActiveTab("income")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "income" && styles.activeTabText,
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <TransactionForm type={activeTab} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: "#007bff",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTabText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 15,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
  },
});

export default AddExpenseScreen;