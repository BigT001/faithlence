export interface Scripture {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface KeyQuote {
  quote: string;
  timestamp?: string;
  analysis: string;
  theologicalInsight: string;
  positivity: string;
}

export interface SocialMediaHook {
  type: 'opening' | 'curiosity' | 'emotional' | 'question' | 'statistic';
  text: string;
  platform: string; // e.g., "Instagram", "Twitter", "Facebook", "TikTok"
}

export interface TheologicalView {
  theme: string;
  biblicalPerspective: string;
  practicalApplication: string;
  relatedScriptures: Scripture[];
}

export interface GeneratedContent {
  _id?: string;
  sourceType: 'upload';
  sourceUrl?: string;
  videoTitle?: string;
  fileName?: string;
  transcription?: string;
  summary: string;
  captions: string[];
  hashtags: string[];
  story: string;
  scriptures: Scripture[];
  deepAnalysis?: {
    keyQuotes: KeyQuote[];
    theologicalViews: TheologicalView[];
    positivityInsights: string[];
    overallMessage: string;
  };
  socialMediaHooks?: SocialMediaHook[];
  createdAt?: Date;
  updatedAt?: Date;
}


export interface AnalysisResult {
  summary: string;
  captions: string[];
  hashtags: string[];
  story: string;
  scriptures: Scripture[];
  deepAnalysis?: {
    keyQuotes: KeyQuote[];
    theologicalViews: TheologicalView[];
    positivityInsights: string[];
    overallMessage: string;
  };
  socialMediaHooks?: SocialMediaHook[];
  transcription?: string;
}

export interface TranscriptionResult {
  text: string;
  title?: string;
}
