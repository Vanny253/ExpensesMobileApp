import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomTabs from "../../components/_BottomTabs";
import BackgroundWrapper from "../../components/backgroundWrapper";


export default function ContactUsScreen() {
  const handleEmail = () => {
    Linking.openURL("mailto:vannylai@example.com");
  };

  const handlePhone = () => {
    Linking.openURL("tel:+60123456789");
  };

  return (
    <BackgroundWrapper>
      <View style={{ flex: 1 }}>
        {/* Main Content */}
        <ScrollView style={styles.container}>
          <Text style={styles.title}>Contact Us</Text>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.text}>
              If you have any questions, feedback, or issues regarding the app,
              feel free to contact us through the following channels.
            </Text>
          </View>

          {/* Contact Info */}
          <Text style={styles.sectionTitle}>Get in Touch</Text>

          <View style={styles.card}>
            {/* Email */}
            <TouchableOpacity style={styles.item} onPress={handleEmail}>
              <Ionicons name="mail-outline" size={20} color="#007AFF" />
              <Text style={styles.itemText}>mobile@gmail.com</Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity style={styles.item} onPress={handlePhone}>
              <Ionicons name="call-outline" size={20} color="#007AFF" />
              <Text style={styles.itemText}>+60 12-345 6789</Text>
            </TouchableOpacity>

          </View>

          {/* Support Section */}
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.card}>
            <Text style={styles.text}>
              For technical support, please include screenshots and a clear
              description of the issue when contacting us.
            </Text>
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
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  itemText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#333",
  },
});