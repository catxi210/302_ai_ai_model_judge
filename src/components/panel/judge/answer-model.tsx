import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useTranslations } from "next-intl";
import { ModelDialogSelector } from "@/components/share/model-dialog-selector";
import { ModelInfo } from "@/stores/slices/models_store";

interface AnswerModelProps {
  disabled?: boolean;
}

const AnswerModel = ({ disabled = false }: AnswerModelProps) => {
  const t = useTranslations();
  const [form, setForm] = useAtom(judgeFormAtom);

  const handleModelChange = (
    value: ModelInfo | ModelInfo[],
    realModels?: string | string[]
  ) => {
    console.log(value);

    setForm((prev) => ({
      ...prev,
      answerModel: Array.isArray(value) ? value : value ? [value] : [],
      // Store real_model values for API calls if provided, otherwise use model field
      answerModelIds: Array.isArray(realModels)
        ? realModels
        : realModels
          ? [realModels]
          : Array.isArray(value)
            ? value.map((m) => m.real_model || m.model)
            : value
              ? [value.real_model || value.model]
              : [],
    }));
  };

  // Use judge model as disabled model
  const disabledModels = form.judgeModel ? [form.judgeModel.model] : [];

  // If the judge model is selected as an answer model, remove it from answer models
  useEffect(() => {
    if (
      form.judgeModel &&
      form.answerModel &&
      form.answerModel.some((model) => model.model === form.judgeModel?.model)
    ) {
      setForm((prev) => ({
        ...prev,
        answerModel: prev.answerModel
          ? prev.answerModel.filter(
              (model) => model.model !== prev.judgeModel?.model
            )
          : [],
      }));
    }
  }, [form.judgeModel, form.answerModel, setForm]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{t("labels.answer_model")}</span>
      <ModelDialogSelector
        value={form.answerModel}
        multiple
        onChange={handleModelChange}
        placeholder={t("placeholder.answer_model")}
        disabledModels={disabledModels}
        className="w-[200px]"
        disabled={disabled}
      />
    </div>
  );
};

export default AnswerModel;
