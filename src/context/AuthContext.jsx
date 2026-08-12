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
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const expiry = localStorage.getItem("tokenExpiry");
  if (expiry && Date.now() > Number(expiry)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
  } else if (storedToken && storedUser) {
    setUser(JSON.parse(storedUser));
    setToken(storedToken);
  }
  setLoading(false);
}, []);

useEffect(() => {
  if (!token) return;

  const expiry = localStorage.getItem("tokenExpiry");
  if (!expiry) return;

  const msRemaining = Number(expiry) - Date.now();
  if (msRemaining <= 0) {
    logout();
    return;
  }

  const timeout = setTimeout(logout, msRemaining);
  return () => clearTimeout(timeout);
}, [token]);

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
        localStorage.removeItem("tokenExpiry");
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
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("todaySessionDate");
  localStorage.removeItem("todaySessionSeconds");
  setUser(null);
  setToken(null);
  setTodayActiveSeconds(0);
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
