import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useUser } from "../context/UserContext";
import { useRouter } from "expo-router";
import { getCategories } from "../api/categoryApi";
import { addRegularPayment } from "../api/regularPaymentApi";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

export default function RegularPaymentDetail() {
  const { user } = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [frequency, setFrequency] = useState("Monthly");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [amount, setAmount] = useState("");

  // ✅ Combine defaults into ONE object
  const DEFAULT_CATEGORIES = {
    expense: [
      { name: "Food", icon: "fast-food" },
      { name: "Transport", icon: "car" },
      { name: "Billing", icon: "receipt" },
      { name: "Shopping", icon: "cart" },
      { name: "Health", icon: "medkit" },
      { name: "Entertainment", icon: "game-controller" },
    ],
    income: [
      { name: "Salary", icon: "cash" },
      { name: "Gift", icon: "gift" },
      { name: "Investment", icon: "trending-up" },
      { name: "Bonus", icon: "wallet" },
      { name: "Freelance", icon: "laptop" },
    ],
  };

  // Load categories
  const loadCategories = async () => {
    if (!user) return;

    try {
      const userCategories = await getCategories(user.user_id, type);

      // Extract names from DB
      const userCategoryNames = userCategories.map((c) => c.name);

      // Get default categories (objects)
      const defaultCategories = DEFAULT_CATEGORIES[type] || [];

      // Extract default names
      const defaultNames = defaultCategories.map((c) => c.name);

      // Merge without duplicates
      const mergedNames = [
        ...defaultNames,
        ...userCategoryNames.filter((name) => !defaultNames.includes(name)),
      ];

      // Convert to Picker format
      const finalCategories = mergedNames.map((name, index) => ({
        id: index,
        name,
      }));

      setCategories(finalCategories);

      if (finalCategories.length > 0) {
        setCategory(finalCategories[0].name);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load categories");
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false); // close after selecting

    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadCategories();
    }
  }, [user, type]);

  const handleAddPayment = async () => {
    if (!title || !type || !category || !frequency || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await addRegularPayment({
        user_id: user.user_id,
        title,
        type,
        category,
        frequency,
        start_date: date.toISOString().split("T")[0],
        amount: parseFloat(amount),
      });

      Alert.alert("Success", "Regular payment added");
      router.back();
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to add payment");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Regular Payment</Text>

      <TextInput
        placeholder="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Type</Text>
      <Picker
        selectedValue={type}
        onValueChange={(value) => {
          setType(value);
          setCategory(""); // reset
        }}
        style={styles.picker}
      >
        <Picker.Item label="Expense" value="expense" />
        <Picker.Item label="Income" value="income" />
      </Picker>

      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={category}
        onValueChange={setCategory}
        style={styles.picker}
      >
        {categories.map((cat) => (
          <Picker.Item key={cat.id} label={cat.name} value={cat.name} />
        ))}
      </Picker>

      <Text style={styles.label}>Frequency</Text>
      <Picker
        selectedValue={frequency}
        onValueChange={setFrequency}
        style={styles.picker}
      >
        <Picker.Item label="Daily" value="Daily" />
        <Picker.Item label="Weekly" value="Weekly" />
        <Picker.Item label="Monthly" value="Monthly" />
        <Picker.Item label="Yearly" value="Yearly" />
      </Picker>

      <Text style={styles.label}>Start Date</Text>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <TextInput
        placeholder="Amount"
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Button title="Save Payment" onPress={handleAddPayment} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  label: { marginBottom: 5, fontWeight: "bold" },
  picker: { marginBottom: 15 },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  dateText: {
      fontSize: 16,
  },
});