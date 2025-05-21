import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import React from "react";
import { useTranslations } from "next-intl";
const ReportFormat = () => {
  const [form, setForm] = useAtom(judgeFormAtom);
  const t = useTranslations();
  const handleFormatChange = (value: string) => {
    setForm({
      ...form,
      responseFormat: value as "prosAndCons" | "multiDimensional",
    });
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{t("labels.report_format")}</span>
      <RadioGroup
        defaultValue="prosAndCons"
        className="flex w-[200px] overflow-hidden rounded-md border px-0 dark:border-gray-700"
        value={form.responseFormat}
        onValueChange={handleFormatChange}
      >
        <div className="flex w-1/2 items-center">
          <RadioGroupItem
            value="prosAndCons"
            id="prosAndCons"
            className="hidden"
          />
          <Label
            htmlFor="prosAndCons"
            className={`w-full cursor-pointer px-4 py-1.5 text-center transition-colors ${
              form.responseFormat === "prosAndCons"
                ? "bg-purple-600 text-white"
                : "bg-white hover:bg-gray-50 dark:bg-[#030712] dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("labels.prosAndCons")}
          </Label>
        </div>
        <div className="flex w-1/2 items-center">
          <RadioGroupItem
            value="multiDimensional"
            id="multiDimensional"
            className="hidden"
          />
          <Label
            htmlFor="multiDimensional"
            className={`w-full cursor-pointer px-4 py-1.5 text-center transition-colors ${
              form.responseFormat === "multiDimensional"
                ? "bg-purple-600 text-white"
                : "bg-white hover:bg-gray-50 dark:bg-[#030712] dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {t("labels.multiDimensional")}
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ReportFormat;
