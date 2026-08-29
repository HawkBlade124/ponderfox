import { createContext, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { buildApiUrl } from "../utils/api.js";
import { DEFAULT_FONT } from "../utils/fonts.js";

const FontContext = createContext();

export const FontProvider = ({ children }) => {
  const { user, token, setUser } = useAuth();
  const fontFamily = user?.FontFamily || DEFAULT_FONT;

  useEffect(() => {
    document.documentElement.style.setProperty("--app-font", fontFamily);
  }, [fontFamily]);

  const setFontFamily = async (value) => {
    if (!token) return { success: false, error: "Not signed in" };

    const previous = user?.FontFamily;
    setUser((prev) => (prev ? { ...prev, FontFamily: value } : prev));

    try {
      const res = await fetch(`${buildApiUrl()}/me/appearance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fontFamily: value }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setUser((prev) => (prev ? { ...prev, FontFamily: previous } : prev));
        return { success: false, error: data.error || "Failed to save font" };
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      console.error("Error saving font:", err);
      setUser((prev) => (prev ? { ...prev, FontFamily: previous } : prev));
      return { success: false, error: "Could not reach the server. Check your connection and try again." };
    }
  };

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => useContext(FontContext);
