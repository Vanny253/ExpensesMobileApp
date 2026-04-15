import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState, useEffect } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getCategories } from "../../../api/categoryApi";
import { addExpense, addIncome } from "../../../api/expenseApi";
import { useUser } from "../../../context/UserContext";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../../../components/defaultIcon";
import BackgroundWrapper from "../../../components/backgroundWrapper";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


const STORAGE_KEY = "removed_categories";

/* ---------------- DROPDOWN COMPONENT ---------------- */
const CategoryDropdown = ({ data, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const selected = data.find((i) => i.id === value);

  return (
    <>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons
            name={selected?.icon || "list"}
            size={20}
            color="#007AFF"
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 16 }}>
            {selected?.name || placeholder}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={18} color="#555" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Select Category
            </Text>

            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Ionicons
                    name={item.icon || "help-circle"}
                    size={22}
                    color="#007AFF"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ fontSize: 16 }}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={{ textAlign: "center", marginTop: 10, color: "red" }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

/* ---------------- FORM ---------------- */
const TransactionForm = ({ type }) => {
  const { user } = useUser();

  const defaultCats =
    type === "expense"
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date());
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  // const { amount: scannedAmount, date: scannedDate, title: scannedTitle } = useLocalSearchParams();
  const params = useLocalSearchParams();
  const [categories, setCategories] = useState([]);
  const [removedKeys, setRemovedKeys] = useState([]);

  const getKey = (cat) =>
    cat.id ? `id:${cat.id}` : `name:${cat.name}`;

  useEffect(() => {
    const loadRemoved = async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setRemovedKeys(JSON.parse(saved));
    };
    loadRemoved();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // reset form every time user enters screen
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date());

      return () => {
        // optional cleanup (safe)
      };
    }, [])
  );


  useEffect(() => {
  const scannedAmount = params.scannedAmount ?? params.amount;
  const scannedDate = params.scannedDate ?? params.date;
  const scannedTitle = params.scannedTitle ?? params.title;
  const scannedCategory = params.scannedCategory;

  if (!scannedAmount && !scannedDate && !scannedTitle && !scannedCategory) return;

  console.log("📥 SCANNED DATA RECEIVED:", {
    scannedAmount,
    scannedDate,
    scannedTitle,
    scannedCategory,
  });

  // 💰 AMOUNT
  if (scannedAmount && String(scannedAmount) !== String(amount)) {
    setAmount(String(scannedAmount));
  }

  // 📅 DATE
  if (scannedDate) {
    let parsedDate = null;

    if (scannedDate.includes("/")) {
      const [day, month, year] = scannedDate.split("/");
      parsedDate = new Date(year, month - 1, day);
    } else {
      parsedDate = new Date(scannedDate);
    }

    if (
      parsedDate &&
      !isNaN(parsedDate.getTime()) &&
      parsedDate.getTime() !== date.getTime()
    ) {
      setDate(parsedDate);
    }
  }

  // 🏪 TITLE
  if (scannedTitle && scannedTitle !== title) {
    setTitle(scannedTitle);
  }


  // 🏷 CATEGORY AUTO SELECT (SAFE VERSION)
  if (scannedCategory && categories.length > 0) {
    const cleanAI = scannedCategory.toLowerCase().trim();

    const matched = categories.find((c) => {
      const dbName = (c.name || "").toLowerCase().trim();

      return dbName === cleanAI;
    });

    if (matched) {
      console.log("🏷 AUTO CATEGORY FOUND:", matched.name);
      setCategory(matched.id);
    } else {
      console.log("🏷 CATEGORY NOT FOUND → user must select manually");
      // DO NOTHING → keep dropdown empty
    }
  }
}, [params, categories]); // ✅ safe add categories

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      const customCategories = await getCategories(user.user_id, type);
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const removedKeys = saved ? JSON.parse(saved) : [];

      const allCategories = [
        ...defaultCats,
        ...customCategories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || "help-circle",
        })),
      ];

      const getKey = (cat) => cat.id || cat.name;

      const filtered = allCategories.filter(
        (cat) => !removedKeys.includes(getKey(cat))
      );

      setCategories(filtered);
    };

    fetchCategories();
  }, [user, type]);

  const filteredCategories = categories.filter(
    (cat) => !removedKeys.includes(getKey(cat))
  );

  const handleSubmit = async () => {
    if (!title || !amount || !category) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const data = {
      user_id: user.user_id,
      title,
      amount: parseFloat(amount),
      category,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    };

    if (type === "expense") await addExpense(data);
    else await addIncome(data);

    Alert.alert("Success", `${type} saved successfully`);

    setTitle("");
    setAmount("");
    setCategory("");
    setDate(new Date());
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <CategoryDropdown
        data={filteredCategories}
        value={category}
        onChange={setCategory}
        placeholder={`Select ${type} category`}
      />

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
      <Text>
        {date.toDateString()}
      </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);

            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>
          Add {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- SCREEN ---------------- */
const AddExpenseScreen = () => {
  const [activeTab, setActiveTab] = useState("expense");

  return (
    <BackgroundWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "expense" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("expense")}
          >
            <Text style={styles.tabText}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "income" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("income")}
          >
            <Text style={styles.tabText}>Income</Text>
          </TouchableOpacity>
        </View>

        <TransactionForm type={activeTab} />
      </ScrollView>
    </BackgroundWrapper>
  );
};

export default AddExpenseScreen;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20, // ❌ removed white background
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

  tabText: { fontSize: 16, color: "#555" },

  formContainer: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.9)", // ✅ transparent white
    padding: 15,
    borderRadius: 10,
  },

  label: { marginBottom: 5, fontWeight: "bold" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },

  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    maxHeight: "70%",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },

  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
    elevation: 4,
  },

  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});