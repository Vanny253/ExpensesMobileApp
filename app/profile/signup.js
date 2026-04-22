// app/profile/signup.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { signupUser } from "../../api/userApi";
import { router } from "expo-router";
import BackgroundWrapper from "../../components/backgroundWrapper";
import AppHeader from "../../components/appHeader";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});
  

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z]).{8,}$/;
    return regex.test(password);
  };

  const validatePhoneMY = (phone) => {
    if (!phone) return true; // optional field

    const cleaned = phone.replace(/\D/g, ""); // remove non-digits

    // Malaysian format: starts with 01 and 10-11 digits total
    const regex = /^01\d{8,9}$/;
    return regex.test(cleaned);
  };


  const handleSignup = async () => {

    let newErrors = {};

    if (!email) {
      newErrors.email = "Email is required (e.g. example@gmail.com)";
    } else if (!validateEmail(email)) {
      newErrors.email =
        "Please enter a valid email like example@gmail.com (must include @ and domain)";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password =
        "At least 8 characters and 1 uppercase letter required";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!nickname) {
      newErrors.nickname = "Nickname is required";
    }

    if (!gender) {
      newErrors.gender = "Please select gender";
    }

    if (!validatePhoneMY(phone)) {
    newErrors.phone =
      "Invalid phone number format. (must start with 01 and contain 10-11 digits)";
    }

    // stop if errors exist
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // clear errors if valid
    setErrors({});

    

    try {
      await signupUser({
      email,
      password,
      nickname,
      phone_number: phone,
      gender,
      date_of_birth: dob,
    });

      Alert.alert("Signup successful!", "Please login now.");
      router.push("./login"); // go to login page
    } catch (err) {
      Alert.alert("Signup failed", err?.message || "Something went wrong");
    }
  };

  return (
    <BackgroundWrapper>
      <AppHeader backRoute="drawer/tabs/profile" /> 
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Signup</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />          
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}


        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>
          <Text style={styles.error}>{errors.confirmPassword}</Text>


        <TextInput
          style={styles.input}
          placeholder="Nickname"
          value={nickname}
          onChangeText={setNickname}
        />
        {errors.nickname && <Text style={styles.error}>{errors.nickname}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Phone number (optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gender}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
        </View>
        {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>
            {dob ? dob : "Select Date of Birth"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dob ? new Date(dob) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);

              if (selectedDate) {
                const formattedDate = selectedDate.toISOString().split("T")[0];
                setDob(formattedDate);
              }
            }}
            maximumDate={new Date()} // prevent future dates
          />
        )}

        {/* CUSTOM BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Signup</Text>
        </TouchableOpacity>
      </ScrollView>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 10,
  },

  eye: {
    fontSize: 18,
    marginLeft: 10,
  },

  pickerContainer: {
    borderWidth: 1.5,
    borderColor: "rgb(182, 182, 182)",
    borderRadius: 5,
    marginBottom: 15,
    overflow: "hidden",
  },

  error: {
    color: "red",
    fontSize: 13,
    marginBottom: 10,
    marginTop: -10,
  },
});