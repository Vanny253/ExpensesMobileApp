import { View, Text } from "react-native";
import BottomTabs from "../../components/_BottomTabs";

export default function ContactUsScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Main Content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20 }}>Contact Us</Text>
      </View>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
}
