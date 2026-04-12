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
import { Image } from "react-native";
import BackgroundWrapper from "../../../components/backgroundWrapper";



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
    <BackgroundWrapper>
      <ScrollView style={styles.container}>
        {user ? (
          <>
            {/* Profile Card */}
            <View style={styles.card}>
              <Image
                source={
                  user?.profile_image
                    ? { uri: user.profile_image + "?t=" + new Date().getTime() }
                    : require("../../../assets/images/default.png")
                }
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.nickname}</Text>
                <Text style={styles.email}>{user.email}</Text>
                <Text style={styles.gender}>
                  {user.gender || "Not specified"}
                </Text>
              </View>

              {/* PEN ICON: Navigate to Profile Detail */}
              <TouchableOpacity onPress={() => router.push("/profileDetail")}>
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

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/profile/login")}
              >
                <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signupButton}
                onPress={() => router.push("/profile/signup")}
              >
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginRight: 15,
    backgroundColor: "#ddd",
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
    paddingVertical: 1,
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

  // Guest
guestContainer: {
  alignItems: "center",
  marginTop: 80,
},

guestText: {
  fontSize: 20,
  fontWeight: "600",
  marginBottom: 30,
  color: "#333",
},

buttonGroup: {
  width: "100%",
  alignItems: "center",
  gap: 15,
},

// 🔵 Login (Primary)
loginButton: {
  backgroundColor: "#007AFF",
  paddingVertical: 14,
  borderRadius: 25,
  width: "85%",
  alignItems: "center",
  elevation: 3,
},

loginText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},

// ⚪ Signup (Secondary)
signupButton: {
  backgroundColor: "#fff",
  paddingVertical: 14,
  borderRadius: 25,
  width: "85%",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#007AFF",
},

signupText: {
  color: "#007AFF",
  fontWeight: "600",
  fontSize: 16,
},
});