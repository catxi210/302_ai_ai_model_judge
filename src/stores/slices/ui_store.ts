import { atomWithStorage, createJSONStorage } from "jotai/utils";

type UiStore = {
  activeTab: "judge" | "history";
};

export const uiStoreAtom = atomWithStorage<UiStore>(
  "uiStore",
  {
    activeTab: "judge",
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
