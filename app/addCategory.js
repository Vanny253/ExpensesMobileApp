import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { addCategory } from "../api/categoryApi";

export default function AddCategoryScreen() {
  const { user } = useUser();
  const { type } = useLocalSearchParams();

  const [name, setName] = useState("");

    const handleSave = async () => {
        if (!name) {
            Alert.alert("Error", "Please enter category name");
            return;
        }

        console.log("Saving category:", {
        user_id: user.user_id,
        type: type,
        name: name,
        icon: "default-icon"
        });
        console.log("Current user:", user);

        try {
            await addCategory({
                user_id: user.user_id,
                type: type,
                name: name,
                icon: "default-icon"
            });

            Alert.alert("Success", "Category created successfully");

            router.back();

        } catch (error) {
            Alert.alert("Error", "Failed to create category");
            console.log(error);
        }
    };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Category</Text>

      <Text style={styles.label}>Category Type</Text>
      <Text style={styles.type}>{type}</Text>

      <Text style={styles.label}>Category Name</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter category name"
        value={name}
        onChangeText={setName}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Ionicons name="checkmark-circle" size={20} color="white" />
        <Text style={styles.saveText}>Save Category</Text>
      </TouchableOpacity>

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