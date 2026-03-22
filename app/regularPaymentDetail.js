import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateRegularPayment, deleteRegularPayment } from "../api/regularPaymentApi";
import { getCategories } from "../api/categoryApi";

export default function RegularPaymentDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse payment object
  const payment = params.payment ? JSON.parse(params.payment) : {};

  // Editable fields
  const [title, setTitle] = useState(payment.title || "");
  const [type, setType] = useState(payment.type || "expense");
  const [category, setCategory] = useState(payment.category || "");
  const [categories, setCategories] = useState([]);
  const [frequency, setFrequency] = useState(payment.frequency || "Monthly");
  const [amount, setAmount] = useState(payment.amount ? payment.amount.toString() : "");
  const [startDate, setStartDate] = useState(
    payment.start_date ? new Date(payment.start_date) : new Date()
  );

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch categories from database + default ones
  const DEFAULT_CATEGORIES = {
    expense: [
      { name: "Food" },
      { name: "Transport" },
      { name: "Billing" },
      { name: "Shopping" },
      { name: "Health" },
      { name: "Entertainment" },
    ],
    income: [
      { name: "Salary" },
      { name: "Gift" },
      { name: "Investment" },
      { name: "Bonus" },
      { name: "Freelance" },
    ],
  };

  const loadCategories = async () => {
    try {
      const dbCategories = await getCategories(payment.user_id, type);
      const dbNames = dbCategories.map((c) => c.name);

      // Merge with defaults
      const defaultNames = (DEFAULT_CATEGORIES[type] || []).map((c) => c.name);
      const mergedNames = [
        ...defaultNames,
        ...dbNames.filter((n) => !defaultNames.includes(n)),
      ];

      const finalCategories = mergedNames.map((name, idx) => ({ id: idx, name }));
      setCategories(finalCategories);

      // Keep original category selected if exists
      if (payment.category) {
        setCategory(payment.category);
      } else if (finalCategories.length > 0) {
        setCategory(finalCategories[0].name);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to load categories");
    }
  };

  useEffect(() => {
    if (payment.user_id) loadCategories();
  }, [payment.user_id, type]);

  const formatDate = (date) => {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleUpdate = async () => {
    if (!title || !category || !frequency || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      await updateRegularPayment(Number(payment.id), {
        title,
        type,
        category,
        frequency,
        start_date: formatDate(startDate),
        amount: parseFloat(amount),
      });
      Alert.alert("Success", "Payment updated successfully");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update payment");
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this payment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRegularPayment(Number(payment.id));
              Alert.alert("Deleted", "Payment deleted successfully");
              router.back();
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete payment");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Regular Payment Details</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Type</Text>
      <Picker
        selectedValue={type}
        onValueChange={(val) => {
          setType(val);
          setCategory(""); // reset category on type change
        }}
        style={styles.picker}
      >
        <Picker.Item label="Expense" value="expense" />
        <Picker.Item label="Income" value="income" />
      </Picker>

      <Text style={styles.label}>Category</Text>
      <Picker
        selectedValue={category}
        onValueChange={(val) => setCategory(val)}
        style={styles.picker}
      >
        {categories.map((c) => (
          <Picker.Item key={c.id} label={c.name} value={c.name} />
        ))}
      </Picker>

      <Text style={styles.label}>Frequency</Text>
      <Picker
        selectedValue={frequency}
        onValueChange={(val) => setFrequency(val)}
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
        <Text>{startDate.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Button title="Update Payment" onPress={handleUpdate} color="#007bff" />
      <View style={{ height: 10 }} />
      <Button title="Delete Payment" onPress={handleDelete} color="#ff3b30" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 10, marginBottom: 5, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
});