import { AnalysisResult, Question, QuestionTopic } from "@/pages/analyzer/types";

export const databaseService = {
  saveQuestions: async (result: AnalysisResult): Promise<void> => {
    try {
      localStorage.setItem('analyzedQuestions', JSON.stringify(result.questions));
      localStorage.setItem('questionTopics', JSON.stringify(result.topics));
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  },

  getQuestions: async (): Promise<AnalysisResult> => {
    try {
      const questionsJson = localStorage.getItem('analyzedQuestions');
      const topicsJson = localStorage.getItem('questionTopics');

      const questions: Question[] = questionsJson ? JSON.parse(questionsJson) : [];
      const topics: QuestionTopic[] = topicsJson ? JSON.parse(topicsJson) : [];

      return { questions, topics };
    } catch (error) {
      console.error('Error getting questions:', error);
      return { questions: [], topics: [] };
    }
  },

  getQuestionsByFilter: async (
    yearFilter: string,
    subjectFilter: string,
    keywordFilter: string
  ): Promise<AnalysisResult> => {
    try {
      const questionsJson = localStorage.getItem('analyzedQuestions');
      const topicsJson = localStorage.getItem('questionTopics');

      let questions: Question[] = questionsJson ? JSON.parse(questionsJson) : [];
      let topics: QuestionTopic[] = topicsJson ? JSON.parse(topicsJson) : [];

      // Apply filters
      if (yearFilter !== 'all_years') {
        questions = questions.filter(q => q.year === yearFilter);
      }
      if (subjectFilter !== 'all_subjects') {
        questions = questions.filter(q => q.subject === subjectFilter);
      }
      if (keywordFilter) {
        const keyword = keywordFilter.toLowerCase();
        questions = questions.filter(q =>
          q.text.toLowerCase().includes(keyword) ||
          (q.keywords && q.keywords.some(k => k.toLowerCase().includes(keyword))) ||
          (q.topics && q.topics.some(t => t.toLowerCase().includes(keyword)))
        );
      }

      return { questions, topics };
    } catch (error) {
      console.error('Error getting filtered questions:', error);
      return { questions: [], topics: [] };
    }
  },
  clearQuestions: async () => {
    try {
      localStorage.removeItem('analyzedQuestions');
      localStorage.removeItem('questionTopics');
    } catch (error) {
      console.error('Error clearing saved questions:', error);
    }
  }
};
