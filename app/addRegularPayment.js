import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { useLocalSearchParams } from "expo-router";
import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../components/defaultIcon";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const params = useLocalSearchParams();
  const [pendingAI, setPendingAI] = useState(null);
  const hasLoadedRef = useRef(false);
  const STORAGE_KEY = "removed_categories";


  const payment = useMemo(() => {
    try {
      return params.payment ? JSON.parse(params.payment) : {};
    } catch (e) {
      return {};
    }
  }, [params.payment]);


  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };


  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const normalize = (str) =>
      str?.toString().toLowerCase().trim();

    const resolveCategoryName = (aiCategory) => {
    if (!aiCategory) return "";

    const input = normalize(aiCategory);

    // 1. exact match
    let match = categories.find(
      (c) => normalize(c.name) === input
    );

    if (match) return match.name;

    // 2. fuzzy match (IMPORTANT FIX)
    match = categories.find((c) =>
      normalize(c.name).includes(input) ||
      input.includes(normalize(c.name))
    );

    return match ? match.name : "";
  };

  // Load categories
  const loadCategories = async () => {
    if (!user) return;

    try {
      const userCategories = await getCategories(user.user_id, type);

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const removed = saved ? JSON.parse(saved) : [];

      const normalizeKey = (id) =>
        `id:${String(id).toLowerCase().trim()}`;

      const defaultCategories =
        type === "expense"
          ? DEFAULT_EXPENSE_CATEGORIES
          : DEFAULT_INCOME_CATEGORIES;

      const allCategories = [
        ...defaultCategories.map((c) => ({
          id: String(c.id).toLowerCase().trim(),
          name: c.name,
        })),
        ...(userCategories || []).map((c) => ({
          id: String(c.id).toLowerCase().trim(),
          name: c.name,
        })),
      ];

      // 🔥 IMPORTANT FIX: filter removed categories
      const filtered = allCategories.filter(
        (cat) => !removed.includes(normalizeKey(cat.id))
      );

      setCategories(filtered);
    } catch (error) {
      Alert.alert("Error", "Failed to load categories");
    }
  };

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();

    const parts = dateStr.split("/");

    if (parts.length !== 3) return new Date(dateStr);

    const [day, month, year] = parts;

    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    if (!pendingAI) return;
    if (categories.length === 0) return;

    const normalized = pendingAI.toLowerCase().trim();

    console.log("🧠 AI CATEGORY:", pendingAI);

    
      const match = categories.find(
        (c) =>
          c.id === normalized ||
          c.name.toLowerCase() === normalized
      );
      console.log("🎯 MATCHED CATEGORY:", match);


      if (match) {
        setCategory(match.id);
        setPendingAI(null);
      }

    setPendingAI(null);
  }, [categories, pendingAI]);


  useEffect(() => {
    if (!params || Object.keys(params).length === 0) return;

    console.log("📥 INITIAL LOAD ONLY:", params);

    setTitle(params.title ?? "");
    setAmount(params.scannedAmount ?? "");
    setType(
      params.type === "regular_payment"
        ? "expense"
        : params.type ?? "expense"
    );
    setFrequency(params.frequency ?? "Monthly");

    if (params.date) {
      setDate(parseLocalDate(params.date));
    }

    if (params.scannedCategory) {
      setPendingAI(params.scannedCategory.toLowerCase());
    }
    console.log("📦 CURRENT CATEGORY STATE:", category);
  }, []);


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

    const payload = {
      user_id: user.user_id,
      title,
      type,
      category,
      frequency,
      start_date: formatLocalDate(date),
      amount: parseFloat(amount),
    };

    console.log("\n==============================");
    console.log("📤 SAVING REGULAR PAYMENT");
    console.log("🧾 DATA:", payload);

    try {
      await addRegularPayment(payload);

      console.log("✅ SUCCESS: Regular payment saved");
      console.log("==============================\n");

      Alert.alert("Success", "Regular payment added");
      router.replace("/drawer/regular_payment");
    } catch (error) {
      console.log("❌ SAVE ERROR:", error);
      console.log("==============================\n");

      Alert.alert("Error", error.message || "Failed to add payment");
    }
  };

  return (
    <View style={styles.container}>
      
    

      <AppHeader
        title="Add Regular Payment"
        backRoute="/drawer/regular_payment"
      />
      
      <BackgroundWrapper>  

        <View style={styles.formContainer}>

        <Text style={styles.label}>Title</Text>
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
          }}
          style={styles.picker}
        >
          <Picker.Item label="Expense" value="expense" />
          <Picker.Item label="Income" value="income" />
        </Picker>

        <Text style={styles.label}>Category</Text>
        <Picker
          key={category}
          selectedValue={category}
          onValueChange={setCategory}
          style={styles.picker}
        >
          <Picker.Item label="Select Category" value="" />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
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

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleAddPayment}
        >
          <Text style={styles.saveButtonText}>Save Payment</Text>
        </TouchableOpacity>

      </View>
      </BackgroundWrapper>
    </View>
    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: {
    flex: 1,
    paddingTop: 100,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  label: { 
    marginBottom: 5, 
    fontWeight: "bold" 
  },
  picker: { 
    marginBottom: 15, 
    backgroundColor: "#ffffff71", 
    borderRadius: 5 },

  dateButton: {
    borderWidth: 1,
    borderColor: "rgb(182, 182, 182)",
    padding: 12,
    borderRadius: 5,
    backgroundColor: "#ffffff71",
    marginBottom: 15,
  },
  dateText: {
      fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});