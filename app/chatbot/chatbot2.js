import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! I can help you track your expenses 💰", sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  // 🔹 Simple bot response logic
  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    const amountMatch = msg.match(/\d+/);

    if (msg.includes("spent") && amountMatch) {
      const amount = amountMatch[0];
      return `Got it! I've recorded RM${amount} as your expense.`;
    }

    if (msg.includes("balance")) {
      return "Your current balance is RM500 (mock data).";
    }

    if (msg.includes("hello") || msg.includes("hi")) {
      return "Hey there! 😊 What expense would you like to add?";
    }

    return "Sorry, I didn’t understand. Try saying 'I spent 20 on food'.";
  };

  // 🔹 Send message
  const handleSend = () => {
    if (input.trim() === "") return;

    const userMessage = {
      id: Date.now().toString(),
      text: input,
      sender: "user"
    };

    setMessages((prev) => [...prev, userMessage]);

    const botReply = {
      id: (Date.now() + 1).toString(),
      text: getBotResponse(input),
      sender: "bot"
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botReply]);
    }, 500);

    setInput("");
  };

  // 🔹 Placeholder actions (you can implement later)
  const handleMic = () => {
    console.log("Mic pressed");
  };

  const handleScan = () => {
    console.log("Scan pressed");
  };

  // 🔹 Render messages
  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMessage : styles.botMessage
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />

        {/* 🎤 MIC */}
        <TouchableOpacity style={styles.iconButton} onPress={handleMic}>
          <Ionicons name="mic-outline" size={22} color="#007AFF" />
        </TouchableOpacity>

        {/* 📷 SCAN */}
        <TouchableOpacity style={styles.iconButton} onPress={handleScan}>
          <MaterialCommunityIcons name="line-scan" size={22} color="#007AFF" />
        </TouchableOpacity>

        {/* SEND */}
        <TouchableOpacity style={styles.button} onPress={handleSend}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Chatbot;

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginLeft: -8,
    marginRight: -8,
    marginBottom: -8,
    backgroundColor: "#d5d7e2"
  },

  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: "75%"
  },

  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#a3d2fe"
  },

  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA"
  },

  messageText: {
    color: "#000"
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 40
  },

  iconButton: {
    marginLeft: 5,
    padding: 6,
    justifyContent: "center",
    alignItems: "center"
  },

  button: {
    marginLeft: 5,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center"
  }
});