"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Shuffle, ChevronDown, Check } from "lucide-react";
import { createScopedLogger } from "@/utils";
import { useState } from "react";
import { MODEL_LIST, getRandomModel, type ModelInfo } from "@/constants/models";
import { useTranslations } from "next-intl";

const logger = createScopedLogger("model-selector");

interface ModelSelectorProps {
  value?: string | string[];
  onChange?: (
    value: string | string[],
    actualModel?: string | string[]
  ) => void;
  className?: string;
  placeholder?: string;
  multiple?: boolean;
  disabledModels?: string[];
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  className,
  placeholder,
  multiple = false,
  disabledModels = [],
  disabled = false,
}: ModelSelectorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [internalRandomModel, setInternalRandomModel] = useState<string>();

  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  const handleSelect = (newValue: string) => {
    // Don't allow selecting disabled models
    if (disabledModels.includes(newValue)) {
      return;
    }

    if (multiple) {
      const newValues = selectedValues.includes(newValue)
        ? selectedValues.filter((v) => v !== newValue)
        : [...selectedValues, newValue];
      onChange?.(newValues, newValues);
    } else {
      onChange?.(newValue, newValue);
    }

    if (!multiple) setOpen(false);
  };

  const getDisplayValue = () => {
    if (!Array.isArray(value) && value === "random") {
      return (
        <span className="flex items-center gap-2">
          <Shuffle className="h-4 w-4 shrink-0" />
          <span>{t("random")}</span>
        </span>
      );
    }

    if (selectedValues.length > 0) {
      if (multiple) {
        return (
          <span className="flex items-center gap-2">
            {/* <span>{t("selectedCount", { count: selectedValues.length })}</span> */}
            <span>
              {selectedValues.length} {t("labels.models")}
            </span>
          </span>
        );
      }
    }

    return <span className="">{placeholder ?? t("common.selectModel")}</span>;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-background px-3 font-normal",
            className
          )}
          disabled={disabled}
        >
          {getDisplayValue()}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] p-0">
        <Command
          loop
          shouldFilter={true}
          defaultValue=""
          value={multiple ? undefined : Array.isArray(value) ? value[0] : value}
        >
          {/* <CommandInput placeholder={t("searchModels")} /> */}
          <CommandList>
            {/* <CommandEmpty>{t("common.noModelFound")}</CommandEmpty> */}

            {MODEL_LIST.map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => handleSelect(model.id)}
                className={cn(
                  "relative",
                  selectedValues.includes(model.id) && "bg-accent",
                  disabledModels.includes(model.id) &&
                    "cursor-not-allowed opacity-50"
                )}
                disabled={disabledModels.includes(model.id)}
              >
                {model.name}
                {selectedValues.includes(model.id) && (
                  <Check className="absolute right-2 h-4 w-4" />
                )}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
