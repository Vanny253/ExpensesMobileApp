import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

export default function BottomTabs() {
  const pathname = usePathname(); // current route path

  // function to determine color
  const getColor = (path: string) => (pathname === path ? "#007AFF" : "grey");

  return (
    <View
      style={{
        height: 73,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopWidth: 1,
        borderColor: "#ddd",
        backgroundColor: "white",
      }}
    >
      {/* Expenses Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        // @ts-ignore
        onPress={() => router.push("/drawer/tabs/")}
      >
        <Ionicons name="cash-outline" size={22} color={getColor("/drawer/tabs/index")} />
        <Text style={{ fontSize: 10, color: getColor("/drawer/tabs/index") }}>Expenses</Text>
      </TouchableOpacity>

      {/* Charts Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        // @ts-ignore
        onPress={() => router.push("/drawer/tabs/charts")}
      >
        <Ionicons name="pie-chart-outline" size={22} color={getColor("/drawer/tabs/charts")} />
        <Text style={{ fontSize: 10, color: getColor("/drawer/tabs/charts") }}>Charts</Text>
      </TouchableOpacity>

      {/* ADD BUTTON (middle) */}
      <TouchableOpacity
        onPress={() => router.push("/drawer/tabs/add_expense")}
        style={{
          width: 50,
          height: 50,
          borderRadius: 30,
          backgroundColor: "#007AFF",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 50, // floating
        }}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Report Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15 }}
        // @ts-ignore
        onPress={() => router.push("/drawer/tabs/report")}
      >
        <Ionicons name="document-text-outline" size={24} color={getColor("/drawer/tabs/report")} />
        <Text style={{ fontSize: 10, color: getColor("/report") }}>Report</Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={{ justifyContent: "center", alignItems: "center", marginTop: -15, marginLeft: -5 }}
        // @ts-ignore
        onPress={() => router.push("/drawer/tabs/profile")}
      >
        <Ionicons name="person-circle-outline" size={22} color={getColor("/drawer/tabs/profile")} />
        <Text style={{ fontSize: 10, color: getColor("/drawer/tabs/profile") }}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
