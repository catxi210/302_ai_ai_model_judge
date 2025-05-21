import React, { useEffect } from "react";
import { useAtom } from "jotai";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useTranslations } from "next-intl";
import { ModelDialogSelector } from "@/components/share/model-dialog-selector";
import { ModelInfo } from "@/stores/slices/models_store";

interface JudgeModelProps {
  disabled?: boolean;
}

const JudgeModel = ({ disabled = false }: JudgeModelProps) => {
  const [form, setForm] = useAtom(judgeFormAtom);
  const t = useTranslations();

  // If the currently selected judge model is also selected as an answer model,
  // clear the judge model selection
  useEffect(() => {
    if (
      form.judgeModel &&
      form.answerModel &&
      form.answerModel.some((model) => model.model === form.judgeModel?.model)
    ) {
      setForm((prev) => ({ ...prev, judgeModel: null }));
    }
  }, [form.answerModel, form.judgeModel, setForm]);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{t("labels.judge_model")}</span>
      <div className="relative">
        <ModelDialogSelector
          value={form.judgeModel}
          onChange={(value) =>
            setForm({
              ...form,
              judgeModel: value as ModelInfo,
            })
          }
          disabled={disabled}
          placeholder={t("placeholder.judge_model")}
          disabledModels={
            form.answerModel ? form.answerModel.map((model) => model.model) : []
          }
          className="w-[200px] bg-white hover:bg-gray-100 dark:bg-[#030712] dark:hover:bg-gray-700"
        />
      </div>
    </div>
  );
};

export default JudgeModel;
