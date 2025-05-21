"use client";

import { Suspense, lazy, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createScopedLogger } from "@/utils/logger";
import { useAtom } from "jotai";
import { uiStoreAtom } from "@/stores/slices/ui_store";
import { useTranslations } from "next-intl";
import ky from "ky";
import { env } from "@/env";
import { appConfigAtom } from "@/stores/slices/config_store";
import { store } from "@/stores";
import { modelsStoreAtom } from "@/stores/slices/models_store";
const logger = createScopedLogger("Home");

const Judge = lazy(() => import("@/components/panel/judge"));
const History = lazy(() => import("@/components/panel/history"));

export default function Home() {
  const t = useTranslations();

  useEffect(() => {
    logger.info("Hello, Welcome to 302.AI");
  }, []);

  const [uiStore, setUiStore] = useAtom(uiStoreAtom);

  return (
    <div className="grid flex-1">
      <div className="container mx-auto h-full max-w-[1280px] px-2">
        <Tabs
          defaultValue={uiStore.activeTab}
          value={uiStore.activeTab}
          onValueChange={(value) =>
            setUiStore((prev) => ({
              ...prev,
              activeTab: value as "judge" | "history",
            }))
          }
          className="flex size-full flex-col"
        >
          <TabsList className="h-auto w-fit rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="judge"
              className="relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              {t("tabs.judge.title")}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary"
            >
              {t("tabs.history.title")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="judge" className="flex-1" forceMount>
            <Suspense
              fallback={
                <div className="p-4 text-center">{t("home.loading")}</div>
              }
            >
              <Judge />
            </Suspense>
          </TabsContent>
          <TabsContent value="history">
            <Suspense
              fallback={
                <div className="p-4 text-center">{t("home.loading")}</div>
              }
            >
              <History />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
