import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Drawer
        screenOptions={{
          headerShown: true,
          drawerType: "slide",
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
          }}
        />

        <Drawer.Screen
          name="reminder"
          options={{
            drawerLabel: "Reminder",
            title: "Reminder",
          }}
        />

        <Drawer.Screen
          name="regular_payment"
          options={{
            drawerLabel: "Regular Payment",
            title: "Regular Payment",
          }}
        />

        <Drawer.Screen
          name="budget"
          options={{
            drawerLabel: "Budget",
            title: "Budget",
          }}
        />

        <Drawer.Screen
          name="export_data"
          options={{
            drawerLabel: "Export Data",
            title: "Export Data",
          }}
        />

        <Drawer.Screen
          name="about_us"
          options={{
            drawerLabel: "About Us",
            title: "About Us",
          }}
        />

        <Drawer.Screen
          name="contact_us"
          options={{
            drawerLabel: "Contact Us",
            title: "Contact Us",
          }}
        />

        <Drawer.Screen
          name="income"
          options={{
            drawerLabel: "Income",
            title: "Income",
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