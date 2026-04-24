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
import { useRouter } from "expo-router";

const STORAGE_KEY = "removed_categories";

/* ---------------- DROPDOWN COMPONENT ---------------- */
const CategoryDropdown = ({ data, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
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

            {/* ⭐ NEW: MORE CATEGORY BUTTON */}
            <TouchableOpacity
              style={{
                paddingVertical: 15,
                borderTopWidth: 1,
                borderTopColor: "#eee",
                alignItems: "center",
              }}
              onPress={() => {
                setOpen(false);
                router.push("/drawer/category");
              }}
            >
              <Text style={{ color: "#007AFF", fontWeight: "bold" }}>
                + More Category
              </Text>
            </TouchableOpacity>

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
  const router = useRouter();

  const defaultCats =
    type === "expense"
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES;

      
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date());
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [categories, setCategories] = useState([]);
    const [removedKeys, setRemovedKeys] = useState([]);
    
    // ⭐ IMPORTANT: only apply AI/OCR params ONCE
    const [prefilled, setPrefilled] = useState(false);
    const [pendingAI, setPendingAI] = useState(null);
    const params = useLocalSearchParams();
    const [lastScanId, setLastScanId] = useState(null);
    const normalizeKey = (id) => `id:${String(id).toLowerCase().trim()}`;

    const getKey = (cat) => (cat.id ? `id:${cat.id}` : `name:${cat.name}`);

    const normalize = (str) =>
      str?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

    const resolveCategoryId = (aiCategory) => {
      if (!aiCategory) return "";

    const input = normalize(aiCategory);

    let bestMatch = null;

    for (const c of categories) {
      const name = normalize(c.name);

      // exact match
      if (name === input) return c.id;

      // partial match (important for AI noise)
      if (input.includes(name) || name.includes(input)) {
        bestMatch = c;
      }
    }

    return bestMatch ? bestMatch.id : "";
  };

  // =========================
  // RESET WHEN USER ENTERS SCREEN (MANUAL MODE)
  // =========================
    useFocusEffect(
      useCallback(() => {
        fetchCategories();
        setTitle("");
        setAmount("");
        setCategory("");
        setDate(new Date());
        setPrefilled(false);
        setPendingAI(null);
        setLastScanId(null);
      }, [])
    );

  useEffect(() => {
    if (!pendingAI) return;
    if (categories.length === 0) return;

    const resolvedId = resolveCategoryId(pendingAI);

    if (resolvedId) {
      setCategory(resolvedId);
    }

    setPendingAI(null);
  }, [categories, pendingAI]);

  // =========================
  // APPLY AI / OCR / CHATBOT PREFILL (ONLY ONCE)
  // =========================

useEffect(() => {
  const {
    scannedAmount,
    scannedDate,
    scannedTitle,
    scannedCategory,
    scanId,
  } = params;

  //  prevent duplicate scan
  if (scanId === lastScanId) return;

  setLastScanId(scanId);

  console.log("📥 PREFILL RECEIVED:", params);

  if (scannedTitle) setTitle(String(scannedTitle));
  if (scannedAmount) setAmount(String(scannedAmount));

  // DATE FIX (DD/MM/YYYY)
  const parseDMY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  if (scannedDate) {
    let parsed = null;

    // ✅ format: YYYY-MM-DD (your current backend)
    if (scannedDate.includes("-")) {
      parsed = new Date(scannedDate);
    }

    // fallback: DD/MM/YYYY (if old format ever comes)
    else if (scannedDate.includes("/")) {
      const [d, m, y] = scannedDate.split("/");
      parsed = new Date(y, m - 1, d);
    }

    if (parsed && !isNaN(parsed.getTime())) {
      setDate(parsed);
    }
  }

  if (scannedCategory) {
    setPendingAI(scannedCategory);
  }

  setPrefilled(true);
}, [params]);

  // =========================
  // LOAD CATEGORIES
  // =========================
  const fetchCategories = async () => {
    if (!user) return;

    const customCategories = await getCategories(user.user_id, type);
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    const removed = saved ? JSON.parse(saved) : [];

    const normalizeKey = (id) =>
      `id:${String(id).toLowerCase().trim()}`;

    const allCategories = [
      ...defaultCats.map((c) => ({
        id: String(c.id).toLowerCase().trim(),
        name: c.name,
        icon: c.icon || "help-circle",
      })),
      ...(customCategories || []).map((c) => ({
        id: String(c.id).toLowerCase().trim(),
        name: c.name,
        icon: c.icon || "help-circle",
      })),
    ];

    const filtered = allCategories.filter(
      (cat) => !removed.includes(normalizeKey(cat.id))
    );

    setCategories(filtered);
  };

  useEffect(() => {
    fetchCategories();
  }, [user, type]);

  // const filteredCategories = categories.filter(
  //   (cat) => !removedKeys.includes(getKey(cat))
  // );

  // =========================
  // SUBMIT (MANUAL OR AI SAME FLOW)
  // =========================
  const handleSubmit = async () => {
    if (!amount || !category) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const data = {
      user_id: user.user_id,
      title,
      amount: parseFloat(amount),
      category,
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`,
    };

    if (type === "expense") await addExpense(data);
    else await addIncome(data);

    Alert.alert("Success", `${type} saved successfully`, [
  {
    text: "OK",
    onPress: () => {
      router.replace("/drawer/tabs");
    },
  },
]);

    // reset AFTER save (manual flow safe)
    setTitle("");
    setAmount("");
    setCategory("");
    setDate(new Date());
    setPrefilled(false);
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Add notes (optional)"
      />

      <Text style={styles.label}>Amount</Text>

      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Add amount (RM)"
        onBlur={() => {
          if (amount) {
            const num = parseFloat(amount);
            if (!isNaN(num)) {
              setAmount(num.toFixed(2));
            }
          }
        }}
      />

      <Text style={styles.label}>Category</Text>
      <CategoryDropdown
        data={categories}
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
    padding: 20,
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