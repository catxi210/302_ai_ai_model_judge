import { FC, SVGProps } from "react";

export interface ModelInfo {
  id: string;
  name: string;
}

export const MODEL_LIST: ModelInfo[] = [
  { id: "claude-3-opus-20240229", name: "claude-3-opus-20240229" },
  { id: "qwen-max-latest", name: "qwen-max-latest" },
  { id: "deepseek-chat", name: "deepseek-chat" },
  { id: "gpt-4o", name: "gpt-4o" },
  { id: "claude-3-5-sonnet-20240620", name: "claude-3-5-sonnet-20240620" },
  { id: "llama3.1-405b", name: "llama3.1-405b" },
  { id: "claude-3-5-sonnet-20241022", name: "claude-3-5-sonnet-20241022" },
  { id: "claude-3-5-haiku-20241022", name: "claude-3-5-haiku-20241022" },
  { id: "gpt-4o-2024-11-20", name: "gpt-4o-2024-11-20" },
  { id: "nova-pro", name: "nova-pro" },
  { id: "llama3.3-70b", name: "llama3.3-70b" },
  { id: "claude-3-5-haiku-latest", name: "claude-3-5-haiku-latest" },
  { id: "Doubao-1.5-pro-32k", name: "Doubao-1.5-pro-32k" },
  { id: "sonar-reasoning", name: "sonar-reasoning" },
  { id: "o3-mini", name: "o3-mini" },
  { id: "gemini-2.0-flash", name: "gemini-2.0-flash" },
  { id: "grok-3", name: "grok-3" },
  { id: "grok-3-reasoner", name: "grok-3-reasoner" },
  { id: "claude-3-7-sonnet-latest", name: "claude-3-7-sonnet-latest" },
  {
    id: "claude-3-7-sonnet-20250219-thinking",
    name: "claude-3-7-sonnet-20250219-thinking",
  },
  { id: "claude-3-7-sonnet-20250219", name: "claude-3-7-sonnet-20250219" },
  { id: "kimi-latest", name: "kimi-latest" },
  { id: "qwq-32b", name: "qwq-32b" },
  { id: "gemini-2.5-pro-preview-03-25", name: "gemini-2.5-pro-preview-03-25" },
  { id: "grok-3-beta", name: "grok-3-beta" },
  { id: "grok-3-mini-beta", name: "grok-3-mini-beta" },
  { id: "glm-z1-air", name: "glm-z1-air" },
  { id: "gpt-4.1", name: "gpt-4.1" },
  { id: "gpt-4.1-mini", name: "gpt-4.1-mini" },
  { id: "o3", name: "o3" },
  { id: "o4-mini", name: "o4-mini" },
  {
    id: "gemini-2.5-flash-preview-04-17",
    name: "gemini-2.5-flash-preview-04-17",
  },
  { id: "qwen3-235b-a22b", name: "qwen3-235b-a22b" },
  { id: "gemini-2.5-pro-preview-05-06", name: "gemini-2.5-pro-preview-05-06" },
  { id: "llama-4-maverick", name: "llama-4-maverick" },
];

// Helper function to get model by ID
export const getModelById = (id: string): ModelInfo | undefined => {
  return MODEL_LIST.find((model) => model.id === id);
};

// // Helper function to get model by alias
// export const getModelByAlias = (alias: string): ModelInfo | undefined => {
//   return MODEL_LIST.find((model) => model.alias === alias);
// };

// Helper function to get random model
export const getRandomModel = (excludeModel?: string): string => {
  const availableModels = MODEL_LIST.filter(
    (model) => model.id !== excludeModel
  );
  return availableModels[Math.floor(Math.random() * availableModels.length)].id;
};
