import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useAtom } from "jotai";
import React from "react";
import { useTranslations } from "next-intl";

const Marks = () => {
  const [form, setForm] = useAtom(judgeFormAtom);
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("labels.full_marks")}</span>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={form.fullMarks}
            onChange={(e) =>
              setForm({ ...form, fullMarks: Number(e.target.value) })
            }
            min={1}
            className="w-[200px] bg-white dark:bg-black"
          />
        </div>
      </div>
    </div>
  );
};

export default Marks;
