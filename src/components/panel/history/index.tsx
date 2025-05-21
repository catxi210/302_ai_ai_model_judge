import React, { useEffect, useState } from "react";
import {
  getList,
  deleteData,
  deleteModelAnswerByRecordId,
} from "@/app/db/indexDB";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import Markdown from "react-markdown";
import { Copy, Trash2, CopyCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/utils/copy";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import rehypeRaw from "rehype-raw";

// Define interfaces for the data structure
interface ModelAnswer {
  model: string;
  answer: string;
  id: string;
}

interface JudgeModelAnswer {
  model: string;
  answer: string;
  format: string;
  fullMarks: number;
}

interface StoredData {
  models: ModelAnswer[];
  judge: JudgeModelAnswer;
}

interface Record {
  id?: number;
  prompt: string;
  modelAnswer: string;
  createdAt: Date;
  parsedData?: StoredData;
  bestModel?: string;
}

const HistoryPanel = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [selectedModelIndexes, setSelectedModelIndexes] = useState<{
    [key: number]: number;
  }>({});
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const t = useTranslations();
  const fetchRecords = async () => {
    try {
      const data = await getList();

      // Parse the JSON data from modelAnswer field
      const processedRecords = data.map((record) => {
        try {
          const parsedData = JSON.parse(record.modelAnswer) as StoredData;
          return {
            ...record,
            parsedData,
          };
        } catch (e) {
          console.error("Failed to parse record data:", e);
          return record;
        }
      });

      setRecords(processedRecords);

      // Initialize model indexes for all records
      const initialIndexes = processedRecords.reduce(
        (acc, record, index) => {
          if (record.id) {
            acc[record.id] = 0;
          }
          return acc;
        },
        {} as { [key: number]: number }
      );

      setSelectedModelIndexes(initialIndexes);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
  };

  // Fetch records from IndexedDB
  useEffect(() => {
    fetchRecords();
  }, []);

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  // Handle model selection for a specific record
  const handleModelSelect = (
    recordId: number | undefined,
    modelIndex: number
  ) => {
    if (recordId) {
      setSelectedModelIndexes((prev) => ({
        ...prev,
        [recordId]: modelIndex,
      }));
    }
  };

  // Handle copy text functionality
  const handleCopy = (text: string, key: string) => {
    if (copyToClipboard(text)) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  // Handle deleting a record
  const handleDelete = async (
    recordId: number | undefined,
    modelId: string | undefined
  ) => {
    if (!recordId || !modelId) return;

    try {
      await deleteModelAnswerByRecordId(recordId, modelId);
      fetchRecords();
    } catch (error) {
      console.error("Error deleting model answer:", error);
    }
  };
  console.log(records);

  return (
    <div className="space-y-6">
      {records.length > 0 ? (
        records.map((record) => (
          <div
            key={record.id}
            className="mb-8 rounded-md border bg-card p-4 dark:border-gray-700"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{record.prompt}</div>
                <div className="text-xs text-gray-500">
                  {/* {record.parsedData?.models.length || 0} 个模型 ·{" "} */}
                  {formatDate(record.createdAt)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (!record.id) return;
                  await deleteData(record.id);
                  fetchRecords();
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            {record.parsedData && (
              <>
                {/* <div className="mb-2 flex items-center">
                  <span className="text-sm font-medium">
                    {t("labels.question")}：
                  </span>
                  <span className="ml-2">{record.prompt}</span>
                </div> */}
                <div className="mb-4 flex items-center">
                  <span className="text-sm font-medium">
                    {t("labels.full_marks")}：
                  </span>
                  <span className="ml-2">
                    {record.parsedData.judge.fullMarks}
                  </span>
                  <span className="ml-12">
                    {record.bestModel && (
                      <>
                        <span className="text-sm font-medium">
                          {t("labels.best_model")}：
                        </span>
                        <span className="ml-2 text-sm">{record.bestModel}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="w-full md:w-1/2">
                    <div className="mb-2 flex h-12 items-center gap-2">
                      <Label className="text-sm font-medium">
                        {t("labels.answer_model")}：
                      </Label>
                      <div className="relative flex-1">
                        <Select
                          value={
                            record.id
                              ? selectedModelIndexes[record.id]?.toString()
                              : "0"
                          }
                          onValueChange={(value) =>
                            handleModelSelect(record.id, Number(value))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={t("placeholder.answer_model")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {record.parsedData.models.length > 0 ? (
                              record.parsedData.models.map((model, index) => (
                                <SelectItem
                                  key={index}
                                  value={index.toString()}
                                >
                                  {model.model}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="flex items-center justify-center py-2 text-gray-500">
                                <AlertCircle className="mr-2 h-4 w-4" />
                                <span>{t("placeholder.no_models")}</span>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            record.id &&
                            record.parsedData &&
                            record.parsedData.models &&
                            record.parsedData.models.length > 0
                          ) {
                            const modelAnswer =
                              record.parsedData.models[
                                selectedModelIndexes[record.id]
                              ]?.answer;
                            handleCopy(modelAnswer || "", `model-${record.id}`);
                          }
                        }}
                      >
                        {copiedStates[`model-${record.id}`] ? (
                          <CopyCheck className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (!record.id) return;

                          const selectedIndex =
                            selectedModelIndexes[record.id] || 0;
                          const selectedModel =
                            record.parsedData?.models[selectedIndex];

                          if (selectedModel?.id) {
                            handleDelete(record.id, selectedModel.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div
                      className={cn(
                        "h-[300px] overflow-auto rounded-md border p-4 dark:border-gray-700",
                        record.id !== undefined &&
                          record.parsedData.models[
                            selectedModelIndexes[record.id]
                          ]?.model === record.bestModel &&
                          "border-purple-500"
                      )}
                    >
                      {record.parsedData.models.length > 0 && record.id ? (
                        <div className="">
                          <Markdown
                            className="prose max-w-none dark:prose-invert"
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw as any]}
                          >
                            {record.parsedData.models[
                              selectedModelIndexes[record.id]
                            ]?.answer || "无回答内容"}
                          </Markdown>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {t("placeholder.no_model_answer")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="mb-2 flex h-12 items-center justify-between gap-2">
                      <div>
                        <Label className="text-sm font-medium">
                          {t("labels.judge_answer")}：
                        </Label>
                        <span className="text-sm">
                          {record.parsedData.judge.model}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              record.id &&
                              record.parsedData &&
                              record.parsedData.judge?.answer
                            ) {
                              handleCopy(
                                record.parsedData.judge.answer,
                                `judge-${record.id}`
                              );
                            }
                          }}
                        >
                          {copiedStates[`judge-${record.id}`] ? (
                            <CopyCheck className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="h-[300px] overflow-auto rounded-md border p-4 dark:border-gray-700">
                      {record.parsedData.judge.answer ? (
                        <div className="">
                          <Markdown className="prose max-w-none dark:prose-invert">
                            {record.parsedData.judge.answer}
                          </Markdown>
                        </div>
                      ) : (
                        <p className="text-gray-500">
                          {t("placeholder.no_judge_model")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">
          {t("placeholder.no_history")}
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
