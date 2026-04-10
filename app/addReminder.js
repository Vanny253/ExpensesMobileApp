// app/screens/AddReminder.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useUser } from "../context/UserContext";
import { Picker } from "@react-native-picker/picker";
import { addReminder } from "../api/reminderApi";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AddReminder() {
  const router = useRouter();
  const { user } = useUser();

  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("once");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const formatDate = (d) => d.toISOString().split("T")[0];
  const formatTime = (d) => d.toTimeString().split(" ")[0];

  // Helper function to schedule notifications
  const scheduleReminderNotification = async (reminderName, dateObj, frequency) => {
    let trigger;

    switch (frequency) {
      case "once":
        trigger = dateObj;
        break;
      case "daily":
        trigger = { hour: dateObj.getHours(), minute: dateObj.getMinutes(), repeats: true };
        break;
      case "weekly":
        trigger = { weekday: dateObj.getDay() + 1, hour: dateObj.getHours(), minute: dateObj.getMinutes(), repeats: true };
        break;
      case "monthly":
        trigger = { day: dateObj.getDate(), hour: dateObj.getHours(), minute: dateObj.getMinutes(), repeats: true };
        break;
      default:
        trigger = dateObj;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reminder",
        body: `It's time to: ${reminderName}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    return notificationId;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Reminder name is required");
      return;
    }

    if (!user || !user.user_id) {
      Alert.alert("Error", "User not logged in");
      return;
    }

    try {
      // 1️⃣ Add reminder to backend
      const response = await addReminder({
        user_id: user.user_id,
        name: name.trim(),
        frequency,
        start_date: formatDate(date),
        time: formatTime(time),
        note: note || "",
      });

      // 2️⃣ Combine date + time into one Date object
      const reminderDateTime = new Date(date);
      reminderDateTime.setHours(time.getHours());
      reminderDateTime.setMinutes(time.getMinutes());
      reminderDateTime.setSeconds(0);

      // 3️⃣ Schedule notification
      await scheduleReminderNotification(name.trim(), reminderDateTime, frequency);

      // 4️⃣ Alert success and go back
      Alert.alert("Success", "Reminder added!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.error || "Failed to add reminder");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Reminder</Text>

      <TextInput
        placeholder="Reminder Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Frequency</Text>
      <Picker
        selectedValue={frequency}
        onValueChange={(val) => setFrequency(val)}
        style={styles.picker}
      >
        <Picker.Item label="Once" value="once" />
        <Picker.Item label="Daily" value="daily" />
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Monthly" value="monthly" />
      </Picker>

      <TouchableOpacity onPress={() => setShowDate(true)}>
        <Text style={styles.input}>Date: {formatDate(date)}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowDate(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowTime(true)}>
        <Text style={styles.input}>Time: {formatTime(time)}</Text>
      </TouchableOpacity>
      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(e, selectedTime) => {
            setShowTime(false);
            if (selectedTime) setTime(selectedTime);
          }}
        />
      )}

      <TextInput
        placeholder="Note"
        style={styles.input}
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Add Reminder</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  input: { borderWidth: 1, padding: 10, marginVertical: 8, borderRadius: 8 },
  label: { marginTop: 10, fontWeight: "bold" },
  picker: { marginVertical: 8 },
  button: {
    marginTop: 20,
    backgroundColor: "green",
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
  },
});