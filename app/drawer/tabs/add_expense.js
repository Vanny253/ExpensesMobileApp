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

const STORAGE_KEY = "removed_categories";

/* ---------------- DROPDOWN COMPONENT ---------------- */
const CategoryDropdown = ({ data, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);

  const selected = data.find((i) => i.name === value);

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
            {value || placeholder}
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
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onChange(item.name);
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

const TransactionForm = ({ type }) => {
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState([]);
  const [removedKeys, setRemovedKeys] = useState([]);

  const getKey = (cat) =>
    cat.id ? `id:${cat.id}` : `name:${cat.name}`;

  /* ---------------- LOAD REMOVED CATEGORIES ---------------- */
  useEffect(() => {
    const loadRemoved = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setRemovedKeys(JSON.parse(saved));
        }
      } catch (err) {
        console.log("Failed to load removed categories", err);
      }
    };

    loadRemoved();
  }, []);

  /* ---------------- FETCH CATEGORIES ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const customCategories = await getCategories(user.user_id, type);

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const removedKeys = saved ? JSON.parse(saved) : [];

        const defaultCats =
          type === "expense"
            ? [
                { name: "Food", icon: "fast-food" },
                { name: "Transport", icon: "car" },
                { name: "Shopping", icon: "cart" },
                { name: "Billing", icon: "receipt" },
                { name: "Health", icon: "medkit" },
                { name: "Other", icon: "ellipsis-horizontal" },
              ]
            : [
                { name: "Salary", icon: "cash" },
                { name: "Bonus", icon: "wallet" },
                { name: "Gift", icon: "gift" },
                { name: "Investment", icon: "trending-up" },
                { name: "Other", icon: "ellipsis-horizontal" },
              ];

        const allCategories = [
          ...defaultCats,
          ...customCategories.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon || "help-circle",
          })),
        ];

        // 🔥 SAME LOGIC AS add_expense.js
        const getKey = (cat) => cat.id || cat.name;

        const filteredCategories = allCategories.filter((cat) => {
          const key = getKey(cat);
          return !removedKeys.includes(key);
        });

        setCategories(filteredCategories);
      } catch (err) {
        console.log("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, [user, type]);

  /* ---------------- FILTER CATEGORIES ---------------- */
  const filteredCategories = categories.filter((cat) => {
    const key = getKey(cat);
    return !removedKeys.includes(key);
  });

  /* ---------------- SUBMIT ---------------- */
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
      user_id: user.user_id,
      title,
      amount: parseFloat(amount),
      category,
      date: date.toISOString().split("T")[0],
    };

    try {
      if (type === "expense") {
        await addExpense(data);
      } else {
        await addIncome(data);
      }

      Alert.alert("Success", `${type} saved successfully`);

      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date());
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to save transaction.");
    }
  };

  const onDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  /* ---------------- UI ---------------- */
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
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker value={date} mode="date" onChange={onDateChange} />
      )}

      <Button title={`Add ${type}`} onPress={handleSubmit} />
    </View>
  );
};

/* ---------------- SCREEN ---------------- */
const AddExpenseScreen = () => {
  const [activeTab, setActiveTab] = useState("expense");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "expense" && styles.activeTab]}
          onPress={() => setActiveTab("expense")}
        >
          <Text style={styles.tabText}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "income" && styles.activeTab]}
          onPress={() => setActiveTab("income")}
        >
          <Text style={styles.tabText}>Income</Text>
        </TouchableOpacity>
      </View>

      <TransactionForm type={activeTab} />
    </ScrollView>
  );
};

export default AddExpenseScreen;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },

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

  formContainer: { marginTop: 20 },

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
    alignItems: "center",
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

  dateText: { fontSize: 16 },
});