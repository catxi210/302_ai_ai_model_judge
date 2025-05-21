import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { ModelInfo } from "./models_store";

type JudgeForm = {
  prompt: string;
  answerModel: ModelInfo[] | null;
  judgeModel: ModelInfo | null;
  fullMarks: number;
  responseFormat: "prosAndCons" | "multiDimensional";
};

export const judgeFormAtom = atomWithStorage<JudgeForm>(
  "judgeForm",
  {
    prompt: "",
    answerModel: null,
    judgeModel: null,
    fullMarks: 5,
    responseFormat: "prosAndCons",
  },
  createJSONStorage(() =>
    typeof window !== "undefined"
      ? sessionStorage
      : {
          getItem: () => null,
          setItem: () => null,
          removeItem: () => null,
        }
  ),
  {
    getOnInit: true,
  }
);
