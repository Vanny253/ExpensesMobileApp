import React, { useEffect, useState, useMemo } from "react";
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

  const payment = useMemo(() => {
    try {
      return params.payment ? JSON.parse(params.payment) : {};
    } catch (e) {
      return {};
    }
  }, [params.payment]);
  

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

    const match = categories.find((c) => {
      return normalize(c.name) === input;
    });

    return match ? match.name : "";
  };

  // Load categories
  const loadCategories = async () => {
    if (!user) return;

    try {
      const userCategories = await getCategories(user.user_id, type);

      const userCategoryNames = userCategories.map((c) => c.name);

      const defaultCategories =
        type === "expense"
          ? DEFAULT_EXPENSE_CATEGORIES
          : DEFAULT_INCOME_CATEGORIES;

      const defaultNames = defaultCategories.map((c) => c.name);

      const mergedNames = [
        ...defaultNames,
        ...userCategoryNames.filter((name) => !defaultNames.includes(name)),
      ];

      const finalCategories = mergedNames.map((name, index) => ({
        id: index,
        name,
      }));

      setCategories(finalCategories);

      // ✅ PRIORITY: use chatbot category if exists
      if (params?.scannedCategory) {
        setCategory(params.scannedCategory);
      } else if (finalCategories.length > 0) {
        setCategory(finalCategories[0].name);
      }

    } catch (error) {
      Alert.alert("Error", "Failed to load categories");
    }
  };

  useEffect(() => {
    if (!pendingAI) return;
    if (categories.length === 0) return;

    const resolved = resolveCategoryName(pendingAI);

    if (resolved) {
      setCategory(resolved);
    }

    setPendingAI(null);
  }, [categories, pendingAI]);


  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      setDate(selectedDate);
    }
  };


  useEffect(() => {
    if (!params) return;

    console.log("📥 RECEIVED PARAMS (REGULAR PAYMENT):", params);

    if (params.title) setTitle(params.title);
    if (params.scannedAmount) setAmount(params.scannedAmount);
    if (params.type) setType(params.type);
    if (params.frequency) setFrequency(params.frequency);

    // ❌ DON'T set category directly
    if (params.scannedCategory) {
      setPendingAI(params.scannedCategory);
    }

  }, [params]);


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
      router.back();
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
            setCategory("");
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