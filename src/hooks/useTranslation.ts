import { useLanguage } from "~/contexts/LanguageContext";
import { getTranslation } from "~/utils/translations";

// Create a hook to use translations
export const useTranslation = () => {
  const { language } = useLanguage();
  
  // Return a function that gets the translation for a key
  return (key: Parameters<typeof getTranslation>[1]) => {
    return getTranslation(language, key);
  };
}; 