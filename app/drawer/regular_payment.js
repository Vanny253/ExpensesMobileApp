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
import BackgroundWrapper from "../../components/backgroundWrapper";


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


  if (!user) {
      return (
        <BackgroundWrapper>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.guestContainer}>
              <Text style={styles.guestText}>
                Guest Mode: Please login to manage regular payments.
              </Text>
            </View>
          </View>
  
          <BottomTabs />
        </BackgroundWrapper>
      );
    }

  return (
    <BackgroundWrapper>

    
      <View style={{ flex: 1 }}>
        <View style={styles.container}>

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

          {/* 👇 Button moved BELOW list */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/addRegularPayment")}
          >
            <Text style={styles.addButtonText}>Add New Payment</Text>
          </TouchableOpacity>

        </View>
        <BottomTabs />
      </View>
    </BackgroundWrapper>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 ,
    marginLeft: -15,
    marginTop: -15,
    marginRight: -15,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "rgb(182,182,182)",
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#ffffff71",
  },

  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 0,
  },

  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  guestText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 16,
  },

});