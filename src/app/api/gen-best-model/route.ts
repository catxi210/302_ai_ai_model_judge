import { APICallError, generateText } from "ai";
import { createAI302 } from "@302ai/ai-sdk";
import { createScopedLogger } from "@/utils";
import { env } from "@/env";

const logger = createScopedLogger("gen-options");

export async function POST(request: Request) {
  try {
    const {
      prompt,
      apiKey,
      model,
    }: {
      prompt: string;
      apiKey: string;
      model: string;
    } = await request.json();

    const ai302 = createAI302({
      apiKey,
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1/chat/completions`,
    });

    const result = await generateText({
      model: ai302.chatModel("gpt-4.1-mini"),
      messages: [
        {
          role: "system",
          content: `
Please extract the best model summarized in the uploaded evaluation report. Directly output the model name without any further explanation!!
      `,
        },
        {
          role: "user",
          content: prompt + ",Directly output the model name!!",
        },
      ],
    });

    logger.info("Generated successfully");
    console.log("result.text", result.text);

    // Simply return the text response
    return Response.json({
      text: result.text.trim(),
    });
  } catch (error) {
    logger.error("Generation error", error);

    if (error instanceof APICallError) {
      console.log("APICallError", error);
      const resp = error.responseBody;
      return Response.json(resp, { status: 500 });
    }

    console.log("Error details:", error);

    // Handle different types of errors
    const errorMessage = "Failed to generate best model";
    const errorCode = 500;

    if (error instanceof Error) {
      console.log("error", error);
      const resp = (error as any)?.responseBody as any;

      if (resp) {
        return Response.json(resp, { status: 500 });
      }
    }

    // Return a standardized error response if we couldn't handle it specifically
    return Response.json(
      {
        error: {
          err_code: errorCode,
          message: errorMessage,
          message_cn: "生成最佳模型失败",
          message_en: "Failed to generate best model",
          message_ja: "最適なモデルの生成に失敗しました",
          type: "BEST_MODEL_GENERATION_ERROR",
        },
      },
      { status: errorCode }
    );
  }
}
