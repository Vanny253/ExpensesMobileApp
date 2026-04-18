import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import { getExpenses, getIncome } from "../api/expenseApi";
import BackgroundWrapper from "../components/backgroundWrapper";
import AppHeader from "../components/appHeader";


export default function SearchTransaction() {
  const { user } = useUser();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [allData, setAllData] = useState([]);
  const [filtered, setFiltered] = useState([]);

  /* 🔥 LOAD DATA */
  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [expenses, income] = await Promise.all([
        getExpenses(user.user_id),
        getIncome(user.user_id),
      ]);

      const merged = [
        ...expenses.map((e) => ({ ...e, type: "expense" })),
        ...income.map((i) => ({ ...i, type: "income" })),
      ];

      setAllData(merged);
      setFiltered(merged);
    };

    load();
  }, [user]);

  /* 🔍 SEARCH */
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(allData);
      return;
    }

    const lower = query.toLowerCase();

    const result = allData.filter((item) => {
      const title = item.title?.toLowerCase() || "";
      const category = item.category?.toLowerCase() || "";

      return title.includes(lower) || category.includes(lower);
    });

    setFiltered(result);
  }, [query]);

  return (
    <BackgroundWrapper>

        <AppHeader
            title="Search Transactions"
            backRoute="/drawer/tabs"
        />
      {/* ✅ HEADER */}
      <Stack.Screen
        options={{
          title: "Search",
          headerStyle: {
            backgroundColor: "#a3d2fe",
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="arrow-back" size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 🔍 SEARCH INPUT */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} />
        <TextInput
          placeholder="Search transaction..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
        />
      </View>

      {/* 📋 RESULT LIST */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={({ item }) => (
            <TouchableOpacity
                onPress={() =>
                router.push({
                    pathname: "/transactionDetail",
                    params: {
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    amount: item.amount,
                    category: item.category,
                    date: item.date,
                    },
                })
                }
            >
                <View style={styles.card}>
                <Text style={styles.title}>
                    {item.title || "No title"}
                </Text>

                <Text style={styles.category}>
                    {item.category}
                </Text>

                <Text
                    style={[
                    styles.amount,
                    {
                        color:
                        item.type === "income" ? "#1aa34a" : "#e03131",
                    },
                    ]}
                >
                    RM {item.amount}
                </Text>
                </View>
            </TouchableOpacity>
            )}
      />
    </BackgroundWrapper>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    paddingTop: 80,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  input: {
    marginLeft: 10,
    flex: 1,
  },

  card: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#888",
    backgroundColor: "#ffffffcc",
  },

  title: {
    fontWeight: "bold",
    fontSize: 14,
  },

  category: {
    color: "#555",
    marginTop: 2,
  },

  amount: {
    marginTop: 5,
    fontWeight: "bold",
    fontSize: 15,
  },
});