import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../context/UserContext";
import { addCategory } from "../../api/categoryApi";

// 🔥 ICON OPTIONS (you can add more anytime)
const ICON_OPTIONS = [
  "fast-food",
  "car",
  "receipt",
  "cart",
  "medkit",
  "game-controller",
  "cash",
  "gift",
  "trending-up",
  "wallet",
  "laptop",
  "home",
  "restaurant",
  "airplane",
  "beer",
  "book",
  "bicycle",
  "bus",
  "camera",
  "fitness",
  "heart",
];

export default function AddCategoryScreen() {
  const { user } = useUser();
  const { type } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("fast-food");

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter category name");
      return;
    }

    try {
      await addCategory({
        user_id: user.user_id,
        type: type,
        name: name,
        icon: selectedIcon,
      });

      Alert.alert("Success", "Category created successfully");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to create category");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Category</Text>

      {/* TYPE */}
      <Text style={styles.label}>Category Type</Text>
      <Text style={styles.type}>{type}</Text>

      {/* NAME */}
      <Text style={styles.label}>Category Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter category name"
        value={name}
        onChangeText={setName}
      />

      {/* ICON PICKER */}
      <Text style={styles.label}>Choose Icon</Text>

      <FlatList
        data={ICON_OPTIONS}
        keyExtractor={(item) => item}
        numColumns={5}
        contentContainerStyle={styles.iconGrid}
        renderItem={({ item }) => {
          const isSelected = selectedIcon === item;

          return (
            <TouchableOpacity
              style={[
                styles.iconBox,
                isSelected && styles.iconBoxSelected,
              ]}
              onPress={() => setSelectedIcon(item)}
            >
              <Ionicons
                name={item}
                size={26}
                color={isSelected ? "#007AFF" : "#555"}
              />
            </TouchableOpacity>
          );
        }}
      />

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.saveText}>Save Category</Text>
      </TouchableOpacity>

      {/* CANCEL */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    marginTop: 10,
  },

  type: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },

  iconGrid: {
    marginTop: 10,
    paddingBottom: 10,
  },

  iconBox: {
    flex: 1,
    margin: 5,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },

  iconBoxSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#eaf3ff",
  },

  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },

  saveText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
  },

  cancelButton: {
    marginTop: 10,
    alignItems: "center",
  },

  cancelText: {
    color: "red",
  },
});