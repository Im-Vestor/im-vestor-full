import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// Define the supported languages
export type Language = "en-US" | "pt-PT" | "pt-BR";

// Define the language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
};

// Create the language context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "en-US",
  setLanguage: (_: Language) => {
    // This is intentionally empty as it will be overridden by the provider
  },
});

// Create a hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Define the language provider props
type LanguageProviderProps = {
  children: ReactNode;
};

// Create the language provider component
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  // Initialize language from localStorage if available, otherwise use default
  const [language, setLanguage] = useState<Language>("en-US");

  // Load language from localStorage on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && ["en-US", "pt-PT", "pt-BR"].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 