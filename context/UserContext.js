// context/UserContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserContext = createContext();
const STORAGE_KEY = "logged_in_user";

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER ON APP START
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedUser) {
          const parsed = JSON.parse(savedUser);

          // extra safety: ensure valid object
          if (parsed?.user_id) {
            setUserState(parsed);
          } else {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUserState(null);
          }
        }
      } catch (err) {
        console.log("Load user error:", err);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // =========================
  // SET USER (LOGIN / LOGOUT)
  // =========================
  const setUser = async (newUser) => {
    try {
      if (!newUser) {
        // LOGOUT / DELETE ACCOUNT
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUserState(null);
        return;
      }

      // LOGIN / UPDATE USER
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newUser)
      );

      setUserState(newUser);
    } catch (err) {
      console.log("Save user error:", err);
    }
  };

  // =========================
  // FORCE REFRESH USER (optional helper)
  // =========================
  const refreshUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setUserState(JSON.parse(savedUser));
      } else {
        setUserState(null);
      }
    } catch (err) {
      console.log("Refresh user error:", err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        loading,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// =========================
// CUSTOM HOOK
// =========================
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};