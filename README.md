# <p align="center"> ⚖️ AI Model Judge 🚀✨</p>

<p align="center">AI Model Judge allows you to test multiple models at once, quickly obtain comprehensive evaluation results, and select the model that best suits your needs.</p>

<p align="center"><a href="https://302.ai/en/tools/judge/" target="blank"><img src="https://file.302.ai/gpt/imgs/github/20250102/72a57c4263944b73bf521830878ae39a.png" /></a></p >

<p align="center"><a href="README_zh.md">中文</a> | <a href="README.md">English</a> | <a href="README_ja.md">日本語</a></p>

![](docs/302_judge_en.png)

This is the open-source version of the [AI Model Judge](https://302.ai/en/tools/judge/) from [302.AI](https://302.ai/en/). You can directly log in to 302.AI to use the online version with zero code and zero background, or modify and deploy it yourself according to your requirements.

## Interface Preview
Enter any question or description, select AI models for answering and judging from the model list respectively. The judging model will evaluate and score the responses from other models. Based on the evaluation results, choose the model that best suits your needs.      
![](docs/302_AI_Model_Judge_en_screenshot_01.png)

Provides complete history functionality for easy viewing and management of generation records.
![](docs/302_AI_Model_Judge_en_screenshot_02.png)          
  

## Project Features
### 🤖 Multi-model Comparison
Supports testing multiple AI models simultaneously for quick performance comparison.
### ⚖️ Intelligent Evaluation
AI models serve as judges to provide objective scoring of other models' responses.
### 📊 Evaluation Reports
Generates detailed evaluation reports to help users make informed decisions.
### 📝 History Records
Complete history functionality for easy viewing and management of generation records.
### 🌍 Multi-language Support
- Chinese Interface
- English Interface
- Japanese Interface

## 🚩 Future Update Plans
- [ ] Add more evaluation dimensions and metrics

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **State Management**: Jotai
- **Form Handling**: React Hook Form
- **HTTP Client**: ky
- **i18n**: next-intl
- **Theming**: next-themes
- **Code Standards**: ESLint, Prettier
- **Commit Standards**: Husky, Commitlint

## Development & Deployment
1. Clone the project
```bash
git clone https://github.com/302ai/302_ai_ai_model_judge
cd 302_ai_ai_model_judge
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment
```bash
cp .env.example .env.local
```
Modify the environment variables in `.env.local` as needed.

4. Start development server
```bash
pnpm dev
```

5. Build for production
```bash
pnpm build
pnpm start
```

## ✨ About 302.AI ✨
[302.AI](https://302.ai/en/) is an enterprise-oriented AI application platform that offers pay-as-you-go services, ready-to-use solutions, and an open-source ecosystem.✨
1. 🧠 Comprehensive AI capabilities: Incorporates the latest in language, image, audio, and video models from leading AI brands.
2. 🚀 Advanced application development: We build genuine AI products, not just simple chatbots.
3. 💰 No monthly fees: All features are pay-per-use, fully accessible, ensuring low entry barriers with high potential.
4. 🛠 Powerful admin dashboard: Designed for teams and SMEs - managed by one, used by many.
5. 🔗 API access for all AI features: All tools are open-source and customizable (in progress).
6. 💡 Powerful development team: Launching 2-3 new applications weekly with daily product updates. Interested developers are welcome to contact us.