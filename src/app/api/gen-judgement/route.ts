import {
  APICallError,
  createDataStreamResponse,
  generateId,
  generateText,
  streamText,
} from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { env } from "@/env";
import { createScopedLogger } from "@/utils";
import ky from "ky";

const logger = createScopedLogger("gen-judgement");

export async function POST(request: Request) {
  try {
    const {
      prompt,
      model,
      apiKey,
      messages,
      language = "cn",
    }: {
      prompt: string;
      model: string;
      apiKey: string;
      messages: {
        role: string;
        content: string;
      }[];
      language?: string;
    } = await request.json();

    return createDataStreamResponse({
      execute: (dataStream) => {
        dataStream.writeData("initialized call");

        try {
          const ai302 = createAI302({
            apiKey,
            baseURL: env.NEXT_PUBLIC_API_URL,
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
              const url =
                input instanceof URL ? input : new URL(input.toString());
              try {
                return await ky(url, {
                  ...init,
                  retry: {
                    limit: 2,
                    methods: [
                      "post",
                      "get",
                      "put",
                      "head",
                      "delete",
                      "options",
                      "trace",
                    ], // 明确包含 'post'
                  },
                  timeout: 25000,
                });
              } catch (error: any) {
                if (error.response) {
                  const errorData = await error.response.json();
                  // We can't directly signal an error in the dataStream
                  // So throw the error and let the onError handler in createDataStreamResponse handle it
                  throw new Error(JSON.stringify(errorData));
                } else {
                  throw new Error(JSON.stringify(error));
                }
              }
            },
          });

          const result = streamText({
            model: ai302.chatModel(model),
            messages: messages as any,
            providerOptions: {
              anthropic: {
                thinking: { type: "enabled", budgetTokens: 12000 },
              },
            },
            onChunk(chunk) {
              dataStream.writeMessageAnnotation({
                chunk: model,
                status: "streaming",
              });
            },
            onFinish() {
              dataStream.writeMessageAnnotation({
                chunk: model,
                status: "complete",
                timestamp: new Date().toISOString(),
              });

              dataStream.writeData("call completed");
            },
          });

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        } catch (error) {
          console.error("Error within stream execution:", error);
          // Let the error propagate to the onError handler
          throw error;
        }
      },
      onError: (error) => {
        console.error("API Error:", error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    // logger.error(error);

    if (error instanceof APICallError) {
      console.log("APICallError", error);

      const resp = error.responseBody;

      return Response.json(resp, { status: 500 });
    }
    // Handle different types of errors
    let errorMessage = "Failed to generate judgement";
    let errorCode = 500;

    if (error instanceof Error) {
      console.log("Error", error);

      errorMessage = error.message;
      // You can add specific error code mapping here if needed
      if ("code" in error && typeof (error as any).code === "number") {
        errorCode = (error as any).code;
      }
    }

    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成评估失败",
          message_en: "Failed to generate judgement",
          message_ja: "評価の生成に失敗しました",
          type: "JUDGEMENT_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
