// app/screens/Reminder.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomTabs from "../../components/_BottomTabs";
import { useRouter } from "expo-router";
import { useUser } from "../../context/UserContext";
import { getReminders } from "../../api/reminderApi";

export default function ReminderScreen() {
  const router = useRouter();
  const { user } = useUser(); // Logged-in user
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    if (!user || !user.user_id) return; // ensure user is logged in
    try {
      const data = await getReminders(user.user_id); // use API from reminderApi.ts
      setReminders(data);
    } catch (error) {
      console.log("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/reminderDetail",
          params: { reminder: JSON.stringify(item) }, // pass full reminder object
        })
      }
    >
      <View style={styles.card}>
        <Text style={styles.title}>{item.name}</Text>
        <Text>Frequency: {item.frequency}</Text>
        <Text>Date: {item.start_date}</Text>
        <Text>Time: {item.time}</Text>
        {item.note ? <Text>Note: {item.note}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.header}>Reminders</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.reminder_id.toString()}
            renderItem={renderItem}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            router.push({
              pathname: "/addReminder",
            })
          }
        >
          <Text style={styles.addText}>+ Add Reminder</Text>
        </TouchableOpacity>
      </View>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  card: { padding: 15, backgroundColor: "#f2f2f2", marginBottom: 10, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: "bold" },
  addButton: { backgroundColor: "#007bff", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  addText: { color: "#fff", fontWeight: "bold" },
});