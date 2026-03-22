import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import BottomTabs from "../../components/_BottomTabs";
import { getRegularPayments } from "../../api/regularPaymentApi";

export default function RegularPaymentScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    if (!user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getRegularPayments(user.user_id);
      setPayments(data);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to load regular payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Regular Payments</Text>

        <Button
          title="Add New Payment"
          onPress={() => router.push("/addRegularPayment")}
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/regularPaymentDetail",
                    params: {
                      // Pass the full payment object as a JSON string
                      payment: JSON.stringify(item),
                    },
                  })
                }
              >
                <View style={styles.card}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text>Type: {item.type}</Text>
                  <Text>Category: {item.category}</Text>
                  <Text>Amount: RM{item.amount.toFixed(2)}</Text>
                  <Text>Frequency: {item.frequency}</Text>
                  <Text>Date: {item.start_date}</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                No regular payments yet.
              </Text>
            }
          />
        )}
      </View>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#fafafa",
  },
});