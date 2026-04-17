// context/UserContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();

const STORAGE_KEY = "logged_in_user";

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load user when app starts
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          setUserState(JSON.parse(savedUser));
        }
      } catch (err) {
        console.log("Load user error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ Save user (NO red underline version)
  const setUser = async (newUser) => {
    try {
      if (newUser) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      setUserState(newUser);
    } catch (err) {
      console.log("Save user error:", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// ✅ Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};