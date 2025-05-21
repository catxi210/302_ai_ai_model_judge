import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { CopyCheck, Trash2, Trophy } from "lucide-react";
import { Copy } from "lucide-react";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { judgeFormAtom } from "@/stores/slices/form_store";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { copyLastAssistantMessage } from "@/utils/copy";
import { ErrorToast } from "@/components/ui/errorToast";
import { toast } from "sonner";
import Markdown from "react-markdown";
import { deleteModelAnswerByModelId } from "@/app/db/indexDB";
import remarkGfm from "remark-gfm";
import ky from "ky";
import { cn } from "@/lib/utils";
import rehypeRaw from "rehype-raw";

export interface TextRef {
  append: (message: any) => void;
  messages: any[];
  isComplete: boolean;
  resetAndSend: (message: any) => void;
  resetJudge: () => void;
  hasFailed: boolean;
  resetCollapse: () => void;
}

interface TextProps {
  model: string;
  onComplete?: (id: string) => void;
  onFailed?: (model: string) => void;
  toastId?: string;
  onDelete?: () => void;
  orientation?: "vertical" | "horizontal";
  isProcessing: boolean;
  bestModel?: string;
}

const Text = forwardRef<TextRef, TextProps>(
  (
    {
      model,
      onComplete,
      onFailed,
      toastId,
      onDelete,
      orientation,
      isProcessing,
      bestModel,
    },
    ref
  ) => {
    const t = useTranslations();
    const { apiKey } = store.get(appConfigAtom);
    const form = useAtomValue(judgeFormAtom);
    const [isComplete, setIsComplete] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [isJudgeCopied, setIsJudgeCopied] = useState(false);
    const [streamStatus, setStreamStatus] = useState<string | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Determine if this is a judge model (for display differences)
    const isJudgeModel = model === form.judgeModel?.model;

    // Find the ModelInfo object for this model to get real_model if needed
    const modelInfo =
      form.answerModel?.find((m) => m.model === model) ||
      (isJudgeModel ? form.judgeModel : null);
    const actualApiModel = modelInfo?.real_model || model;

    const { messages, input, setInput, append, setMessages, isLoading } =
      useChat({
        api: isJudgeModel ? "/api/gen-judgement" : "/api/gen-result",
        body: {
          apiKey,
          model: actualApiModel,
        },
        onResponse: (response) => {
          setIsComplete(false);
          setStreamStatus("streaming");
          // Reset failure state when we get a response
          setHasFailed(false);
        },
        onFinish: async (response) => {
          setIsComplete(true);
          // Provisional stream status, will be updated based on content check
          // setStreamStatus("complete"); // Removed: will be set conditionally

          const assistantMessageContent = response.content;

          if (
            !assistantMessageContent ||
            assistantMessageContent.trim() === ""
          ) {
            // No content or only whitespace, treat as failure
            console.log(
              `Finished with no content or only whitespace for model: ${model}. Marking as failed.`
            );
            setHasFailed(true);
            setStreamStatus("failed");
            if (onFailed) {
              onFailed(model);
            }
            // Show a toast for this specific failure case
            // Ensure t(...) is available and the key is defined in translation files
            toast.error(
              t("error.generation_failed_no_content") ||
                "Generation failed: No content received.",
              {
                id: toastId,
              }
            );
          } else {
            // Content exists, proceed as successful completion
            setHasFailed(false); // Explicitly set hasFailed to false if successful
            setStreamStatus("complete"); // Now set to complete as content is present
            // let bestModel: string | null = null; // This variable was commented out, seems unused here
            if (isJudgeModel) {
              if (onComplete) {
                onComplete(response.content);
              }
            } else {
              if (onComplete) {
                onComplete(response.id);
              }
            }
          }
        },
        onError: (error: any) => {
          console.log("Error occurred:", error);
          setHasFailed(true);
          setIsComplete(true);
          setStreamStatus("failed");

          // Check if there's any content in the messages despite the error
          const hasContent = messages.some(
            (msg) =>
              msg.role === "assistant" &&
              msg.content &&
              msg.content.trim() !== ""
          );

          if (hasContent) {
            // If there's content, treat it as a successful generation
            console.log("Has content despite error, treating as successful");
            if (onComplete) {
              // Use a placeholder ID since the real one might not be available
              onComplete(`error-${Date.now()}`);
            }
            return;
          }

          // Otherwise, report as a failed generation
          if (onFailed) {
            onFailed(model);
          }

          try {
            const errorData = JSON.parse(error?.message);
            console.log("Parsed error data:", errorData);
            if (errorData?.error?.err_code) {
              toast.error(() => ErrorToast(errorData.error.err_code), {
                id: toastId,
              });
              return;
            }
          } catch (parseError) {
            console.log("Error parsing error message:", parseError);
          }

          toast.error("生成失败", {
            id: toastId,
          });
        },
      });

    // Reset messages and send a new one (start fresh conversation)
    const resetAndSend = (message: any) => {
      // Clear previous messages
      setMessages([]);
      // Reset states
      setHasFailed(false);
      setStreamStatus(null);
      // Wait a moment for state to update
      setTimeout(() => {
        // Then append the new message
        append(message);
      }, 50);
    };

    const resetJudge = () => {
      setMessages([]);
      setHasFailed(false);
      setStreamStatus(null);
    };

    const resetCollapse = () => {
      setIsCollapsed(false);
    };

    useImperativeHandle(ref, () => ({
      append,
      messages,
      isComplete,
      resetAndSend,
      resetJudge,
      hasFailed,
      resetCollapse,
    }));

    const handleCopy = () => {
      if (copyLastAssistantMessage(messages)) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    };

    const handleClearMessages = () => {
      // setMessages([]);
      // setIsComplete(true);
      // setStreamStatus(null);
    };

    const handleCopyJudgeAnswer = () => {
      if (copyLastAssistantMessage(messages)) {
        setIsJudgeCopied(true);
        setTimeout(() => setIsJudgeCopied(false), 2000);
      }
    };

    // Determine loading status
    const isGenerating = isLoading || streamStatus === "streaming";

    // Determine if we have a complete response
    const hasCompletedResponse =
      streamStatus === "complete" &&
      messages.some((msg) => msg.role === "assistant");

    if (!isJudgeModel) {
      return (
        <div className="space-y-2">
          <div className="flex h-10 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-sm">
                <span className="whitespace-nowrap">
                  {bestModel?.toLowerCase() === model.toLowerCase() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0"
                      title={t("labels.best_model")}
                    >
                      <Trophy className="mr-1 h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    </Button>
                  ) : (
                    t("labels.current_answer_model") + "："
                  )}
                </span>
                <span
                  className={`ml-1 ${orientation === "horizontal" ? "max-w-[140px] truncate" : ""}`}
                  title={model}
                >
                  {model}
                </span>
              </div>
              {isGenerating && (
                <div className="flex items-center">
                  <Loader2 className="mr-1 h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-500">
                    {t("button.generating")}
                  </span>
                </div>
              )}
              {hasCompletedResponse && (
                <div className="flex items-center">
                  <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">
                    {t("button.complete")}
                  </span>
                </div>
              )}
              {hasFailed &&
                streamStatus === "failed" &&
                !hasCompletedResponse && (
                  <div className="flex items-center">
                    <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-500">
                      {t("button.failed")}
                    </span>
                  </div>
                )}
            </div>
            <div className="flex items-center">
              {orientation === "vertical" && hasCompletedResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={
                    isCollapsed ? t("button.expand") : t("button.collapse")
                  }
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!messages.some((msg) => msg.role === "assistant")}
              >
                {isCopied ? (
                  <CopyCheck className="mr-1 h-4 w-4" />
                ) : (
                  <Copy className="mr-1 h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const id = messages[messages.length - 1]?.id;
                  if (id) {
                    await deleteModelAnswerByModelId(id);
                  }
                  setMessages([]);
                  setIsComplete(true);
                  setStreamStatus(null);
                  setHasFailed(false);
                  if (onDelete) {
                    onDelete();
                  }
                }}
                disabled={isProcessing && streamStatus === "streaming"}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
          <div
            className={cn(
              "rounded-md bg-white dark:bg-black",
              orientation === "vertical" && isCollapsed ? "" : "min-h-[120px]"
            )}
          >
            <div
              className={cn(
                `rounded-md border ${
                  streamStatus === "streaming"
                    ? "border-blue-300 dark:border-blue-700"
                    : streamStatus === "complete"
                      ? "border-green-300 dark:border-green-700"
                      : streamStatus === "failed"
                        ? "border-red-300 dark:border-red-700"
                        : "border-purple-300 dark:border-purple-700"
                } p-6 ${orientation === "horizontal" ? "h-[300px] overflow-y-auto" : ""}`,
                typeof bestModel === "string" &&
                  typeof model === "string" &&
                  bestModel.toLowerCase() === model.toLowerCase() &&
                  "border border-purple-300 dark:border-purple-700",
                orientation === "vertical" && isCollapsed
                  ? "min-h-[60px]"
                  : "min-h-[120px]"
              )}
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 dark:text-gray-500">
                  {t("placeholder.model_answer")}
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={` ${message.role === "user" ? "hidden" : ""}`}
                  >
                    {message.role === "assistant" &&
                      (orientation === "vertical" && isCollapsed ? (
                        <div className="text-center text-gray-500">
                          {t("button.content_collapsed")}
                        </div>
                      ) : (
                        <Markdown
                          className="prose max-w-none pb-4 dark:prose-invert"
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw as any]}
                        >
                          {message.content}
                        </Markdown>
                      ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    // If this is the judge model, render a slightly different UI
    return (
      <div className="space-y-2">
        <div className="flex h-10 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <span className="whitespace-nowrap">
                {t("labels.judge_answer")}：
              </span>
              <span
                className={`ml-1 ${orientation === "horizontal" ? "max-w-[140px] truncate" : ""}`}
                title={form.judgeModel?.model || "未选择"}
              >
                {form.judgeModel?.model || "未选择"}
              </span>
            </div>
            {isGenerating && (
              <div className="flex items-center">
                <Loader2 className="mr-1 h-4 w-4 animate-spin text-blue-500" />
                <span className="text-xs text-blue-500">
                  {t("button.generating")}
                </span>
              </div>
            )}
            {hasCompletedResponse && (
              <div className="flex items-center">
                <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500">
                  {t("button.complete")}
                </span>
              </div>
            )}
            {hasFailed &&
              streamStatus === "failed" &&
              !hasCompletedResponse && (
                <div className="flex items-center">
                  <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-500">
                    {t("button.failed")}
                  </span>
                </div>
              )}
          </div>
          <div className="flex items-center gap-2">
            {orientation === "vertical" && hasCompletedResponse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? t("button.expand") : t("button.collapse")}
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyJudgeAnswer}
              disabled={!messages.some((msg) => msg.role === "assistant")}
            >
              {isJudgeCopied ? (
                <CopyCheck className="mr-1 h-4 w-4" />
              ) : (
                <Copy className="mr-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "rounded-md",
            orientation === "vertical" && isCollapsed ? "" : "min-h-[120px]"
          )}
        >
          {messages.length === 0 ? (
            <div
              className={`rounded-md border bg-white dark:bg-black ${
                hasFailed
                  ? "border-red-300 dark:border-red-700"
                  : "border-purple-300 dark:border-purple-700"
              } p-6 ${orientation === "horizontal" ? "h-[300px] overflow-y-auto" : ""} ${
                orientation === "vertical" && isCollapsed
                  ? "min-h-[60px]"
                  : "min-h-[120px]"
              }`}
            >
              <div className="text-center text-gray-400 dark:text-gray-500">
                {hasFailed
                  ? t("button.failed")
                  : t("placeholder.waiting_for_all_models")}
              </div>
            </div>
          ) : (
            messages.map(
              (message, index) =>
                message.role === "assistant" && (
                  <div
                    key={index}
                    className={cn(
                      "rounded-md bg-white dark:bg-black",
                      orientation === "vertical" && isCollapsed
                        ? ""
                        : "min-h-[120px]"
                    )}
                  >
                    <div
                      className={`rounded-md border ${
                        streamStatus === "streaming"
                          ? "border-blue-300 dark:border-blue-700"
                          : streamStatus === "complete"
                            ? "border-purple-300 dark:border-purple-700"
                            : streamStatus === "failed"
                              ? "border-red-300 dark:border-red-700"
                              : "border-purple-300 dark:border-purple-700"
                      } p-6 ${orientation === "horizontal" ? "h-[300px] overflow-y-auto" : ""} ${orientation === "vertical" && isCollapsed ? "min-h-[60px]" : "min-h-[120px]"}`}
                    >
                      {orientation === "vertical" && isCollapsed ? (
                        <div className="text-center text-gray-500">
                          {t("button.content_collapsed")}
                        </div>
                      ) : (
                        <Markdown
                          className="prose max-w-none pb-4 dark:prose-invert"
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw as any]}
                        >
                          {message.content}
                        </Markdown>
                      )}
                    </div>
                  </div>
                )
            )
          )}
        </div>
      </div>
    );
  }
);

Text.displayName = "Text";

export default Text;
