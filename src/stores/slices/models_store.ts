import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type ModelCategory = "OpenAI" | "Anthropic" | "国产模型" | "开源模型";

export interface ModelInfo {
  id: string;
  model_type: string;
  model: string;
  remark?: string;
  description?: string;
  inputCost?: string;
  outputCost?: string;
  real_model?: string;
  en_remark?: string;
  ja_remark?: string;
}

interface ModelsStore {
  options: ModelInfo[];
}

// Initialize with models from the original MODEL_LIST
export const modelsStoreAtom = atomWithStorage<ModelsStore>("modelsStore", {
  options: [],
});
