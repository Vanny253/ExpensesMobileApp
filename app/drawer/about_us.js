import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "../../components/_BottomTabs";
import BackgroundWrapper from "../../components/backgroundWrapper";


export default function AboutUsScreen() {
  return (
    <BackgroundWrapper>
      <View style={{ flex: 1 }}>
        {/* Main Content */}
        <ScrollView style={styles.container}>
          <Text style={styles.title}>About This App</Text>

          {/* Description */}
          <View style={styles.card}>
            <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
            <Text style={styles.text}>
              This Mobile Expense Tracker is developed to help users manage their
              daily finances efficiently. Users can track expenses, monitor income,
              and gain better control over their financial habits.
            </Text>
          </View>

          {/* Features */}
          <Text style={styles.sectionTitle}>Key Features</Text>

          <View style={styles.card}>
            <Text style={styles.feature}>🎤 Voice Input</Text>
            <Text style={styles.desc}>
              Add transactions quickly using voice commands.
            </Text>

            <Text style={styles.feature}>🧾 Receipt Scanning</Text>
            <Text style={styles.desc}>
              Capture receipts and extract expense details automatically.
            </Text>

            <Text style={styles.feature}>📊 Smart Budget Assistant</Text>
            <Text style={styles.desc}>
              Analyze spending patterns and provide smart suggestions.
            </Text>

            <Text style={styles.feature}>🔁 Regular Payments</Text>
            <Text style={styles.desc}>
              Manage recurring expenses and income automatically.
            </Text>

            <Text style={styles.feature}>📈 Reports & Analytics</Text>
            <Text style={styles.desc}>
              View charts and summaries of your financial data.
            </Text>
          </View>

          {/* Version */}
          <Text style={styles.sectionTitle}>Version</Text>
          <View style={styles.card}>
            <Text style={styles.text}>v1.0.0</Text>
          </View>
        </ScrollView>

        {/* Bottom Tabs */}
        <BottomTabs />
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },

  text: {
    fontSize: 14,
    color: "#333",
    marginTop: 5,
  },

  feature: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },

  desc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
});