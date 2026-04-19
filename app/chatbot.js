import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import API_URL from "../api/config";
import { TextInput } from "react-native";
import { useUser } from "../context/UserContext";
import { sendChatMessage } from "../components/chatService";
import { formatExpense } from "../components/chatFormatter";


export default function ChatbotScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);
  const isProcessingVoiceRef = useRef(false);


  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const CHAT_KEY = user
    ? `chat_messages_${user.user_id}`
    : "chat_messages_guest";
  const [initialized, setInitialized] = useState(false);

  const goToAddExpense = (params) => {
    setLoading(false); // stop UI first

    router.replace({
      pathname: "/drawer/tabs/add_expense",
      params,
    });
  };

  const [inputText, setInputText] = useState("");
  const [currentExpense, setCurrentExpense] = useState(null);
  const [activeFlow, setActiveFlow] = useState(null);
  const [flowData, setFlowData] = useState({});


  const saveToStorage = async (data) => {
    try {
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(data));
    } catch (err) {
      console.log("Save error:", err);
    }
  };

  // =====================================================
  // FIX 2: SINGLE RELIABLE AUTO SAVE (IMPORTANT)
  // =====================================================
  useEffect(() => {
    if (!initialized) return;

    const timeout = setTimeout(() => {
      saveToStorage(messages);
    }, 300);

    return () => clearTimeout(timeout);
  }, [messages, initialized]);



  const saveMessages = async () => {
    try {
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch (err) {
      console.log("Save chat error:", err);
    }
  };

  // =====================================================
  // FIX 3: SAVE ON EXIT (SAFETY BACKUP)
  // =====================================================
  useEffect(() => {
    const unsubscribe = () => {
      saveToStorage(messages);
    };

    return unsubscribe;
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const welcome = [
        {
          role: "assistant",
          text: "👋 What can I help you?",
          actions: [
            "Add New Expense",
            "Add New Budget",
            "Add New Regular Payment"
          ],
          time: new Date().toLocaleTimeString(),
        },
      ];

      setMessages(welcome);
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(welcome));

      setInitialized(true);
    };

    init();
  }, [user]);



  // =========================
  // SAVE MESSAGE HELPER
  // =========================
  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };



   // =========================
  // SHOW QR MESSAGE (FIXED)
  // =========================
  const showReceiptMessage = (title, amount, date) => {
    const msg = {
      role: "assistant",
      text:
        `🧾 Receipt detected!\n\n` +
        `🏪 ${title}\n` +
        `💰 RM ${amount}\n` +
        `📅 ${date}\n\n` +
        `⚠️ Category not selected.`,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => {
      const updated = [...prev, msg];

      // 🔥 CRITICAL: save actual final state (not stale state)
      saveToStorage(updated);

      return updated;
    });
  };

  // =====================================================
  // OCR SCAN
  // =====================================================
  const scanReceipt = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;
      const msg = {
      role: "user",
      text: "📷 Scanning receipt...",
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => {
      const updated = [...prev, msg];
      saveToStorage(updated);
      return updated;
    });


    sendToOCR(result.assets[0].uri);
  };

  const sendToOCR = async (uri) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "receipt.jpg",
        type: "image/jpeg",
      });

      const res = await fetch(`${API_URL}/ocr`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await res.json();

      console.log("🧾 OCR RESULT:", data);

      const msg = {
        role: "assistant",
        text:
          `📷 Receipt processed!\n\n` +
          `🏪 ${data.title || "Unknown item"}\n` +
          `💰 RM ${data.amount || "0.00"}\n` +
          `📅 ${data.date || "No date detected"}\n\n` +
          `⚠️ Please select a category for this expense.`,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => {
        const updated = [...prev, msg];
        saveToStorage(updated);
        return updated;
      });

      goToAddExpense({
        scannedAmount: data.amount || "",
        scannedTitle: data.title || "",
        scannedDate: data.date || "",
        scannedCategory: ""
      });

    } catch (err) {
      console.log(err);
      Alert.alert("OCR Failed");
    }

    setLoading(false);
  };


  const clearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CHAT_KEY);

              const welcome = [
              {
                role: "assistant",
                text: "👋 What can I help you?",
                actions: [
                  "Add New Expense",
                  "Add New Budget",
                  "Add New Regular Payment"
                ],
                time: new Date().toLocaleTimeString(),
              },
            ];

              setMessages(welcome);
              await saveToStorage(welcome);
            } catch (err) {
              console.log("Clear chat error:", err);
            }
          },
        },
      ]
    );
  };


  // =====================================================
  // QR SCAN
  // =====================================================
  
  const handleQRScan = async ({ data }) => {
    if (scanned) return;

    setScanned(true);
    setQrMode(false);
    setLoading(true);

    console.log("📦 QR URL:", data);

    try {
      const res = await fetch(`${API_URL}/parse-einvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: data }),
      });

      const invoice = await res.json();

      console.log("📥 INVOICE DATA:", invoice);

      if (!invoice) throw new Error("Empty invoice");

      // =========================
      // SAFE VALUES
      // =========================
      const scannedAmount =
        invoice.amount != null ? String(invoice.amount) : "";

      const scannedDate =
        invoice.date != null && invoice.date !== ""
          ? invoice.date
          : "";

      const scannedTitle =
        invoice.title != null ? invoice.title : "E-Invoice";

      console.log("📤 NAVIGATING WITH:", {
        scannedAmount,
        scannedDate,
        scannedTitle,
      });

      // =========================
      // 1. NAVIGATE (KEEP ORIGINAL)
      // =========================
      goToAddExpense({
        scannedAmount,
        scannedDate,
        scannedTitle,
      });

      // =========================
      // 2. CHATBOT MESSAGE (FIXED)
      // =========================
      setTimeout(() => {
        showReceiptMessage(scannedTitle, scannedAmount, scannedDate);
      }, 300);

    } catch (err) {
      console.log("❌ QR parse failed:", err);
      Alert.alert("Failed to read e-invoice");
    }

    setLoading(false);

    setTimeout(() => setScanned(false), 3000);
  };


  // =====================================================
  // QR CAMERA
  // =====================================================
  if (qrMode) {
    if (!permission) return <Text>Requesting permission...</Text>;

    if (!permission.granted) {
      return (
        <View style={{ padding: 20 }}>
          <Text>No camera permission</Text>

          <TouchableOpacity onPress={requestPermission}>
            <Text style={{ color: "blue", marginTop: 10 }}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={handleQRScan}
      />
    );
  }



  // ================= UPLOAD FROM GALLERY =================
  const uploadReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    // =========================
    // ADD USER MESSAGE (FIXED)
    // =========================
    const msg = {
      role: "user",
      text: "🖼 Uploading receipt...",
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => {
      const updated = [...prev, msg];
      saveToStorage(updated);
      return updated;
    });

    // =========================
    // CONTINUE OCR
    // =========================
    sendToOCR(result.assets[0].uri);
  };



  // ================= VOICE RECORD =================
    const startRecording = async () => {
    try {
      console.log("🎤 START RECORDING");

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow microphone access");
        return;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      const recording = new Audio.Recording();

      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();

      recordingRef.current = recording;
      setIsRecording(true);

      console.log("🎤 RECORDING STARTED");
    } catch (err) {
      console.log("Start recording error:", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log("🛑 STOP RECORDING");

      const recording = recordingRef.current;

      // 🔥 IMPORTANT: clear immediately to prevent double stop
      recordingRef.current = null;
      setIsRecording(false);

      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      if (!uri) return;

      // show UI feedback (safe now)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "🎤 Processing voice...",
          time: new Date().toLocaleTimeString(),
        },
      ]);

      // 🔥 CALL ONLY ONCE
      await sendAudioToBackend(uri);

    } catch (err) {
      console.log("Stop recording error:", err);
    }
  };


  
const sendAudioToBackend = async (uri = null, textInput = null) => {
  if (!uri && !textInput) return;

  if (isProcessingVoiceRef.current) return;

  isProcessingVoiceRef.current = true;
  setLoading(true);

  try {
    const formData = new FormData();

    if (uri) {
      formData.append("file", {
        uri,
        name: "voice.m4a",
        type: "audio/m4a",
      });
    }

    if (textInput) {
      formData.append("text", textInput);
    }

    formData.append("userId", String(user.user_id));

    const res = await fetch(`${API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.error) throw new Error(data.error);

    const userText = data.text || "";

    if (userText) {
      addMessage({
        role: "user",
        text: uri ? `🎤 ${userText}` : userText,
        time: new Date().toLocaleTimeString(),
      });
    }

    // ✅ HANDLE RESPONSE HERE (NOT calling handleUserInput again)
    if (data.type === "answer") {
      addMessage({
        role: "assistant",
        text: data.answer,
        time: new Date().toLocaleTimeString(),
      });
      return;
    }

    if (data.type === "expense") {
      // forward to expense UI
      const parsed = data.result;

      addMessage({
        role: "assistant",
        text: `🧾 ${parsed.note} RM${parsed.amount}`,
        time: new Date().toLocaleTimeString(),
      });

      return;
    }

  } catch (err) {
    console.log("❌ Error:", err);

    addMessage({
      role: "assistant",
      text: "❌ Failed to process",
      time: new Date().toLocaleTimeString(),
    });

  } finally {
    setLoading(false);

    setTimeout(() => {
      isProcessingVoiceRef.current = false;
    }, 300);
  }
};


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
// =========================
// HANDLE USER INPUT (TEXT + VOICE)
// =========================
const handleUserInput = async (input, source = "text") => {
  const text = input?.trim?.() || "";
  if (!text) return;

  console.log("📥 ACTIVE FLOW:", activeFlow);

  // =====================
  // STRICT FLOW MODE
  // =====================
  if (activeFlow === "expense") {
    return handleExpense(text);
  }

  if (activeFlow === "budget") {
    return handleBudgetFlow(text);
  }

  if (activeFlow === "regularPayment") {
    return handleRegularPaymentFlow(text);
  }

  // =====================
  // NORMAL CHAT MODE
  // =====================
  return sendAudioToBackend(null, text);
};


const sendMessageToAI = async (message) => {
  const timeNow = new Date().toLocaleTimeString();

  try {
    const data = await sendChatMessage(
      message,
      user.user_id,
      currentExpense
    );

    console.log("🤖 CHAT:", data);

    if (data.intent === "extract") {
      setCurrentExpense(data.expense);

      addMessage({
        role: "assistant",
        text: formatExpense(data.expense),
        time: timeNow,
      });
    }

    else if (data.intent === "update") {
      setCurrentExpense(data.expense);

      addMessage({
        role: "assistant",
        text: data.message || "✅ Updated successfully",
        time: timeNow,
      });

      router.setParams({
        scannedTitle: data.expense.note,
        scannedAmount: String(data.expense.amount || ""),
        scannedDate: data.expense.date,
        scannedCategory: data.expense.suggestedCategory,
      });
    }

    else if (data.intent === "confirm") {
      setCurrentExpense(null);

      addMessage({
        role: "assistant",
        text: "✅ Expense saved successfully",
        time: timeNow,
      });
    }

    else if (data.intent === "chat") {
      addMessage({
        role: "assistant",
        text: data.message,
        actions: data.actions,
        time: timeNow,
      });
    }

    else if (data.intent === "query") {
    addMessage({
      role: "assistant",
      text: data.answer,
      time: timeNow,
    });
  }

  } catch (err) {
    console.log("❌ CHAT ERROR:", err);

    addMessage({
      role: "assistant",
      text: "❌ Something went wrong",
      time: timeNow,
    });
  }
};

const handleSend = () => {
  handleUserInput(inputText, "text");
  setInputText("");
};



const handleAction = (action) => {
  addMessage({
    role: "user",
    text: action,
    time: new Date().toLocaleTimeString(),
  });

  if (action === "Add New Budget") {
    setActiveFlow("budget");
    askBudgetStep1();
  }

  if (action === "Add New Expense") {
    setActiveFlow("expense");
    askExpenseStep1();
  }

  if (action === "Add New Regular Payment") {
    setActiveFlow("regularPayment");
    askRegularPaymentStep1();
  }
};


//add new expenses by using chatbot
const askExpenseStep1 = () => {
  setFlowData({});

  addMessage({
    role: "assistant",
    text:
      "📝 Just tell me your expense in ONE message.\n\n" +
      "Include:\n" +
      "- what you spent\n" +
      "- amount\n" +
      "- category (optional)\n" +
      "- date (optional)\n\n" +
      "Example:\n" +
      "Dinner RM12 food yesterday",
    time: new Date().toLocaleTimeString(),
  });
};

const handleExpense = async (text) => {
  try {
    const formData = new FormData();

    formData.append("text", text);
    formData.append("userId", String(user.user_id));

    const res = await fetch(`${API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (!data.result) {
      console.log("⚠️ Backend response:", data);
      throw new Error("No parsed result");
    }

    const parsed = data.result;

    const amount = parsed.amount || "";
    const title = parsed.note || "General expense";
    const category = parsed.suggestedCategory || "General";
    const date = parsed.date || new Date().toISOString().split("T")[0];

    addMessage({
      role: "assistant",
      text:
        `🧾 Receipt\n\n` +
        `🏷 Title: ${title}\n` +
        `💰 Amount: RM ${amount}\n` +
        `📂 Category: ${category}\n` +
        `📅 Date: ${date}\n\n` +
        `✅ Expense added successfully`,
      time: new Date().toLocaleTimeString(),
    });

    goToAddExpense({
      scannedTitle: title,
      scannedAmount: String(amount),
      scannedCategory: category,
      scannedDate: date,
    });

    setActiveFlow(null);
    setFlowData({});

  } catch (err) {
    console.log("❌ EXPENSE ERROR:", err);

    addMessage({
      role: "assistant",
      text: "❌ Failed to process expense",
      time: new Date().toLocaleTimeString(),
    });
  }
};






//Using robot to add new budget
const askBudgetStep1 = () => {
  addMessage({
    role: "assistant",
    text:
      "💰 Let's create a budget.\n\n" +
      "Just tell me like:\n" +
      "Food 500\n\n" +
      "Or include category + amount + month",
    time: new Date().toLocaleTimeString(),
  });
};



const handleBudgetFlow = async (text) => {
  const timeNow = new Date().toLocaleTimeString();

  // ✅ LOG USER INPUT
  console.log("📩 USER INPUT (BUDGET):", text);

  try {
    const res = await fetch(`${API_URL}/ai-extract-budget`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        userId: user.user_id,
      }),
    });

    const data = await res.json();

    console.log("🧠 BUDGET PARSED:", data);

    const amount = data.amount || "";
    const category = data.category || "General";

    addMessage({
      role: "assistant",
      text:
        `💰 Budget Created\n\n` +
        `📂 Category: ${category}\n` +
        `💵 Amount: RM ${amount}\n\n` +
        `You can edit it below.`,
      time: timeNow,
    });

    router.push({
      pathname: "/addBudget",
      params: {
        scannedAmount: String(amount),
        scannedCategory: category,
      },
    });

    setActiveFlow(null);
  } catch (err) {
    console.log("❌ BUDGET FLOW ERROR:", err);

    addMessage({
      role: "assistant",
      text: "❌ Failed to process budget",
      time: timeNow,
    });
  }
};


const askRegularPaymentStep1 = () => {
  addMessage({
    role: "assistant",
    text:
      "🔁 Let's add a regular payment.\n\n" +
      "You can type naturally, like:\n\n" +
      "• Netflix 50 monthly\n" +
      "• Rent 800 monthly billing\n" +
      "• Salary 3000 income monthly\n" +
      "• Gym 100 weekly health\n\n" +
      "💡 Include:\n" +
      "- amount\n" +
      "- how often (daily / weekly / monthly / yearly)\n" +
      "- optional category or income/expense\n\n" +
      "I'll fill everything for you automatically ✨",
    time: new Date().toLocaleTimeString(),
  });
};



const handleRegularPaymentFlow = async (text) => {
  const timeNow = new Date().toLocaleTimeString();

  console.log("📩 REGULAR PAYMENT INPUT:", text);

  try {
    // ❗ USE TRANSCRIBE (your current flow)
    const formData = new FormData();
    formData.append("text", text);
    formData.append("userId", String(user.user_id));

    const res = await fetch(`${API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const parsed = data.result;

    console.log("🧠 PARSED FROM TRANSCRIBE:", parsed);

    // ✅ MAP CORRECTLY
    const title = parsed.note || "Untitled";
    const amount = parsed.amount || "";
    const category = parsed.suggestedCategory || "General";

    // ❗ manually detect frequency (since transcribe doesn't)
    let frequency = "Monthly";
    if (text.includes("weekly")) frequency = "Weekly";
    if (text.includes("daily")) frequency = "Daily";
    if (text.includes("yearly")) frequency = "Yearly";

    addMessage({
      role: "assistant",
      text:
        `🔁 Regular Payment Created\n\n` +
        `📌 Title: ${title}\n` +
        `📂 Category: ${category}\n` +
        `💰 Amount: RM ${amount}\n` +
        `🔄 Frequency: ${frequency}\n\n` +
        `You can edit it below.`,
      time: timeNow,
    });

    router.push({
      pathname: "/addRegularPayment",
      params: {
        title,
        scannedAmount: String(amount),
        scannedCategory: category,
        frequency,
        type: "expense",
      },
    });

    setActiveFlow(null);

  } catch (err) {
    console.log("❌ ERROR:", err);
  }
};


  if (!user) {
    return (
      <View style={styles.guestContainer}>
        <Text style={{ fontSize: 16, textAlign: "center" }}>
          Guest Mode 🤖 Login to save your chatbot history.
        </Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("profile/login")}
        >
          <Text style={{ color: "white" }}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (

    
    <View style={{ flex: 1 }}>

      <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 5 }}>

        {/* 🗑 DELETE CHAT BUTTON ONLY */}
        <TouchableOpacity
          onPress={clearChat}
        >
          <Ionicons name="trash-outline" size={26} color="red" />
        </TouchableOpacity>

      </View>

      {/* CHAT AREA */}
      <ScrollView style={styles.chatArea}
        contentContainerStyle={{ paddingBottom: 120 }}>

        {messages.map((msg, index) => (
        <View
          key={index}
          style={[
            styles.messageBox,
            msg.role === "user" ? styles.userBox : styles.assistantBox,
          ]}
        >
          <Text style={styles.messageText}>{msg.text}</Text>

          {/* ✅ ACTION BUTTONS */}
          {msg.actions && (
            <View style={{ marginTop: 10 }}>
              {msg.actions.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.actionBtn}
                  onPress={() => handleAction(action)}
                >
                  <Text style={{ color: "#007AFF" }}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.timeText}>{msg.time || ""}</Text>
        </View>
      ))}
      </ScrollView>

      <View style={styles.bottomBar}>

        {/* 🎤 MIC */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons
            name={isRecording ? "stop-circle" : "mic-outline"}
            size={24}
            color={isRecording ? "red" : "#555"}
          />
        </TouchableOpacity>

        {/* INPUT BOX */}
        <TextInput
          style={styles.inputBox}
          placeholder="Type message..."
          value={inputText}
          onChangeText={setInputText}
        />

        {/* ACTION ICONS */}
        <View style={styles.iconGroup}>

          {/* 📷 CAMERA */}
          <TouchableOpacity onPress={scanReceipt} style={styles.iconBtn}>
            <Ionicons name="camera-outline" size={24} color="#007AFF" />
          </TouchableOpacity>

          {/* 🖼 GALLERY */}
          <TouchableOpacity onPress={uploadReceipt} style={styles.iconBtn}>
            <Ionicons name="images-outline" size={24} color="#6f42c1" />
          </TouchableOpacity>

          {/* 📡 QR */}
          <TouchableOpacity onPress={() => setQrMode(true)} style={styles.iconBtn}>
            <Ionicons name="scan-outline" size={24} color="#28a745" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSend} style={styles.iconBtn}>
            <Ionicons name="send" size={24} color="#007AFF" />
          </TouchableOpacity>

        </View>
      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  guestContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
},

loginBtn: {
  marginTop: 15,
  backgroundColor: "#007AFF",
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 10,
},

  chatArea: {
    flex: 1,
    padding: 10,
  },

  messageBox: {
    padding: 10,
    paddingBottom: 18,
    marginVertical: 5,
    borderRadius: 12,
    maxWidth: "80%",
    position: "relative",
  },

  userBox: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },

  assistantBox: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  messageText: {
    fontSize: 14,
    color: "#222",
  },

  timeText: {
    fontSize: 9,
    color: "#999",
    position: "absolute",
    left: 8,
    bottom: 4,
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#eee",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  micButton: {
    padding: 8,
  },

  inputBox: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
  },

  placeholderText: {
    color: "#999",
  },

  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    marginHorizontal: 6,
  },
  
  actionBtn: {
    padding: 8,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginVertical: 4,
  }
});