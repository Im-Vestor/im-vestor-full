"use client";

import { cn } from "~/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

interface MultiSelectItem {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectItem[];
  selected: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
}: MultiSelectProps) {
  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="min-h-[2.5rem]">
        <ToggleGroup
          type="multiple"
          className="flex flex-wrap items-start gap-2"
          value={selected}
        >
          {options.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              variant="outline"
              size="lg"
              className="data-[state=on]:bg-[#F0D687] data-[state=on]:text-black"
              onClick={() => handleToggle(option.value)}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
