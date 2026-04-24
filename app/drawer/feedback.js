import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";

import { useUser } from "../../context/UserContext";
import API_URL from "../../api/config";
import BackgroundWrapper from "../../components/backgroundWrapper";
import BottomTabs from "../../components/_BottomTabs";

const Feedback = () => {
  const { user } = useUser();

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,   // ⭐ FIX HERE
          rating,
          feedback,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Feedback submitted!");
        setRating(0);
        setFeedback("");
      } else {
        Alert.alert("Error", data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Server error");
    }

    setLoading(false);
  };

  /* ---------------- GUEST MODE ---------------- */
  if (!user) {
    return (
      <BackgroundWrapper>
        <View style={styles.guestContainer}>
          <Text style={styles.guestText}>
            Guest Mode: Please login to submit feedback.
          </Text>
        </View>

        <BottomTabs />
      </BackgroundWrapper>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <BackgroundWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>⭐ Rate Our App</Text>

        {/* ⭐ Stars */}
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text
                style={[
                  styles.star,
                  { color: star <= rating ? "gold" : "#ccc" },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingText}>
          Your Rating: {rating ? `${rating}/5` : "None"}
        </Text>

        {/* 📝 Input */}
        <TextInput
          style={styles.input}
          placeholder="Write your feedback..."
          multiline
          value={feedback}
          onChangeText={setFeedback}
        />

        {/* 🚀 Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Submitting..." : "Submit Feedback"}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomTabs />
    </BackgroundWrapper>
  );
};

export default Feedback;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },

  starContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },

  star: {
    fontSize: 40,
    marginHorizontal: 5,
  },

  ratingText: {
    textAlign: "center",
    marginBottom: 15,
    color: "#555",
  },

  input: {
    height: 120,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },

  button: {
    marginTop: 15,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
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
    fontWeight: "600",
  },
});