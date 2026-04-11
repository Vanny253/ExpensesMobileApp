import { Tabs, useNavigation, router } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";

export default function TabsLayout() {
  const navigation = useNavigation();

  return (
    <>
      <Tabs
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Ionicons name="menu-outline" size={28} />
            </TouchableOpacity>
          ),
          
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#515151",
          tabBarStyle: {
            height: 70,    
            paddingBottom: 15,
            backgroundColor: "#a3d2fe",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Expenses",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="charts"
          options={{
            title: "Charts",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />

        {/* ADD BUTTON (Middle) */}
        <Tabs.Screen
          name="add_expense"
          options={{
            title: "",
            tabBarIcon: () => (
              <View
                style={{
                  width: 55,
                  height: 55,
                  borderRadius: 30,
                  backgroundColor: "#007AFF",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 30,
                }}
              >
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="report"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="person-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        onPress={() => router.push("../chatbot/chatbot")}
        style={{
          position: "absolute",
          bottom: 75,
          right: 10,
          width: 50,
          height: 50,
          borderRadius: 30,
          backgroundColor: "#ffffffff",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <MaterialCommunityIcons
          name="robot-happy"
          size={30}
          color="#332f2fff"
        />
      </TouchableOpacity>
    </>
  );
}