import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import API_URL from "../../api/config";
import { useUser } from "../../context/UserContext";
import { Ionicons } from "@expo/vector-icons";

export default function ChatbotScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const goToAddExpense = (params) => {
    setLoading(false); // stop UI first

    router.replace({
      pathname: "/drawer/tabs/add_expense",
      params,
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

      const goToAddExpense = (params) => {
        setLoading(false);

        router.replace({
          pathname: "/drawer/tabs/add_expense",
          params,
        });

        // 👇 force close chatbot screen
        setTimeout(() => {
          router.dismiss?.();
          router.back?.();
        }, 50);
      };

    } catch (err) {
      console.log(err);
      Alert.alert("OCR Failed");
      setLoading(false);
    }
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

      // ✅ IMPORTANT: DO NOT fallback to today
      const scannedAmount =
        invoice.amount != null ? String(invoice.amount) : "";

      const scannedDate =
        invoice.date != null && invoice.date !== ""
          ? invoice.date
          : ""; // ✅ NO DEFAULT DATE

      const scannedTitle =
        invoice.title != null ? invoice.title : "E-Invoice";

      console.log("📤 NAVIGATING WITH:", {
        scannedAmount,
        scannedDate,
        scannedTitle,
      });

      goToAddExpense({
        scannedAmount,
        scannedDate,
        scannedTitle,
      });

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

  // =====================================================
  // OCR FROM GALLERY
  // =====================================================
  const uploadReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;

    sendToOCR(result.assets[0].uri);
  };

  // =====================================================
  // UI
  // =====================================================
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>

      {/* ================= TOP AREA ================= */}
      <View style={{ flex: 1, padding: 15 }}>
        <Text style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 10
        }}>
          Smart Assistant
        </Text>

        <Text style={{
          color: "#666"
        }}>
          Scan or upload receipts to auto-fill expenses
        </Text>

        {loading && (
          <ActivityIndicator style={{ marginTop: 20 }} />
        )}
      </View>

      {/* ================= BOTTOM INPUT BAR ================= */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderColor: "#eee"
      }}>

        {/* 🎤 MIC */}
        <TouchableOpacity style={{ padding: 8 }}>
          <Ionicons name="mic-outline" size={24} color="#555" />
        </TouchableOpacity>

        {/* INPUT BOX */}
        <View style={{
          flex: 1,
          backgroundColor: "#f2f2f2",
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingVertical: 8,
          marginHorizontal: 10
        }}>
          <Text style={{ color: "#999" }}>
            Type message...
          </Text>
        </View>

        {/* ACTION ICONS */}
        <View style={{
          flexDirection: "row",
          alignItems: "center"
        }}>

          {/* 📷 CAMERA (OCR) */}
          <TouchableOpacity onPress={scanReceipt} style={{ marginHorizontal: 6 }}>
            <Ionicons name="camera-outline" size={24} color="#007AFF" />
          </TouchableOpacity>

          {/* 🖼 GALLERY */}
          <TouchableOpacity onPress={uploadReceipt} style={{ marginHorizontal: 6 }}>
            <Ionicons name="images-outline" size={24} color="#6f42c1" />
          </TouchableOpacity>

          {/* 📡 QR SCAN */}
          <TouchableOpacity onPress={() => setQrMode(true)} style={{ marginHorizontal: 6 }}>
            <Ionicons name="scan-outline" size={24} color="#28a745" />
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}