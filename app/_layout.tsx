import { Drawer } from "expo-router/drawer";

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
      }}
    >
      {/* Bottom Tabs */}
      <Drawer.Screen
        name="(tabs)"
        options={{ drawerLabel: "Home" }}
      />

      {/* Individual Drawer Screens */}
      <Drawer.Screen
        name="(drawer)"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen name="(drawer)/category" options={{ drawerLabel: "Category" }} />
      <Drawer.Screen name="(drawer)/reminder" options={{ drawerLabel: "Reminder" }} />
      <Drawer.Screen name="(drawer)/regular_payment" options={{ drawerLabel: "Regular Payment" }} />
      <Drawer.Screen name="(drawer)/budget" options={{ drawerLabel: "Budget" }} />
      <Drawer.Screen name="(drawer)/export_data" options={{ drawerLabel: "Export Data" }} />
      <Drawer.Screen name="(drawer)/about_us" options={{ drawerLabel: "About Us" }} />
      <Drawer.Screen name="(drawer)/contact_us" options={{ drawerLabel: "Contact Us" }} />
    </Drawer>
  );
}
