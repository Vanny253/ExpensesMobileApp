import { Drawer } from "expo-router/drawer";

export default function RootLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        drawerType: "slide",
      }}
    >
      {/* Bottom Tabs */}
      <Drawer.Screen
        name="(tabs)"
        options={{ 
          drawerLabel: "Home",
          headerShown: false,
         }}
      />

      {/* Individual Drawer Screens */}
      <Drawer.Screen
        name="(drawer)"
        options={{
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="(drawer)/category"
        options={{ drawerLabel: "Category", title: "Category" }}
      />
      <Drawer.Screen
        name="(drawer)/reminder"
        options={{ drawerLabel: "Reminder", title: "Reminder" }}
      />
      <Drawer.Screen
        name="(drawer)/regular_payment"
        options={{ drawerLabel: "Regular Payment", title: "Regular Payment" }}
      />
      <Drawer.Screen
        name="(drawer)/budget"
        options={{ drawerLabel: "Budget", title: "Budget" }}
      />
      <Drawer.Screen
        name="(drawer)/export_data"
        options={{ drawerLabel: "Export Data", title: "Export Data" }}
      />
      <Drawer.Screen
        name="(drawer)/about_us"
        options={{ drawerLabel: "About Us", title: "About Us" }}
      />
      <Drawer.Screen
        name="(drawer)/contact_us"
        options={{ drawerLabel: "Contact Us", title: "Contact Us" }}
      />

    </Drawer>
  );
}
