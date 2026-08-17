import { createContext, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { buildApiUrl } from "../utils/api.js";
import { DEFAULT_ACCENT } from "../utils/accentColors.js";

const AccentColorContext = createContext();

export const AccentColorProvider = ({ children }) => {
  const { user, token, setUser } = useAuth();
  const accentColor = user?.AccentColor || DEFAULT_ACCENT;

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  const setAccentColor = async (hex) => {
    if (!token) return { success: false, error: "Not signed in" };

    const previous = user?.AccentColor;
    setUser((prev) => (prev ? { ...prev, AccentColor: hex } : prev));

    try {
      const res = await fetch(`${buildApiUrl()}/me/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accentColor: hex }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setUser((prev) => (prev ? { ...prev, AccentColor: previous } : prev));
        return { success: false, error: data.error || "Failed to save accent color" };
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      console.error("Error saving accent color:", err);
      setUser((prev) => (prev ? { ...prev, AccentColor: previous } : prev));
      return { success: false, error: "Could not reach the server. Check your connection and try again." };
    }
  };

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentColorContext.Provider>
  );
};

export const useAccentColor = () => useContext(AccentColorContext);
