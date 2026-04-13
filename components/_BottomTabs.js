import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function BottomTabs() {
  return (
    <View
      style={{
        height: 73,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "#a3d2fe",
        paddingLeft: 20,
        paddingRight: 20,
        marginLeft: -20,
        marginRight: -20,
      }}
    >
      {/* Expenses Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        onPress={() => router.push("/drawer/tabs/")}
      >
        <Ionicons name="cash-outline" size={22} color="#515151" />
        <Text style={{ fontSize: 10, color: "#515151" }}>Expenses</Text>
      </TouchableOpacity>

      {/* Charts Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        onPress={() => router.push("/drawer/tabs/charts")}
      >
        <Ionicons name="pie-chart-outline" size={22} color="#515151" />
        <Text style={{ fontSize: 10, color: "#515151" }}>Charts</Text>
      </TouchableOpacity>

      {/* ADD BUTTON */}
      <TouchableOpacity
        onPress={() => router.push("/drawer/tabs/add_expense")}
        style={{
          width: 50,
          height: 50,
          borderRadius: 30,
          backgroundColor: "#007AFF",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 50,
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Report Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15 }}
        onPress={() => router.push("/drawer/tabs/report")}
      >
        <Ionicons name="document-text-outline" size={24} color="#515151" />
        <Text style={{ fontSize: 10, color: "#515151" }}>Report</Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        onPress={() => router.push("/drawer/tabs/profile")}
      >
        <Ionicons name="person-circle-outline" size={22} color="#515151" />
        <Text style={{ fontSize: 10, color: "#515151" }}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}