import Image from "next/image";
import { type Language, useLanguage } from "~/contexts/LanguageContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

// Define the language options
const languages = [
  { code: "en-US", name: "English (US)", flag: "US" },
  { code: "pt-PT", name: "Português (PT)", flag: "PT" },
  { code: "pt-BR", name: "Português (BR)", flag: "BR" },
] as const;

// Language flag component
const LanguageFlag = ({
  countryCode,
  countryName,
}: {
  countryCode: string;
  countryName: string;
}) => {
  return (
    <Image
      src={`https://flagcdn.com/h60/${countryCode.toLowerCase()}.png`}
      alt={countryName}
      title={countryName}
      width={16}
      height={12}
    />
  );
};

// Language switcher component
export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      value={language}
      onValueChange={(value) => setLanguage(value as Language)}
    >
      <SelectTrigger className="w-auto border-2 border-white/10 ">
        <SelectValue>
          <div className="pr-2">
            {language && (
              <LanguageFlag
                countryCode={
                  languages.find((l) => l.code === language)?.flag ?? "US"
                }
                countryName={
                  languages.find((l) => l.code === language)?.name ??
                  "English (US)"
                }
              />
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#181920] text-white">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <LanguageFlag countryCode={lang.flag} countryName={lang.name} />
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
