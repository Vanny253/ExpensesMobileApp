import { Tabs, useNavigation } from "expo-router";
import {
  TouchableOpacity,
  View,
  Modal,
  Text,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { useEffect, useState } from "react";
import Chatbot from "../../chatbot";
import { Calendar } from "react-native-calendars";
import { getExpenses , getIncome} from "../../../api/expenseApi";
import { useUser } from "../../../context/UserContext";
import { useRouter } from "expo-router";

export default function TabsLayout() {
  const navigation = useNavigation();
  const { user } = useUser();
  const router = useRouter();

  const [chatVisible, setChatVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  // ✅ LOAD REAL EXPENSE DATA
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [expenses, income] = await Promise.all([
        getExpenses(user.user_id),
        getIncome(user.user_id),
      ]);

      const grouped = {};

      // 🔴 EXPENSES
      expenses.forEach((item) => {
        const date = item.date?.split("T")[0];
        const amount = Number(item.amount || 0);

        if (!grouped[date]) {
          grouped[date] = { expense: 0, income: 0 };
        }

        grouped[date].expense += amount;
      });

      // 🟢 INCOME
      income.forEach((item) => {
        const date = item.date?.split("T")[0];
        const amount = Number(item.amount || 0);

        if (!grouped[date]) {
          grouped[date] = { expense: 0, income: 0 };
        }

        grouped[date].income += amount;
      });

      setMarkedDates(grouped);
    };

    loadData();
  }, [user]);

  const renderSearchButton = () => (
    <TouchableOpacity
      style={{ marginRight: 10 }}
      onPress={() => router.push("/searchTransaction")} 
    >
      <Ionicons name="search-outline" size={24} />
    </TouchableOpacity>
  );

  const renderCalendarButton = () => (
    <TouchableOpacity
      style={{ marginRight: 15 }}
      onPress={() => setCalendarVisible(true)}
    >
      <Ionicons name="calendar-outline" size={24} />
    </TouchableOpacity>
  );

  return (
    <>
      {/* CALENDAR MODAL */}
      <Modal visible={calendarVisible} animationType="slide" transparent>
        <View style={{
          flex: 1,
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.3)"
        }}>
          <View style={{
            margin: 20,
            backgroundColor: "#fff",
            borderRadius: 15,
            padding: 15,
          }}>

            <TouchableOpacity
              onPress={() => setCalendarVisible(false)}
              style={{ alignSelf: "flex-end" }}
            >
              <Ionicons name="close" size={26} />
            </TouchableOpacity>

            {/* ✅ FIXED CALENDAR (NO CRASH) */}
            <Calendar
              dayComponent={({ date }) => {
                const dateKey = date.dateString;
                const data = markedDates?.[dateKey];

                const expense = data?.expense || 0;
                const income = data?.income || 0;

                return (
                  <View
                    style={{
                      width: 42,
                      height: 55,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* DATE */}
                    <Text style={{ fontSize: 12, fontWeight: "bold" }}>
                      {date.day}
                    </Text>

                    {/* INCOME (GREEN) */}
                    {income > 0 && (
                      <Text style={{ fontSize: 10, color: "green" }}>
                        {income}
                      </Text>
                    )}

                    {/* EXPENSE (RED) */}
                    {expense > 0 && (
                      <Text style={{ fontSize: 10, color: "red" }}>
                        {expense}
                      </Text>
                    )}
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* TABS */}
      <Tabs
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 15 }}
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            >
              <Ionicons name="menu-outline" size={28} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              {renderSearchButton()}
              {renderCalendarButton()}
            </View>
          ),
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#515151",
          tabBarStyle: {
            height: 70,
            paddingBottom: 15,
            backgroundColor: "#a3d2fe",
          },
        }}
      >

        {/* EXPENSES */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Expenses",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cash-outline" size={size} color={color} />
            ),
          }}
        />

        {/* CHARTS */}
        <Tabs.Screen
          name="charts"
          options={{
            title: "Charts",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={size} color={color} />
            ),
          }}
        />

        {/* ADD */}
        <Tabs.Screen
          name="add_expense"
          options={{
            title: "",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: () => (
              <View
                style={{
                  width: 55,
                  height: 55,
                  borderRadius: 30,
                  backgroundColor: "#007AFF",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 30,
                }}
              >
                <Ionicons name="add" size={30} color="#fff" />
              </View>
            ),
          }}
        />

        {/* REPORT */}
        <Tabs.Screen
          name="report"
          options={{
            title: "Reports",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />

        {/* PROFILE */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerStyle: {
              backgroundColor: "#a3d2fe",
            },
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="person-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* CHATBOT BUTTON */}
      <TouchableOpacity
        onPress={() => setChatVisible(true)} 
        style={{
          position: "absolute",
          bottom: 75,
          right: 10,
          width: 50,
          height: 50,
          borderRadius: 30,
          backgroundColor: "#ffffffff",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        <MaterialCommunityIcons name="robot-happy" size={30} color="#333" />
      </TouchableOpacity>

      {/* CHATBOT MODAL */}
      <Modal visible={chatVisible} animationType="slide" transparent>
        <View style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.3)"
        }}>
          <View style={{
            height: "75%",
            backgroundColor: "#fff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Ionicons name="close" size={32} />
              </TouchableOpacity>
            </View>

            <Chatbot />
          </View>
        </View>
      </Modal>
    </>
  );
}