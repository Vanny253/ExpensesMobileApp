// app/screens/ReminderDetail.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { updateReminder, deleteReminder } from "../api/reminderApi";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";


export default function ReminderDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const reminder = params.reminder ? JSON.parse(params.reminder) : {};

  const [name, setName] = useState(reminder.name || "");
  const [frequency, setFrequency] = useState(reminder.frequency || "once");
  const [note, setNote] = useState(reminder.note || "");
  const [date, setDate] = useState(reminder.start_date ? new Date(reminder.start_date) : new Date());
  const [time, setTime] = useState(reminder.time ? new Date(`1970-01-01T${reminder.time}`) : new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const formatDate = (d) => d.toISOString().split("T")[0];
  const formatTime = (d) => d.toTimeString().split(" ")[0];

    const handleUpdate = async () => {
    if (!name.trim()) {
        Alert.alert("Error", "Reminder name is required");
        return;
    }

    try {
        // 1️⃣ Update reminder in backend
        await updateReminder(reminder.reminder_id, {
        name: name.trim(),
        frequency,
        start_date: formatDate(date),
        time: formatTime(time),
        note,
        });

        // 2️⃣ Combine date + time into one JS Date object
        const reminderDateTime = new Date(date);
        reminderDateTime.setHours(time.getHours());
        reminderDateTime.setMinutes(time.getMinutes());
        reminderDateTime.setSeconds(0);

        // 3️⃣ Schedule updated notification
        let trigger;
        switch (frequency) {
        case "once":
            trigger = reminderDateTime;
            break;
        case "daily":
            trigger = { hour: reminderDateTime.getHours(), minute: reminderDateTime.getMinutes(), repeats: true };
            break;
        case "weekly":
            trigger = { weekday: reminderDateTime.getDay() + 1, hour: reminderDateTime.getHours(), minute: reminderDateTime.getMinutes(), repeats: true };
            break;
        case "monthly":
            trigger = { day: reminderDateTime.getDate(), hour: reminderDateTime.getHours(), minute: reminderDateTime.getMinutes(), repeats: true };
            break;
        default:
            trigger = reminderDateTime;
        }

        const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: "Reminder",
            body: `It's time to: ${name.trim()}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
        });

        // optional: save notificationId with reminder in backend to cancel later
        console.log("Updated notificationId:", notificationId);

        // 4️⃣ Show success alert and go back
        Alert.alert("Success", "Reminder updated!", [
        { text: "OK", onPress: () => router.back() },
        ]);
    } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to update reminder");
    }
    };

  const handleDelete = async () => {
    Alert.alert("Confirm Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReminder(reminder.reminder_id);
            Alert.alert("Deleted", "Reminder deleted!", [
              { text: "OK", onPress: () => router.back() },
            ]);
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete reminder");
          }
        },
      },
    ]);

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

  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Reminder</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Update Reminder</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#ff3b30", marginTop: 10 }]}
        onPress={handleDelete}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete Reminder</Text>
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
  button: { backgroundColor: "#007bff", padding: 15, alignItems: "center", borderRadius: 10 },
});