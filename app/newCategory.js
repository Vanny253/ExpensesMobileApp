// import React, { useState } from "react";
// import {
//   SafeAreaView,
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
// } from "react-native";
// import { useRouter, useSearchParams } from "expo-router";
// import { useUser } from "../context/UserContext";
// import { addCategory } from "../api/categoryApi";
// import { Ionicons } from "@expo/vector-icons";

// export default function NewCategoryScreen() {
//   const router = useRouter();
//   const { user } = useUser();
//   const { type } = useSearchParams(); // expense or income

//   const [name, setName] = useState("");
//   const [icon, setIcon] = useState("pricetag"); // default icon

//   if (!user) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.container}>
//           <Text style={styles.guestText}>
//             Guest Mode: Please login to add categories.
//           </Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const handleSave = async () => {
//     if (!name) {
//       Alert.alert("Error", "Please enter a category name");
//       return;
//     }

//     try {
//       await addCategory({
//         user_id: user.user_id,
//         type,
//         name,
//         icon,
//       });

//       Alert.alert("Success", "Category added successfully", [
//         { text: "OK", onPress: () => router.back() },
//       ]);
//     } catch (error) {
//       Alert.alert("Error", "Failed to add category");
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.container}>
//         <Text style={styles.title}>
//           New {type === "expense" ? "Expense" : "Income"} Category
//         </Text>

//         <TextInput
//           style={styles.input}
//           placeholder="Category Name"
//           value={name}
//           onChangeText={setName}
//         />

//         <View style={styles.iconPreview}>
//           <Ionicons name={icon} size={40} color="#007AFF" />
//           <Text style={{ marginLeft: 10 }}>Default Icon</Text>
//         </View>

//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <Text style={styles.saveText}>Save Category</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, justifyContent: "center" },
//   container: { flex: 1, padding: 20, justifyContent: "center" },

//   title: { fontSize: 24, fontWeight: "bold", marginBottom: 30, textAlign: "center" },

//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 12,
//     borderRadius: 8,
//     fontSize: 16,
//     marginBottom: 20,
//   },

//   iconPreview: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 30,
//   },

//   saveButton: {
//     backgroundColor: "#007AFF",
//     padding: 15,
//     borderRadius: 8,
//     alignItems: "center",
//   },

//   saveText: { color: "white", fontWeight: "bold", fontSize: 16 },

//   guestText: { textAlign: "center", color: "#FF3B30", marginTop: 50 },
// });