import { Drawer } from "expo-router/drawer";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Drawer
        screenOptions={{
          headerShown: true,
          drawerType: "slide",
          drawerStyle: {
            width: 250, // 👈 half screen
          },
        }}
      >
        {/* Bottom Tabs */}
        <Drawer.Screen
          name="tabs"
          options={{
            drawerLabel: "Home",
            headerShown: false,
          }}
        />

        {/* Drawer Screens */}
        <Drawer.Screen
          name="category"
          options={{
            drawerLabel: "Category",
            title: "Category",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            
          }}
        />

        <Drawer.Screen
          name="reminder"
          options={{
            drawerLabel: "Reminder",
            title: "Reminder",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />

        <Drawer.Screen
          name="regular_payment"
          options={{
            drawerLabel: "Regular Payment",
            title: "Regular Payment",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />

        <Drawer.Screen
          name="budget"
          options={{
            drawerLabel: "Budget",
            title: "Budget",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />

        <Drawer.Screen
          name="export_data"
          options={{
            drawerLabel: "Export Data",
            title: "Export Data",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />

        <Drawer.Screen
          name="about_us"
          options={{
            drawerLabel: "About Us",
            title: "About Us",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />

        <Drawer.Screen
          name="contact_us"
          options={{
            drawerLabel: "Contact Us",
            title: "Contact Us",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});