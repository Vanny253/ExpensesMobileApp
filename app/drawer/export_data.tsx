import { View, Text } from "react-native";
import BottomTabs from "../../components/_BottomTabs";

export default function ExportDataScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Main Content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20 }}>Export Data</Text>
      </View>

      {/* Bottom Tabs */}
      <BottomTabs />
    </View>
  );
}
