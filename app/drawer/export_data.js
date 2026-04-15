import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as XLSX from "xlsx";

import { getExpenses, getIncome } from "../../api/expenseApi";
import BottomTabs from "../../components/_BottomTabs";
import { useUser } from "../../context/UserContext";
import BackgroundWrapper from "../../components/backgroundWrapper";

export default function ExportDataScreen() {
  const { user } = useUser();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expenseData, incomeData] = await Promise.all([
        getExpenses(user.user_id),
        getIncome(user.user_id),
      ]);

      const allTransactions = [
        ...expenseData.map((e) => ({ ...e, type: "expense" })),
        ...incomeData.map((i) => ({ ...i, type: "income" })),
      ];

      const filtered = allTransactions.filter((t) => {
        const transactionDate = new Date(t.date);

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return transactionDate >= start && transactionDate <= end;
      });

      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(filtered);
    } catch (err) {
      Alert.alert("Error", "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, startDate, endDate]);

  const exportFile = async (format) => {
    if (!transactions.length) {
      Alert.alert("No data", "No transactions to export for selected dates.");
      return;
    }

    try {
      const fileName = `Report_${startDate.toISOString().slice(0, 10)}_to_${endDate
        .toISOString()
        .slice(0, 10)}.${format === "excel" ? "xlsx" : format}`;

      let fileUri = FileSystem.documentDirectory + fileName;

      if (format === "csv") {
        let csvContent = "Date,Title,Amount,Category,Type\n";
        transactions.forEach((t) => {
          csvContent += `${t.date},${t.title},${t.amount},${t.category},${t.type}\n`;
        });
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: "utf8",
        });
      } else if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(transactions);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        const wbout = XLSX.write(wb, {
          type: "base64",
          bookType: "xlsx",
        });
        await FileSystem.writeAsStringAsync(fileUri, wbout, {
          encoding: "base64",
        });
      } else if (format === "pdf") {
        const htmlContent = `
          <h1>Transactions Report</h1>
          <p>From ${startDate.toDateString()} to ${endDate.toDateString()}</p>
          <table border="1" style="border-collapse: collapse; width: 100%;">
            <tr>
              <th>Date</th><th>Title</th><th>Amount</th><th>Category</th><th>Type</th>
            </tr>
            ${transactions
              .map(
                (t) => `
                  <tr>
                    <td>${t.date}</td>
                    <td>${t.title}</td>
                    <td>${t.amount}</td>
                    <td>${t.category}</td>
                    <td>${t.type}</td>
                  </tr>`
              )
              .join("")}
          </table>
        `;

        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        fileUri = uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Exported", `File saved: ${fileUri}`);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to export file");
    }
  };

    /* ---------------- GUEST MODE ---------------- */
    if (!user) {
      return (
        <BackgroundWrapper>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View style={styles.guestContainer}>
              <Text style={styles.guestText}>
                Guest Mode: Please login to export transactions.
              </Text>
            </View>
          </View>

          <BottomTabs />
        </BackgroundWrapper>
      );
    }

  return (

    
    <View style={{ flex: 1 }}>
      <BackgroundWrapper>
        <View style={styles.container}>

          <Text style={styles.title}>Export Transactions</Text>

          {/* START DATE */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.dateText}>
              Start Date: {startDate.toDateString()}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          {/* END DATE */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.dateText}>
              End Date: {endDate.toDateString()}
            </Text>
          </TouchableOpacity>

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          {/* EXPORT BUTTONS */}
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => exportFile("pdf")}
            >
              <Text style={styles.btnText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => exportFile("excel")}
            >
              <Text style={styles.btnText}>Export Excel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => exportFile("csv")}
            >
              <Text style={styles.btnText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={{ marginTop: 20 }}
            />
          )}

        </View>
      </BackgroundWrapper>

      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
    color: "#333",
  },

  dateBox: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#ffffff71",
    borderColor: "rgb(182,182,182)",
  },

  dateText: {
    fontSize: 16,
    color: "#333",
  },

  exportBtn: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  btnText: {
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