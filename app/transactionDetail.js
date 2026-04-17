// app/transactionDetail.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  updateExpense,
  deleteExpense,
  updateIncome,
  deleteIncome,
} from "../api/expenseApi";

import { getCategories } from "../api/categoryApi";
import { useUser } from "../context/UserContext";

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../components/defaultIcon";

import AppHeader from "../components/appHeader";
import BackgroundWrapper from "../components/backgroundWrapper";

const STORAGE_KEY = "removed_categories";

/* ---------------- CATEGORY DROPDOWN ---------------- */
const CategoryDropdown = ({ data, value, onChange }) => {
  const [open, setOpen] = useState(false);

  const selected =
    data.find((i) => String(i.id) === String(value)) ||
    data.find(
      (i) =>
        i.name?.toLowerCase() === String(value)?.toLowerCase()
    );

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
            {selected?.name || "Select Category"}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={18} color="#555" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Category</Text>

            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onChange(item.id || item.name);
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
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

/* ---------------- SCREEN ---------------- */
export default function TransactionDetailScreen() {
  const router = useRouter();
  const { user } = useUser();

  const { id, type, title, amount, category, date } =
    useLocalSearchParams();

  const [editTitle, setEditTitle] = useState(title);
  const [editAmount, setEditAmount] = useState(String(amount));

  const [editCategory, setEditCategory] = useState(String(category));

  const [editDate, setEditDate] = useState(date);

  const [categories, setCategories] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* ---------------- LOAD CATEGORIES ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const customCategories = await getCategories(user.user_id, type);

        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const removedKeys = saved ? JSON.parse(saved) : [];

        const defaultCats =
          type === "expense"
            ? DEFAULT_EXPENSE_CATEGORIES
            : DEFAULT_INCOME_CATEGORIES;

        const allCategories = [
          ...defaultCats,
          ...customCategories.map((c) => ({
            id: String(c.id),
            name: c.name,
            icon: c.icon || "help-circle",
          })),
        ];

        const filtered = allCategories.filter((cat) => {
          const key = cat.id ? `id:${cat.id}` : `name:${cat.name}`;
          return !removedKeys.includes(key);
        });

        setCategories(filtered);
      } catch (err) {
        console.log("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, [user, type]);

  /* ---------------- UPDATE ---------------- */
  const handleUpdate = async () => {
    if (!editTitle || !editAmount || !editCategory || !editDate) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    const updatedData = {
      title: editTitle,
      amount: parseFloat(editAmount),
      category: String(editCategory),
      date: editDate,
    };

    try {
      if (type === "expense") {
        await updateExpense(Number(id), updatedData);
      } else {
        await updateIncome(Number(id), updatedData);
      }

      Alert.alert("Success", "Transaction updated successfully!");
      router.push("/drawer/tabs");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update transaction.");
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
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

            Alert.alert("Deleted", "Transaction deleted!");
            router.push("/drawer/tabs");
          } catch (err) {
            console.log(err);
            Alert.alert("Error", "Delete failed.");
          }
        },
      },
    ]);
  };

  const onDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditDate(selectedDate.toISOString().split("T")[0]);
    }
  };

  return (
    <View style={{ flex: 1 }}>

      <AppHeader
        title="Transaction Detail"
        backRoute="drawer/tabs"
      />
        <BackgroundWrapper>

      <ScrollView style={styles.container}>

          <View style={styles.contentContainer}>

            <View style={styles.card}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Category</Text>
              <CategoryDropdown
                data={categories}
                value={editCategory}
                onChange={setEditCategory}
              />

              <Text style={styles.label}>Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{editDate}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(editDate)}
                  mode="date"
                  onChange={onDateChange}
                />
              )}

              <Text style={styles.label}>Type</Text>
              <Text style={styles.readOnly}>{type}</Text>
            </View>

            <View style={styles.buttons}>

            {/* UPDATE BUTTON */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdate}
            >
              <Text style={styles.saveButtonText}>Update Transaction</Text>
            </TouchableOpacity>

            {/* DELETE BUTTON */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>

          </View>

          </View>

      </ScrollView>
        </BackgroundWrapper>

    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { paddingTop: 80 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: { padding: 20, borderRadius: 12 },
  label: { fontWeight: "bold", marginBottom: 5, marginTop: 10 },
  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 12,
    borderRadius: 8,
  },
  readOnly: { padding: 12, color: "#333" },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 12,
    borderRadius: 8,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeText: {
    textAlign: "center",
    marginTop: 10,
    color: "red",
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

  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },

  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});