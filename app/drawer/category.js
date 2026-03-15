// app/drawer/tabs/category.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "../../components/_BottomTabs";
import { useUser } from "../../context/UserContext";
import { getCategories } from "../../api/categoryApi";
import { router } from "expo-router";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "fast-food" },
  { name: "Transport", icon: "car" },
  { name: "Billing", icon: "receipt" },
  { name: "Shopping", icon: "cart" },
  { name: "Health", icon: "medkit" },
  { name: "Entertainment", icon: "game-controller" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "cash" },
  { name: "Gift", icon: "gift" },
  { name: "Investment", icon: "trending-up" },
  { name: "Bonus", icon: "wallet" },
  { name: "Freelance", icon: "laptop" },
];

export default function CategoryScreen() {
  const { user } = useUser();
  const [type, setType] = useState("expense");
  const [customCategories, setCustomCategories] = useState([]);

  const allCategories =
    type === "expense"
      ? [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories]
      : [...DEFAULT_INCOME_CATEGORIES, ...customCategories];

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      try {
        const categoriesFromAPI = await getCategories(user.user_id, type);
        setCustomCategories(categoriesFromAPI);
      } catch (error) {
        console.log("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, [user, type]);

  // Guest mode
  if (!user) {
    return (
      <View style={{ flex: 1 }}>
        <View style={styles.guestContainer}>
          <Text style={styles.guestText}>
            Guest Mode: Please login to manage categories.
          </Text>
        </View>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Manage Categories</Text>

        {/* Type Toggle */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === "expense" && styles.activeType]}
            onPress={() => setType("expense")}
          >
            <Text style={type === "expense" && styles.activeText}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === "income" && styles.activeType]}
            onPress={() => setType("income")}
          >
            <Text style={type === "income" && styles.activeText}>Income</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Categories</Text>

        <View style={styles.defaultContainer}>
          {allCategories.map((cat, index) => (
            <View key={index} style={styles.iconButton}>
              <Ionicons name={cat.icon} size={28} color="#007AFF" />
              <Text style={styles.iconText}>{cat.name}</Text>
            </View>
          ))}

          {/* Add Category Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              router.push({
                pathname: "/addCategory",
                params: { type: type },
              })
            }
          >
            <Ionicons name="add-circle" size={28} color="#28a745" />
            <Text style={styles.iconText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  guestText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 16,
  },

  typeContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },

  activeType: {
    backgroundColor: "#007AFF",
  },

  activeText: {
    color: "white",
    fontWeight: "bold",
  },

  defaultContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  iconButton: {
    width: "30%",
    alignItems: "center",
    padding: 12,
    margin: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fafafa",
  },

  iconText: {
    marginTop: 5,
    fontSize: 12,
    textAlign: "center",
  },
});