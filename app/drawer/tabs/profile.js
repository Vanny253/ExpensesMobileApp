// app/drawer/tabs/profile.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useUser } from "../../../context/UserContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileTab() {
  const { user, setUser } = useUser();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => setUser(null),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Account", "This action cannot be undone!", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // TODO: call delete API here
          setUser(null);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {user ? (
        <>
          {/* Profile Card */}
          <View style={styles.card}>
            <View style={styles.avatar} />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user.nickname}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.gender}>
                {user.gender || "Not specified"}
              </Text>
            </View>

            <TouchableOpacity>
              <Ionicons name="pencil" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.item} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#333" />
              <Text style={styles.itemText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="red" />
              <Text style={[styles.itemText, { color: "red" }]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.guestContainer}>
          <Text style={styles.guestText}>You are currently a Guest</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/profile/login")}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "#aaa" }]}
            onPress={() => router.push("/profile/signup")}
          >
            <Text style={styles.buttonText}>Signup</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 15,
  },

  // Profile Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    marginRight: 15,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  email: {
    color: "#666",
    marginTop: 2,
  },

  gender: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },

  // Actions
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  itemText: {
    marginLeft: 10,
    fontSize: 16,
  },

  // Guest
  guestContainer: {
    alignItems: "center",
    marginTop: 50,
  },

  guestText: {
    fontSize: 18,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginBottom: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});