import { Textarea } from "@/components/ui/textarea";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import React from "react";

const PromptInput = () => {
  const [form, setForm] = useAtom(judgeFormAtom);
  const t = useTranslations("placeholder");
  return (
    <Textarea
      placeholder={t("eg_question")}
      className="min-h-[200px] rounded-md border-2 bg-white p-4 text-base dark:bg-black"
      value={form.prompt}
      onChange={(event) => {
        setForm({ ...form, prompt: event.target.value });
      }}
      onKeyDown={async (event) => {
        if (event.key === "Enter") {
        }
      }}
    />
  );
};

export default PromptInput;
