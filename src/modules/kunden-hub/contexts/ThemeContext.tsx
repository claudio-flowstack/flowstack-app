/* eslint-disable react-refresh/only-export-components */
"use client";

import type React from "react";
import { createContext, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Kunden-Hub is always light mode — dark mode was removed due to conflicts
  // with Core ThemeProvider. The toggle is gone, this provider only exists
  // so useTheme() calls don't crash.
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    // No-op: dark mode disabled in Kunden-Hub
  };

  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
