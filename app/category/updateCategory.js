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
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import API_URL from "../../api/config";
import { deleteCategory } from "../../api/categoryApi";
import { Ionicons } from "@expo/vector-icons";

// 🔥 SAME ICON LIST AS ADD PAGE
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
  "heart",
];

export default function UpdateCategory() {
  const { id, name, icon, type } = useLocalSearchParams();

  const [categoryName, setCategoryName] = useState(name);
  const [selectedIcon, setSelectedIcon] = useState(icon);

  const updateCategory = async () => {
    try {
      await axios.put(`${API_URL}/categories/${id}`, {
        name: categoryName,
        icon: selectedIcon,
        type,
      });

      Alert.alert("Success", "Category updated");
      router.back();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to update category");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCategory(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Category</Text>

      {/* NAME */}
      <TextInput
        value={categoryName}
        onChangeText={setCategoryName}
        style={styles.input}
        placeholder="Category name"
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

      {/* SAVE */}
      <TouchableOpacity style={styles.saveBtn} onPress={updateCategory}>
        <Text style={styles.btnText}>Save Changes</Text>
      </TouchableOpacity>

      {/* DELETE */}
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.btnText}>Delete Category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },

  iconGrid: {
    marginTop: 10,
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

  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },

  deleteBtn: {
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  btnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
});