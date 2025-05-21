"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { Check, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  modelsStoreAtom,
  type ModelCategory,
  type ModelInfo,
} from "@/stores/slices/models_store";

interface ModelDialogSelectorProps {
  value?: ModelInfo | ModelInfo[] | null;
  onChange?: (
    value: ModelInfo | ModelInfo[],
    actualModel?: string | string[]
  ) => void;
  className?: string;
  placeholder?: string;
  multiple?: boolean;
  disabledModels?: string[];
  disabled?: boolean;
}

export function ModelDialogSelector({
  value,
  onChange,
  className,
  placeholder,
  multiple = false,
  disabledModels = [],
  disabled = false,
}: ModelDialogSelectorProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modelsStore] = useAtom(modelsStoreAtom);
  const [tabs, setTabs] = useState<ModelCategory | null>(null);
  const [tempSelectedValues, setTempSelectedValues] = useState<ModelInfo[]>([]);
  const locale = useLocale();
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

  // Initialize temp selected values when dialog opens
  useEffect(() => {
    if (open) {
      setTempSelectedValues([...selectedValues]);
    }
  }, [open]); // Only run when dialog opens/closes

  // Get model categories from the store
  const categories: ModelCategory[] = Array.from(
    new Set(
      modelsStore?.options?.map((model) => model.model_type as ModelCategory)
    )
  );

  // Filter models based on search query
  const filteredModels = searchQuery
    ? modelsStore.options?.filter(
        (model) =>
          (typeof model.model === "string" &&
            model.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
          model.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (model.description &&
            typeof model.description === "string" &&
            model.description.toLowerCase().includes(searchQuery.toLowerCase()))
      ) || []
    : modelsStore.options || [];

  const handleSelect = (model: ModelInfo) => {
    // Don't allow selecting disabled models
    if (disabledModels.includes(model.model)) {
      return;
    }

    if (multiple) {
      const isSelected = tempSelectedValues.some(
        (m) => m.model === model.model
      );
      const newValues = isSelected
        ? tempSelectedValues.filter((m) => m.model !== model.model)
        : [...tempSelectedValues, model];
      setTempSelectedValues(newValues);
    } else {
      setTempSelectedValues([model]);
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      const realModels = tempSelectedValues.map((m) => m.real_model || m.model);
      onChange?.(tempSelectedValues, realModels);
    } else {
      const model = tempSelectedValues[0];
      if (model) {
        onChange?.(model, model.real_model || model.model);
      }
    }
    setOpen(false);
  };

  const getDisplayValue = () => {
    if (selectedValues.length > 0) {
      if (multiple) {
        return `${selectedValues.length} ${t("labels.models")}`;
      } else {
        const model = selectedValues[0];
        return model ? model.model : placeholder;
      }
    }
    return placeholder || t("common.selectModel");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <span className="truncate">{getDisplayValue()}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m7 15 5 5 5-5"></path>
            <path d="m7 9 5-5 5 5"></path>
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-full flex-col p-4 sm:max-w-[90vw] sm:p-6 md:max-w-[800px]">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-center">
            {t("labels.select_models")}
          </DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("placeholder.search_model")}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {searchQuery ? (
          <div className="flex-1 overflow-hidden">
            <div className="h-full max-h-[calc(85vh-14rem)] overflow-y-auto pr-2">
              <div className="flex flex-col gap-2 pb-2">
                {filteredModels.map((model) => (
                  <ModelCard
                    key={model.model}
                    model={model}
                    selected={tempSelectedValues.some(
                      (m) => m.model === model.model
                    )}
                    disabled={disabledModels.includes(model.model)}
                    onSelect={() => handleSelect(model)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-1 flex-col overflow-hidden sm:flex-row">
            <div className="mb-2 w-full sm:mb-0 sm:w-48 sm:border-r sm:pr-4">
              <div className="flex gap-1 overflow-x-auto pb-2 sm:h-full sm:flex-col sm:gap-0 sm:overflow-y-auto sm:pb-0">
                {categories.map((category) => {
                  // Count selected models in this category
                  const selectedInCategory = tempSelectedValues.filter(
                    (selectedModel) => selectedModel.model_type === category
                  ).length;

                  return (
                    <button
                      key={category}
                      className={`flex-shrink-0 rounded-md px-3 py-2 text-left text-sm sm:w-full ${
                        category === (tabs || categories[0])
                          ? "bg-primary/10 font-medium text-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setTabs(category)}
                    >
                      <div className="flex items-center justify-between whitespace-nowrap">
                        <span>{t(`labels.${category}`)}</span>
                        {selectedInCategory > 0 && (
                          <span className="ml-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                            {selectedInCategory}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-1 flex-col overflow-hidden sm:pl-4">
              <div className="max-h-[calc(85vh-14rem)] overflow-y-auto pr-2">
                <div className="flex flex-col gap-2 pb-2">
                  {modelsStore.options
                    ?.filter(
                      (model) => model.model_type === (tabs || categories[0])
                    )
                    .map((model) => (
                      <ModelCard
                        key={model.model}
                        model={model}
                        selected={tempSelectedValues.some(
                          (m) => m.model === model.model
                        )}
                        disabled={disabledModels.includes(model.model)}
                        onSelect={() => handleSelect(model)}
                      />
                    )) || []}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end border-t pt-2">
          <Button onClick={handleConfirm} className="sm:w-auto">
            {t("auth.form.confirm_button")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ModelCardProps {
  model: ModelInfo;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}

function ModelCard({ model, selected, disabled, onSelect }: ModelCardProps) {
  const modelName = typeof model.model === "string" ? model.model : model.model;
  const locale = useLocale();
  const remark = {
    zh: model.remark,
    en: model.en_remark,
    ja: model.en_remark,
  };
  return (
    <div
      className={cn(
        "relative flex items-center justify-between rounded-md border p-2 transition-colors sm:p-3",
        selected && "border-primary bg-primary/5",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-accent"
      )}
      onClick={disabled ? undefined : onSelect}
    >
      <div className="mr-3 flex-1 overflow-hidden">
        <h3
          className="break-words text-sm font-medium sm:text-base"
          title={modelName}
        >
          {modelName}
        </h3>
        {remark[locale as keyof typeof remark] && (
          <p
            className="truncate text-xs text-muted-foreground"
            title={remark[locale as keyof typeof remark]}
          >
            {remark[locale as keyof typeof remark]}
          </p>
        )}
        {model.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground sm:line-clamp-2 sm:text-sm">
            {model.description}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 items-center space-x-2 sm:space-x-4">
        {(model.inputCost || model.outputCost) && (
          <div className="hidden text-xs text-muted-foreground sm:block">
            {model.inputCost && <div>输入: {model.inputCost}</div>}
            {model.outputCost && <div>输出: {model.outputCost}</div>}
          </div>
        )}
        {selected && <Check className="h-4 w-4 flex-shrink-0 text-primary" />}
      </div>
    </div>
  );
}
