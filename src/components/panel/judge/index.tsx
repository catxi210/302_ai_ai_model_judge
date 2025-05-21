import React, { useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import PromptInput from "./prompt-input";
import AnswerModel from "./answer-model";
import JudgeModel from "./judge-model";
import ReportFormat from "./report-format";
import Marks from "./marks";
import Text, { TextRef } from "./text";
import { useAtom } from "jotai";
import { judgeFormAtom } from "@/stores/slices/form_store";
import {
  judgePromptMultiDimensional,
  judgePromptProsAndCons,
  SupportedLocale,
} from "@/constants/prompts";
import { addData } from "@/app/db/indexDB";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import ky from "ky";
import { env } from "@/env";
import { modelsStoreAtom } from "@/stores/slices/models_store";

// Define processing status type
type ProcessingStatus = "idle" | "fetchingAnswers" | "judging" | "complete";

// Interface for model answers
interface ModelAnswer {
  model: string;
  answer: string;
  id: string;
}

// Interface for judge model answer
interface JudgeModelAnswer {
  model: string;
  answer: string;
  format: string;
  fullMarks: number;
}

const Judge = () => {
  const t = useTranslations();
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">(
    "vertical"
  );
  const [form, setForm] = useAtom(judgeFormAtom);
  const toastId = useId();
  const { apiKey } = store.get(appConfigAtom);

  const locale = useLocale() as SupportedLocale;

  // Store model answers in an array of objects
  const [modelAnswers, setModelAnswers] = useState<ModelAnswer[]>([]);

  // Store judge model answer in a separate object
  const [judgeAnswer, setJudgeAnswer] = useState<JudgeModelAnswer | null>(null);

  // Single status state to track processing flow
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  // Track completed models
  const [completedModels, setCompletedModels] = useState<Set<string>>(
    new Set()
  );
  // Track failed models
  const [failedModels, setFailedModels] = useState<Set<string>>(new Set());
  // Store pending prompt to send after refs are ready
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  // Use the selected models from form.answerModel
  const selectedModels = form.answerModel || [];
  const judgeModelId = form.judgeModel?.model || ""; // Get judge model id for display

  // Create refs map container
  const modelRefsMapRef = useRef<{ [key: string]: React.RefObject<TextRef> }>(
    {}
  );
  const [modelsStore, setModelsStore] = useAtom(modelsStoreAtom);

  const [bestModel, setBestModel] = useState<string | null>(null);

  // Simplified judge ref
  const judgeRef = useRef<TextRef>(null);

  // Add new state for visual feedback
  const [isJudgeCopied, setIsJudgeCopied] = useState(false);

  const fetchModels = async () => {
    try {
      if (!apiKey) {
        return;
      }

      const res = await ky.get(
        `${env.NEXT_PUBLIC_AUTH_API_URL}/gpt/api/models`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const resp: any = await res.json();
      const data = resp.data as any;

      setModelsStore({
        options: data.data || [],
      });
    } catch (error: any) {
      console.error("Failed to fetch models:", error);
      // Check for specific authentication errors
      if (error.response?.json) {
        try {
          const errorData = await error.response.json();
          if (errorData.code === 5001) {
            toast.error(
              t("errors.authentication_failed") ||
                "Authentication failed. Please check your API key."
            );
          } else {
            toast.error(
              t("errors.fetch_models_failed") ||
                "Failed to fetch models. Please try again later."
            );
          }
        } catch (jsonError) {
          toast.error(
            t("errors.fetch_models_failed") ||
              "Failed to fetch models. Please try again later."
          );
        }
      } else {
        toast.error(
          t("errors.fetch_models_failed") ||
            "Failed to fetch models. Please try again later."
        );
      }
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Handle model completion
  const handleModelComplete = (modelId: string, id: string) => {
    // When a model completes, save its response to our state array
    const ref = modelRefsMapRef.current[modelId];
    if (ref?.current) {
      const assistantMessages = ref.current.messages.filter(
        (msg) => msg.role === "assistant"
      );

      if (assistantMessages.length > 0) {
        const modelAnswer =
          assistantMessages[assistantMessages.length - 1].content;

        // Check if we already have an answer for this model
        const existingIndex = modelAnswers.findIndex(
          (m) => m.model === modelId
        );

        if (existingIndex >= 0) {
          // Update existing answer
          setModelAnswers((prev) => {
            const updated = [...prev];
            updated[existingIndex] = {
              model: modelId,
              answer: modelAnswer,
              id,
            };
            return updated;
          });
        } else {
          // Add new answer
          setModelAnswers((prev) => [
            ...prev,
            { model: modelId, answer: modelAnswer, id },
          ]);
        }
      }
    }

    // Remove from failed models if it was previously marked as failed
    setFailedModels((prev) => {
      const updated = new Set(prev);
      updated.delete(modelId);
      return updated;
    });

    setCompletedModels((prev) => new Set(prev).add(modelId));
  };

  // Handle model failure
  const handleModelFailed = (modelId: string) => {
    console.log(`Model ${modelId} failed to generate response`);

    // Add to failed models set
    setFailedModels((prev) => new Set(prev).add(modelId));

    // We also mark it as completed so we don't keep waiting for it
    setCompletedModels((prev) => new Set(prev).add(modelId));
  };

  // Initialize refs for selected models
  useEffect(() => {
    // Create ref for each selected model if it doesn't exist yet
    selectedModels.forEach((modelInfo) => {
      const modelId = modelInfo.model;
      if (!modelRefsMapRef.current[modelId]) {
        modelRefsMapRef.current[modelId] = React.createRef<TextRef>();
      }
    });

    // Clean up refs for models that are no longer selected
    Object.keys(modelRefsMapRef.current).forEach((modelId) => {
      if (!selectedModels.some((model) => model.model === modelId)) {
        delete modelRefsMapRef.current[modelId];
      }
    });
  }, [selectedModels]);

  // Send pending prompt when it's available
  useEffect(() => {
    if (pendingPrompt && status === "fetchingAnswers") {
      const allRefsReady = selectedModels.every((modelInfo) => {
        const modelId = modelInfo.model;
        return (
          modelRefsMapRef.current[modelId] &&
          modelRefsMapRef.current[modelId].current
        );
      });

      if (allRefsReady) {
        // Reset model answers for a new prompt
        setModelAnswers([]);
        setFailedModels(new Set()); // Reset failed models
        judgeRef.current?.resetJudge();
        selectedModels.forEach((modelInfo) => {
          const modelId = modelInfo.model;
          const actualModelId = modelInfo.real_model || modelId;
          const ref = modelRefsMapRef.current[modelId];
          if (ref && ref.current) {
            // Use resetAndSend instead of append for a fresh conversation
            ref.current.resetAndSend({
              role: "user",
              content: pendingPrompt,
            });
          }
        });

        setPendingPrompt(null); // Clear pending prompt
      } else {
        // If refs aren't ready yet, we'll try again on next render
        console.log("Waiting for refs to be ready...");
      }
    }
  }, [pendingPrompt, selectedModels, status]);

  // Check if all model responses are complete or failed
  useEffect(() => {
    if (
      status === "fetchingAnswers" &&
      selectedModels.length > 0 &&
      completedModels.size === selectedModels.length
    ) {
      // Only proceed if we have at least one successful model
      const successfulModelsCount = selectedModels.length - failedModels.size;
      if (successfulModelsCount > 0) {
        sendToJudgeModel();
      } else {
        console.error("All models failed to generate responses");
        setStatus("idle");
        // Could display a toast message here
      }
    }
  }, [completedModels, selectedModels, status, failedModels]);

  // Function to collect all model responses and send to judge model
  const sendToJudgeModel = () => {
    if (!form.judgeModel) return;

    setStatus("judging");
    console.log("All collected model answers:", modelAnswers);
    console.log("Currently failed models:", [...failedModels]);

    // Collect all model responses, filtering out failed models
    const modelResponses = modelAnswers
      .filter(Boolean) // Filter out any undefined/null entries
      .filter((model) => !failedModels.has(model.model)) // Filter out failed models
      .filter((model) => model.answer) // Filter out models with no responses
      .map(({ model, answer }) => ({
        name: model,
        answer,
      }));

    console.log("Sending model responses to judge:", modelResponses);

    if (modelResponses.length === 0) {
      console.log("No successful model responses to send to judge");
      setStatus("idle");
      return;
    }

    // Create the prompt based on the selected format
    let prompt;
    const judgeModelName = form.judgeModel.model; // Use model name for display in prompts
    const judgeModelApi = form.judgeModel.real_model || form.judgeModel.model; // Use real_model for API calls if available

    if (form.responseFormat === "multiDimensional") {
      prompt =
        judgePromptMultiDimensional(
          form.prompt,
          judgeModelName,
          form.fullMarks,
          modelResponses
        )[locale] ||
        judgePromptMultiDimensional(
          form.prompt,
          judgeModelName,
          form.fullMarks,
          modelResponses
        )["en"]; // Fallback to English if locale not supported
    } else {
      prompt =
        judgePromptProsAndCons(
          form.prompt,
          judgeModelName,
          form.fullMarks,
          modelResponses
        )[locale] ||
        judgePromptProsAndCons(
          form.prompt,
          judgeModelName,
          form.fullMarks,
          modelResponses
        )["en"]; // Fallback to English if locale not supported
    }

    // Send to judge model
    if (judgeRef.current) {
      judgeRef.current.resetAndSend({
        role: "user",
        content: prompt,
      });
    }
  };

  // Handle judge completion
  const handleJudgeComplete = async (content: string) => {
    console.log("Judge model completed");
    // setStatus("complete"); // Moved to the end of try block

    if (!judgeRef.current) {
      console.error("Judge reference not available");
      setStatus("idle"); // Reset status to allow retry
      return;
    }

    // if (!form.prompt) {
    //   console.error("No prompt available");
    //   return;
    // }

    const judgeMessages = judgeRef.current.messages.filter(
      (msg) => msg.role === "assistant"
    );

    if (judgeMessages.length === 0) {
      console.error("No judge messages found");
      setStatus("idle"); // Reset status to allow retry
      return;
    }

    const judgeAnswerText = judgeMessages[judgeMessages.length - 1].content;

    // Create judge model answer object with all required data
    const judgeModelData: JudgeModelAnswer = {
      model: form.judgeModel?.model || "unknown",
      answer: judgeAnswerText,
      format: form.responseFormat || "multiDimensional",
      fullMarks: form.fullMarks || 10,
    };

    console.log("Judge model data:", judgeModelData);
    // console.log("Best model:", bestModel);
    // Update state with judge answer
    setJudgeAnswer(judgeModelData);

    // Filter out failed models for the final record
    const successfulModelAnswers = modelAnswers.filter(
      (answer) => !failedModels.has(answer.model)
    );

    console.log(
      "Final successful model answers being saved:",
      successfulModelAnswers
    );

    try {
      const res = await ky.post("/api/gen-best-model", {
        json: {
          prompt: content,
          model:
            form.judgeModel?.real_model || form.judgeModel?.model || "unknown",
          apiKey,
        },
        retry: {
          limit: 2,
          methods: ["post", "get", "put", "head", "delete", "options", "trace"],
        },
        timeout: 20000,
      });
      const data: { text: string } = await res.json();
      const bestModel = data.text;
      setBestModel(bestModel);
      // Create the final record with model answers array and judge object as separate properties
      const recordData = {
        prompt: form.prompt || t("eg.question"),
        modelAnswer: JSON.stringify({
          models: successfulModelAnswers,
          judge: judgeModelData,
        }),
        bestModel: bestModel,
      };

      console.log("Saving to IndexedDB:", recordData);

      // Save to IndexedDB and handle the promise
      await addData(recordData);
      console.log("Successfully saved to IndexedDB");
      setStatus("complete"); // Set status to complete only after all async operations succeed
    } catch (error) {
      console.error("Failed during API call or saving to IndexedDB", error);
      toast.error(
        t("errors.failed_to_process_judge_report") ||
          "Failed to process and save judge report."
      ); // Added a fallback error message
      setStatus("idle"); // Reset status to idle on error to allow retry
    }
  };

  // Handle judge failure
  const handleJudgeFailed = () => {
    console.log("Judge model failed");
    // Reset the status to idle so the user can try again
    setStatus("idle");
  };

  const handleStart = async () => {
    // Get the prompt from the judgeFormAtom
    const prompt = form.prompt || t("eg.question");

    if (!apiKey) {
      toast.error(
        t("errors.missing_api_key") || "API key is required to use this feature"
      );
      return;
    }

    if (!form.answerModel || form.answerModel.length === 0) {
      toast.error(t("warning.please_select_answer_model"));
      return;
    }

    if (!form.judgeModel) {
      toast.error(t("warning.please_select_judge_model"));
      return;
    }

    if (form.fullMarks < 1) {
      toast.error(t("warning.full_marks_must_be_greater_than_0"));
      return;
    }

    // Reset states
    setBestModel(null);
    setCompletedModels(new Set());
    setFailedModels(new Set());
    // Explicitly reset modelAnswers to ensure new models are properly considered
    setModelAnswers([]);
    setStatus("fetchingAnswers");
    setPendingPrompt(prompt);

    // Reset collapse state for all model refs
    Object.values(modelRefsMapRef.current).forEach((ref) => {
      if (ref.current?.resetCollapse) {
        ref.current.resetCollapse();
      }
    });

    // Reset collapse state for judge ref
    if (judgeRef.current?.resetCollapse) {
      judgeRef.current.resetCollapse();
    }
  };

  // Determine if we're currently processing
  const isProcessing = status !== "idle" && status !== "complete";

  const handleDeleteModel = (modelId: string) => {
    console.log("Deleting model:", modelId);
    // Remove from modelAnswers
    setModelAnswers(modelAnswers.filter((answer) => answer.model !== modelId));
    setForm({
      ...form,
      answerModel: form.answerModel
        ? form.answerModel.filter((model) => model.model !== modelId)
        : [],
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <PromptInput />

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("labels.view_switch")}
            </span>
            <div className="flex overflow-hidden rounded-full border">
              <Button
                variant={orientation === "vertical" ? "default" : "ghost"}
                className={`rounded-r-none ${orientation === "vertical" ? "bg-purple-200 text-purple-800 hover:bg-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800" : ""}`}
                onClick={() => setOrientation("vertical")}
              >
                {t("labels.vertical")}
              </Button>
              <Button
                variant={orientation === "horizontal" ? "default" : "ghost"}
                className={`rounded-l-none ${orientation === "horizontal" ? "bg-purple-200 text-purple-800 hover:bg-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800" : ""}`}
                onClick={() => setOrientation("horizontal")}
              >
                {t("labels.horizontal")}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <AnswerModel disabled={isProcessing} />
            <JudgeModel disabled={isProcessing} />

            <ReportFormat />
            <Marks />

            <Button
              className="w-full bg-purple-600 text-white hover:bg-purple-700"
              onClick={handleStart}
              disabled={isProcessing}
            >
              {isProcessing
                ? t("button.generate_loading")
                : t("button.generate")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* Container for all Text components (Judge and Answer Models) */}
        {/* This structure ensures Text components are not unmounted on orientation change */}
        <div
          className={orientation === "horizontal" ? "flex flex-wrap gap-6" : ""}
        >
          {/* Render Judge Model First if it exists and is in selectedModels or if it should always be shown */}
          {judgeModelId && (
            <div
              key={judgeModelId} // Key is on this stable wrapper div
              className={
                orientation === "horizontal"
                  ? "w-full md:w-[calc(33.333%-1rem)]"
                  : "mb-6" // Add margin for vertical spacing
              }
            >
              <Text
                key={judgeModelId} // Keep key here as well for Text component itself
                model={judgeModelId}
                ref={judgeRef}
                onComplete={handleJudgeComplete}
                onFailed={handleJudgeFailed}
                orientation={orientation}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Render Answer Models */}
          {selectedModels.map((modelInfo) => (
            <div
              key={modelInfo.model} // Key is on this stable wrapper div
              className={
                orientation === "horizontal"
                  ? "w-full md:w-[calc(33.333%-1rem)]"
                  : "mb-6" // Add margin for vertical spacing
              }
            >
              <Text
                model={modelInfo.model}
                ref={modelRefsMapRef.current[modelInfo.model]} // Ref remains stable
                onComplete={(id) => handleModelComplete(modelInfo.model, id)}
                onFailed={() => handleModelFailed(modelInfo.model)}
                toastId={toastId}
                onDelete={() => handleDeleteModel(modelInfo.model)}
                orientation={orientation} // Orientation prop is passed down
                isProcessing={isProcessing}
                bestModel={bestModel || undefined}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Judge;
