// app/drawer/tabs/category.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "../../components/_BottomTabs";
import { useUser } from "../../context/UserContext";
import { getCategories } from "../../api/categoryApi";
import { router, useFocusEffect } from "expo-router";

const STORAGE_KEY = "removed_categories";

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
  const [removedKeys, setRemovedKeys] = useState([]);

  const getKey = (cat) =>
    cat.id ? `id:${cat.id}` : `name:${cat.name}`;

  /* ---------------- LOAD REMOVED STATE ---------------- */
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

  /* ---------------- SAVE + TOGGLE ---------------- */
  const toggleCategory = (cat) => {
    const key = getKey(cat);

    setRemovedKeys((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key];

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  /* ---------------- LOAD API CATEGORIES ---------------- */
  const fetchCategories = async () => {
    if (!user) return;

    try {
      const categoriesFromAPI = await getCategories(user.user_id, type);
      setCustomCategories(categoriesFromAPI || []);
    } catch (error) {
      console.log("Failed to load categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user, type]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
    }, [type])
  );

  /* ---------------- ALL CATEGORIES ---------------- */
  const allCategories =
    type === "expense"
      ? [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories]
      : [...DEFAULT_INCOME_CATEGORIES, ...customCategories];

  const visibleCategories = allCategories.filter(
    (cat) => !removedKeys.includes(getKey(cat))
  );

  const removedCategories = allCategories.filter((cat) =>
    removedKeys.includes(getKey(cat))
  );

  /* ---------------- UI ---------------- */
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Manage Categories</Text>

        {/* TYPE TOGGLE */}
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[styles.typeButton, type === "expense" && styles.activeType]}
            onPress={() => setType("expense")}
          >
            <Text style={type === "expense" && styles.activeText}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, type === "income" && styles.activeType]}
            onPress={() => setType("income")}
          >
            <Text style={type === "income" && styles.activeText}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Categories</Text>

        {/* ACTIVE */}
        <View style={styles.listContainer}>
          {visibleCategories.map((cat, index) => {
            const isCustom = cat.id;

            return (
              <View key={index} style={styles.listItem}>
                {/* MINUS */}
                <TouchableOpacity onPress={() => toggleCategory(cat)}>
                  <Ionicons name="remove-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>

                <Ionicons name={cat.icon} size={22} color="#007AFF" />

                <Text style={styles.listText}>{cat.name}</Text>

                {isCustom && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/category/updateCategory",
                        params: {
                          id: cat.id,
                          name: cat.name,
                          icon: cat.icon,
                          type,
                        },
                      })
                    }
                  >
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {/* REMOVED (BOTTOM) */}
          {removedCategories.map((cat, index) => (
            <View key={`removed-${index}`} style={styles.listItem}>
              {/* PLUS */}
              <TouchableOpacity onPress={() => toggleCategory(cat)}>
                <Ionicons name="add-circle" size={20} color="#28a745" />
              </TouchableOpacity>

              <Ionicons name={cat.icon} size={22} color="#aaa" />

              <Text style={[styles.listText, { color: "#aaa" }]}>
                {cat.name}
              </Text>
            </View>
          ))}

          {/* ADD CATEGORY */}
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              router.push({
                pathname: "/category/addCategory",
                params: { type },
              })
            }
          >
            <Ionicons name="add-circle" size={22} color="#28a745" />
            <Text style={styles.listText}>Add Category</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabs />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
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

  listContainer: {
    marginTop: 10,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  listText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
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
});