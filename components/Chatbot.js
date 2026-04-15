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
import { useUser } from "../context/UserContext";

export default function ChatbotScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [pendingExpense, setPendingExpense] = useState(null);


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
      try {
        const saved = await AsyncStorage.getItem(CHAT_KEY);

        if (saved) {
          setMessages(JSON.parse(saved));
        } else {
          const welcome = [
            {
              role: "assistant",
              text:
                "👋 Welcome!\n\n🎤 Speak\n📷 Scan receipt\n🖼 Upload\n📡 Scan QR",
              time: new Date().toLocaleTimeString(),
            },
          ];

          setMessages(welcome);

          if (user) {
            await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(welcome));
          }
        }

        setInitialized(true);
      } catch (err) {
        console.log("Init error:", err);
      }
    };

    init();
  }, [user]);

  useEffect(() => {
    setInitialized(false);
    setMessages([]);
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
                  text:
                    "👋 Welcome!\n\n🎤 Speak\n📷 Scan receipt\n🖼 Upload\n📡 Scan QR",
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

        await recordingRef.current.stopAndUnloadAsync();

        const uri = recordingRef.current.getURI();

        console.log("🎤 AUDIO URI:", uri);

        recordingRef.current = null;
        setIsRecording(false);

        // 🔥 SHOW UI IMMEDIATELY
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            text: "🎤 Listening...",
          },
        ]);

        sendAudioToBackend(uri);

        return uri;
      } catch (err) {
        console.log("Stop recording error:", err);
      }
    };
  
const sendAudioToBackend = async (uri) => {
  setLoading(true);

  try {
    console.log("🎤 START UPLOAD AUDIO:", uri);

    // =========================
    // FORM DATA
    // =========================
    const formData = new FormData();

    formData.append("file", {
      uri,
      name: "voice.m4a",
      type: "audio/m4a",
    });

    // ✅ FIX: correct user id field
    const userId = user?.user_id;

    console.log("👤 USER OBJECT:", user);

    if (!userId) {
      throw new Error("Missing user_id");
    }

    formData.append("userId", String(userId));

    // =========================
    // CALL BACKEND
    // =========================
    const res = await fetch(`${API_URL}/transcribe`, {
      method: "POST",
      body: formData,
    });

    const raw = await res.text();
    console.log("📦 RAW BACKEND RESPONSE:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error("Backend did not return valid JSON");
    }

    if (data.error) {
      throw new Error(data.error);
    }

    const parsed = data.result || {};

    console.log("🧠 PARSED RESULT:", parsed);
    console.log("🗣 USER SAID:", data.text);

    // =========================
    // SAFE AMOUNT
    // =========================
    let safeAmount = "";

    if (parsed.amount != null && parsed.amount !== "") {
      safeAmount = String(parsed.amount);
    }

    // =========================
    // SAFE CATEGORY
    // =========================
    let safeCategory = "";

    if (parsed.suggestedCategory) {
      safeCategory = parsed.suggestedCategory
        .toLowerCase()
        .trim();
    }

    // =========================
    // TIME
    // =========================
    const timeNow = new Date().toLocaleTimeString();

    // =========================
    // UPDATE CHAT UI
    // =========================
    setMessages((prev) => {
      const updated = [...prev];

      // remove "Listening..." placeholder
      if (
        updated.length &&
        updated[updated.length - 1].text === "🎤 Listening..."
      ) {
        updated.pop();
      }

      return [
        ...updated,

        // =========================
        // USER MESSAGE (VOICE INPUT)
        // =========================
        {
          role: "user",
          text: `🎤 Voice Input:\n"${data.text || ""}"`,
          time: timeNow,
        },

        // =========================
        // AI PARSED RESULT (IMPORTANT PART)
        // =========================
        {
          role: "assistant",
          text:
            `🤖 Expense Extracted\n\n` +
            `🏷 Title: ${parsed.note || "General expense"}\n` +
            `💰 Amount: RM ${safeAmount || "0.00"}\n` +
            `📅 Date: ${parsed.date || "Not detected"}\n` +
            `🏷 Category: ${safeCategory || "Not detected"}\n\n` +
            `👉 Ready to add to expense form`,
          time: timeNow,
        },
      ];
    });

    // =========================
    // NAVIGATION PAYLOAD
    // =========================
    const payload = {
      scannedAmount: safeAmount,
      scannedTitle: parsed.note || "General expense",
      scannedDate: parsed.date || "",
      scannedCategory: safeCategory,
    };

    console.log("📤 FINAL PAYLOAD:", payload);

    goToAddExpense(payload);

  } catch (err) {
    console.log("❌ Voice error:", err);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: `❌ ${err.message || "Voice processing failed"}`,
      },
    ]);

    Alert.alert("Voice failed", err.message);
  }

  setLoading(false);
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
            {/* MESSAGE TEXT */}
            <Text style={styles.messageText}>{msg.text}</Text>

            {/* TIME */}
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
        <View style={styles.inputBox}>
          <Text style={styles.placeholderText}>
            Type message...
          </Text>
        </View>

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
});