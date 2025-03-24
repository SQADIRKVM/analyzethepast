
export type ProcessStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export interface Question {
  id: string;
  text: string;
  year: string;
  subject: string;
  topics?: string[];
  keywords: string[];
  relatedVideos?: {
    id: string;
    title: string;
    thumbnail: string;
    url: string;
  }[];
}

export interface QuestionTopic {
  name: string;
  count: number;
  questions: string[]; // Question IDs
}

export interface AnalysisResult {
  questions: Question[];
  topics: QuestionTopic[];
}
