import React, { createContext, useContext, useState, useEffect } from "react";

export const THEMES = [
  {
    id: "blue",
    name: "Electric Blue",
    color: "#3B82F6",
    hover: "#60A5FA",
    glow: "rgba(59, 130, 246, 0.16)",
    activeBorder: "border-blue-500",
    ring: "focus:ring-blue-500/40",
  },
  {
    id: "emerald",
    name: "Emerald Mint",
    color: "#10B981",
    hover: "#34D399",
    glow: "rgba(16, 185, 129, 0.16)",
    activeBorder: "border-emerald-500",
    ring: "focus:ring-emerald-500/40",
  },
  {
    id: "violet",
    name: "Linear Violet",
    color: "#6366F1",
    hover: "#818CF8",
    glow: "rgba(99, 102, 241, 0.16)",
    activeBorder: "border-indigo-500",
    ring: "focus:ring-indigo-500/40",
  },
  {
    id: "amber",
    name: "Industrial Amber",
    color: "#F59E0B",
    hover: "#FBBF24",
    glow: "rgba(245, 158, 11, 0.16)",
    activeBorder: "border-amber-500",
    ring: "focus:ring-amber-500/40",
  },
  {
    id: "rose",
    name: "Crimson Rose",
    color: "#F43F5E",
    hover: "#FB7185",
    glow: "rgba(244, 63, 94, 0.16)",
    activeBorder: "border-rose-500",
    ring: "focus:ring-rose-500/40",
  },
  {
    id: "cyan",
    name: "Cyber Cyan",
    color: "#06B6D4",
    hover: "#22D3EE",
    glow: "rgba(6, 182, 212, 0.16)",
    activeBorder: "border-cyan-500",
    ring: "focus:ring-cyan-500/40",
  },
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem("stockpilot_theme") || "blue";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("stockpilot_theme", currentTheme);
  }, [currentTheme]);

  const activeThemeConfig =
    THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        themeConfig: activeThemeConfig,
        setTheme: setCurrentTheme,
        themes: THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};
