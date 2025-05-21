export type SupportedLocale = "zh" | "en" | "ja";

export const judgePromptMultiDimensional = (
  question: string,
  judge: string,
  marks: number,
  models: { name: string; answer: string }[]
) => {
  return {
    zh: `你是一位经验丰富的评估者(${judge})，你的任务是根据以下提供的模型和它们对同一问题的回答，生成一个包含评分和详细评价的报告。

评分维度：

- 准确性： 模型提供的信息是否准确无误（1-${marks}分，${marks}分代表完全准确）
- 相关性： 模型的回答是否与问题紧密相关（1-${marks}分，${marks}分代表完全相关）
- 逻辑性： 模型的回答是否具有清晰的逻辑结构（1-${marks}分，${marks}分代表逻辑严谨）
- 创造性： 模型是否能提供独特、创新的见解（1-${marks}分，${marks}分代表极具创新）
- 完整性： 模型的回答是否全面、详尽（1-${marks}分，${marks}分代表非常完整）
- 实用性： 模型的回答是否具有实际应用价值（1-${marks}分，${marks}分代表极具实用价值）

请对每个模型及其回答进行以下操作：

1.  给出每个评分维度的具体分数。
2.  提供针对每个评分维度的详细评价，解释你给出该分数的原因。
3.  总结模型的整体表现，并指出其优点和不足。

问题：${question}

模型回答： 

${models.map((model) => `${model.name}：${model.answer}`).join("\n")}



请务必确保每个模型都有对应的评分和详细评价。`,
    en: `You are an experienced evaluator (${judge}). Your task is to generate a report with detailed evaluation and scores based on the following models and their answers to the same question.

Evaluation dimensions:

- Accuracy: Whether the information provided by the model is accurate (1-${marks} points, ${marks} represents complete accuracy)
- Relevance: Whether the model's answer is closely related to the question (1-${marks} points, ${marks} represents complete relevance)
- Logic: Whether the model's answer has a clear logical structure (1-${marks} points, ${marks} represents rigorous logic)
- Creativity: Whether the model can provide unique and innovative insights (1-${marks} points, ${marks} represents highly innovative)
- Completeness: Whether the model's answer is comprehensive and thorough (1-${marks} points, ${marks} represents very complete)
- Practicality: Whether the model's answer has practical application value (1-${marks} points, ${marks} represents extremely practical value)

Please perform the following operations for each model and its answer:

1. Provide specific scores for each evaluation dimension.
2. Provide detailed evaluation for each dimension, explaining why you gave that score.
3. Summarize the model's overall performance, pointing out its strengths and weaknesses.

Question: ${question}

Model answers:

${models.map((model) => `${model.name}: ${model.answer}`).join("\n")}

Please ensure that each model has corresponding scores and detailed evaluations.`,
    ja: `
    あなたは経験豊富な評価者です(${judge})。あなたのタスクは、以下に提供されるモデルとそれらの同じ質問への回答に基づいて、評価と詳細な評価を含むレポートを生成することです。

評価次元：

-精度：モデルが提供する情報が正確かどうか（1-{満点数}}点、{満点数}点は完全に正確であることを示します）
-依存性：モデルの回答が質問と密接に関連しているか（1-{満点数}点、{満点数}点は完全に関連している）
-論理性：モデルの回答に明確な論理構造があるか（1-{満点点}点、{満点点}点は論理厳密を表す）
-創造性：モデルがユニークで革新的な見解を提供できるか（1-{満点点}点、{満点点}点は革新的であることを意味する）
-完全性：モデルの回答が包括的で詳細（1-{満点点}}点、{満点点}点は非常に完全であることを示す）
-実用性：モデルの回答に実用的な価値があるか（1-{満点数}}点、{満点数}点は非常に実用的な価値を表す）

各モデルとその回答について、次の操作を行います。

1.各スコア次元の具体的なスコアを与える。
2.スコア次元ごとの詳細な評価を提供し、スコアを与えた理由を説明します。
3.モデルの全体的な表現をまとめ、その利点と不足を指摘する。

質問：${question}

モデル回答：

${models.map((model) => `${model.name}: ${model.answer}`).join("\n")}

各モデルに対応する評価と詳細な評価があることを必ず確認してください。

    `,
  } as Record<SupportedLocale, string>;
};

export const judgePromptProsAndCons = (
  question: string,
  judge: string,
  marks: number,
  models: { name: string; answer: string }[]
) => {
  return {
    zh: `你是一位经验丰富的评估者(${judge})。你的任务是根据以下提供的问题和不同模型的回答，生成一个详细的评估报告。

问题：${question}

模型回答：

${models.map((model) => `${model.name}：${model.answer}`).join("\n")}

请对每个模型的回答进行以下评估：

1. 分析优点和缺点
2. 给出总分(满分${marks})并说明理由

最后请给出一个综合性的分析：
1. 对比所有模型的回答
2. 选出最佳答案并说明原因
3. 基于所有模型的回答,给出一个最终的完整答案

注意:
- 评分要客观公正
- 分析要具体详实
- 最终答案要全面且有深度
- 需要体现专业的评估视角`,
    en: `You are an experienced evaluator (${judge}). Your task is to generate a detailed assessment report based on the following question and different model answers.

Question: ${question}

Model answers:

${models.map((model) => `${model.name}: ${model.answer}`).join("\n")}

Please perform the following assessment for each model's answer:

1. Analyze pros and cons
2. Give a total score (out of ${marks}) and explain why

Finally, please provide a comprehensive analysis:
1. Compare all model answers
2. Select the best answer and explain why
3. Based on all model answers, provide a final complete answer

Note:
- Scoring should be objective and fair
- Analysis should be specific and detailed
- The final answer should be comprehensive and in-depth
- Need to reflect a professional assessment perspective`,
    ja: `
あなたは経験豊富な評価者です(${judge})。あなたのタスクは、以下の質問と異なるモデルの回答に基づいて、詳細な評価レポートを生成することです。

問題：${question}

モデル回答：

${models.map((model) => `${model.name}: ${model.answer}`).join("\n")}

各モデルの回答について、以下の評価を行ってください。

1.長所と短所の分析
2.合計点（満点${marks}）を与え、理由を説明する

最後に総合的な分析をしてください：
1.すべてのモデルを比較した回答
2.ベストアンサーを選出し、理由を説明する
3.すべてのモデルの回答に基づいて、最終的な完全な回答を提供する

注：
-採点は客観的で公正でなければならない
-分析は詳細に
-最終的な答えは包括的で奥行きのあるものにする
-専門的な評価の視点を示す必要がある
`,
  } as Record<SupportedLocale, string>;
};
