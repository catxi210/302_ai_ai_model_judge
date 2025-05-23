export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 模型判官",
      description: "将任意素材转为有意思的播客",
      image: "/images/global/desc_zh.png",
    },
    en: {
      title: "AI Model Judge",
      description: "Turn any material into an interesting podcast",
      image: "/images/global/desc_en.png",
    },
    ja: {
      title: "AIモデル判事",
      description: "あらゆる素材を興味深いポッドキャストに変える",
      image: "/images/global/desc_ja.png",
    },
  },
};
