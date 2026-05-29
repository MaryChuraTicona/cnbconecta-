"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface ThemeContextProps {
  dark: boolean;
  toggleTheme: () => void;
}

const ThemeContext =
  createContext<ThemeContextProps>({
    dark: false,
    toggleTheme: () => {},
  });

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] =
    useState(false);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDark(true);

      document.documentElement.classList.add(
        "dark"
      );
    }
  }, []);

  function toggleTheme() {
    const newTheme = !dark;

    setDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add(
        "dark"
      );

      localStorage.setItem(
        "theme",
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );

      localStorage.setItem(
        "theme",
        "light"
      );
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        dark,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}