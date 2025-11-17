import { View, Text } from "react-native";

export const options = {
  title: "About Us",
};

export default function AboutUsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>About Us</Text>
    </View>
  );
}
