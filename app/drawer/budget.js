import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

import Svg, { Circle } from "react-native-svg";

import BottomTabs from "../../components/_BottomTabs";
import { getBudgets } from "../../api/budgetApi";
import { getCategories } from "../../api/categoryApi";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import BackgroundWrapper from "../../components/backgroundWrapper";
import { DEFAULT_EXPENSE_CATEGORIES } from "../../components/defaultIcon";

export default function BudgetScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState({});

  const loadBudgets = async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const now = new Date();

      const data = await getBudgets(
        user.user_id,
        now.getMonth() + 1,
        now.getFullYear()
      );

      setBudgets(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
    loadCategoryMap();
  }, [user]);

  // =========================
  // CATEGORY MAP
  // =========================
  const loadCategoryMap = async () => {
    if (!user) return;

    try {
      const dbCats = await getCategories(user.user_id, "expense");

      const map = {};

      dbCats.forEach((c) => {
        const id = String(c?.id ?? "").toLowerCase().trim();
        const name = c?.name || id;

        if (id) map[id] = name;
        if (name) map[name.toLowerCase()] = name;
      });

      DEFAULT_EXPENSE_CATEGORIES.forEach((c) => {
        map[c.id.toLowerCase()] = c.name;
        map[c.name.toLowerCase()] = c.name;
      });

      setCategoryMap(map);
    } catch (err) {
      console.log("CATEGORY MAP ERROR:", err);
    }
  };

  // =========================
  // SVG CIRCLE COMPONENT
  // =========================
const BudgetCircle = ({ budget, spent, size = 80 }) => {
  const remaining = budget - spent;

  const percent = budget > 0 ? Math.max(0, (remaining / budget) * 100) : 0;
  const isExceeded = remaining < 0;

  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // IMPORTANT: clamp progress to max 100
  const progress = Math.min(Math.max(percent, 0), 100);

  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  const strokeColor = isExceeded ? "#f05850c4" : "#007AFF";

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        {/* BACKGROUND CIRCLE */}
        <Circle
          stroke={isExceeded ? "#f05850c4" : "#e6e6e6"} 
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        {/* PROGRESS CIRCLE */}
        <Circle
          stroke={strokeColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>

      {/* CENTER TEXT */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        {isExceeded ? (
          <Text style={{ color: "#FF3B30", fontWeight: "bold", fontSize: 11 }}>
            EXCEED
          </Text>
        ) : (
          <>
            <Text style={{ fontSize: 10, color: "#555" }}>
              Remaining
            </Text>

            <Text style={{ fontWeight: "bold", fontSize: 14 }}>
              {percent.toFixed(0)}%
            </Text>
          </>
        )}
      </View>
    </View>
  );
};



  // =========================
  // CATEGORY NAME
  // =========================
  const getCategoryName = (value) => {
    if (!value) return "-";

    const key = String(value).toLowerCase().trim();

    if (categoryMap[key]) return categoryMap[key];

    if (key.startsWith("default-")) {
      const index = parseInt(key.split("-")[1], 10) - 1;
      const match = DEFAULT_EXPENSE_CATEGORIES[index];
      if (match) return match.name;
    }

    return key
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleOpenDetail = (budget) => {
    router.push({
      pathname: "/budgetDetail",
      params: {
        id: budget.id,
        category: budget.category,
        budget: budget.budget,
        spent: budget.spent,
        remaining: budget.remaining,
        month: budget.month,
        year: budget.year,
      },
    });
  };

  if (!user) {
    return (
      <BackgroundWrapper>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.guestText}>
            Guest Mode: Please login to manage budgets.
          </Text>
        </View>
        <BottomTabs />
      </BackgroundWrapper>
    );
  }

  return (
    <BackgroundWrapper>
      <View style={{ flex: 1 }}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <FlatList
              data={budgets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleOpenDetail(item)}>
                  <View style={styles.card}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      
                      {/* LEFT: SVG CIRCLE */}
                      <BudgetCircle
                        budget={item.budget}
                        spent={item.spent}
                        size={90}
                      />

                      {/* RIGHT: INFO */}
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.category}>
                          {getCategoryName(item.category)}
                        </Text>

                        <Text>Budget: RM{item.budget.toFixed(2)}</Text>
                        <Text>Spent: RM{item.spent.toFixed(2)}</Text>
                        <Text>Remaining: RM{item.remaining.toFixed(2)}</Text>
                      </View>

                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", marginTop: 20 }}>
                  No budgets yet. Add one!
                </Text>
              }
            />
          )}
        </View>

        <BottomTabs />
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginLeft: -15,
    marginTop: -15,
    marginRight: -15,
  },

  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "rgb(182,182,182)",
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#ffffff71",
  },

  category: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  guestText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 16,
  },
});