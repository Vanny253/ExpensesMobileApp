// app/drawer/tabs/profileDetail.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useUser } from "../context/UserContext";
import { updateUser } from "../api/userApi";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ProfileDetail() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [gender, setGender] = useState(user?.gender || "");

  const [dateOfBirth, setDateOfBirth] = useState(user?.date_of_birth || "");
  const [dobDate, setDobDate] = useState(
    user?.date_of_birth ? new Date(user.date_of_birth) : new Date()
  );
  const [showPicker, setShowPicker] = useState(false);

  const [image, setImage] = useState(
    user?.profile_image ? user.profile_image : null
  );

  // 📸 Pick Image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 💾 Save
  const handleSave = async () => {
    try {
      if (!user) return;

      const formData = new FormData();

      formData.append("nickname", nickname);
      formData.append("email", email);
      formData.append("phone_number", phoneNumber);
      formData.append("gender", gender);
      formData.append("date_of_birth", dateOfBirth);

      if (image && image.startsWith("file")) {
        formData.append("profile_image", {
          uri: image,
          name: "profile.jpg",
          type: "image/jpeg",
        });
      }

      const updatedUser = await updateUser(user.user_id, formData);

      setUser(updatedUser);
      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Update failed");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Image */}
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        <Image
            source={{
                uri: image
                ? image + "?t=" + new Date().getTime()
                : "https://via.placeholder.com/100",
            }}
            style={styles.image}
        />
        <Text style={styles.changeText}>Change Profile Picture</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nickname</Text>
      <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} />

      <Text style={styles.label}>Gender</Text>
      <TextInput style={styles.input} value={gender} onChangeText={setGender} />

      {/* DOB Picker */}
      <Text style={styles.label}>Date of Birth</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
        <Text>
          {dobDate ? dobDate.toISOString().split("T")[0] : "Select Date"}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dobDate}
          mode="date"
          maximumDate={new Date()}
          display="default"
          onChange={(event, selectedDate) => {
            setShowPicker(Platform.OS === "ios");
            if (selectedDate) {
              setDobDate(selectedDate);
              setDateOfBirth(selectedDate.toISOString().split("T")[0]);
            }
          }}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f2f2f2" },
  label: { fontSize: 16, marginTop: 15 },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  imageContainer: { alignItems: "center", marginBottom: 20 },
  image: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ccc" },
  changeText: { color: "#007AFF", marginTop: 10 },
});