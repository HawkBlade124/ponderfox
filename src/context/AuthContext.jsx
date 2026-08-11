import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [Thoughts, setThoughts] = useState([]);
  const [todayActiveSeconds, setTodayActiveSeconds] = useState(0);

  const apiBase = buildApiUrl();
useEffect(() => {
  const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (storedToken && storedUser) {
    setUser(JSON.parse(storedUser));
    setToken(storedToken);
  }
  setLoading(false);
}, []);

useEffect(() => {
  if (!token) return;

  const HEARTBEAT_SECONDS = 15;
  const todayKey = new Date().toISOString().slice(0, 10);
  const storedDate = localStorage.getItem("todaySessionDate");
  let accumulated = storedDate === todayKey ? Number(localStorage.getItem("todaySessionSeconds")) || 0 : 0;

  if (storedDate !== todayKey) {
    localStorage.setItem("todaySessionDate", todayKey);
    localStorage.setItem("todaySessionSeconds", "0");
  }

  setTodayActiveSeconds(accumulated);

  const interval = setInterval(() => {
    accumulated += HEARTBEAT_SECONDS;
    localStorage.setItem("todaySessionSeconds", String(accumulated));
    setTodayActiveSeconds(accumulated);
  }, HEARTBEAT_SECONDS * 1000);

  return () => clearInterval(interval);
}, [token]);

  const login = async (identifier, password) => {
    try {
      const res = await axios.post(`${apiBase}/login`, { identifier, password });

      if (res.data.success) {
        const { token, user } = res.data;
        setUser(user);
        setToken(token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
      } else {
        return { success: false, message: "Invalid credentials" };
      }
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };


const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  setUser(null);
  setToken(null);
  window.location.href = "/";
};

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider value={{ user, Thoughts, setThoughts, token, setToken, login, logout, authHeader, loading, setUser, todayActiveSeconds }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
