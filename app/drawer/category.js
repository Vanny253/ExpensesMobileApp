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
import BackgroundWrapper from "../../components/backgroundWrapper";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../../components/defaultIcon";

const STORAGE_KEY = "removed_categories";

export default function CategoryScreen() {
  const { user } = useUser();

  const [type, setType] = useState("expense");
  const [customCategories, setCustomCategories] = useState([]);
  const [removedKeys, setRemovedKeys] = useState([]);

  /* ---------------- FIX: PUT INSIDE COMPONENT ---------------- */
  const isDefaultCategory = (cat) => {
    return type === "expense"
      ? DEFAULT_EXPENSE_CATEGORIES.some((c) => c.id === cat.id)
      : DEFAULT_INCOME_CATEGORIES.some((c) => c.id === cat.id);
  };

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

  /* ---------------- TOGGLE REMOVE ---------------- */
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

  /* ---------------- FETCH ---------------- */
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

  /* ---------------- MERGE ---------------- */
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
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <View style={styles.guestContainer}>
            <Text style={styles.guestText}>
              Guest Mode: Please login to manage categories.
            </Text>
          </View>
        </View>

        <BottomTabs />
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
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


          {/* ACTIVE */}
          <View style={styles.listContainer}>
            {visibleCategories.map((cat, index) => (
              <View key={index} style={styles.listItem}>
                <TouchableOpacity onPress={() => toggleCategory(cat)}>
                  <Ionicons name="remove-circle" size={20} color="#FF3B30" style={{ paddingRight: 10 }} />
                </TouchableOpacity>

                <Ionicons name={cat.icon} size={22} color="#007AFF" />

                <Text style={styles.listText}>{cat.name}</Text>

                {!isDefaultCategory(cat) && (
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
                    <Ionicons name="create-outline" size={18} color="#887878" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* REMOVED */}
            {removedCategories.map((cat, index) => (
              <View key={`removed-${index}`} style={styles.listItem}>
                <TouchableOpacity onPress={() => toggleCategory(cat)}>
                  <Ionicons name="add-circle" size={20} color="#28a745" />
                </TouchableOpacity>

                <Ionicons name={cat.icon} size={22} color="#887878" />

                <Text style={[styles.listText, { color: "#887878" }]}>
                  {cat.name}
                </Text>
              </View>
            ))}

            {/* ADD */}
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
    </BackgroundWrapper>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  scrollContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  subtitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },

  typeContainer: { flexDirection: "row", marginBottom: 15 },

  typeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },

  activeType: { backgroundColor: "#007AFF" },
  activeText: { color: "white", fontWeight: "bold" },

  listContainer: { marginTop: 10 },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#007AFF",
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