import { extractQuestionsFromText, extractTextFromPDF, ExtractedText } from './pdfService';
import { performOCR, extractTextFromPDFViaOCR } from './ocrService';
import { databaseService } from './databaseService';
import { findRelatedVideos } from './youtubeService';
import { Question, AnalysisResult, QuestionTopic } from '@/pages/analyzer/types';
import { enhanceText, analyzeQuestions } from './deepSeekService';
import { toast } from 'sonner';

/**
 * API service for processing documents and managing questions
 * In a real app, this would call backend API endpoints
 */
export const apiService = {
  /**
   * Process a PDF file to extract questions
   */
  processPdfFile: async (
    file: File, 
    onProgress: (progress: number, step: string) => void
  ): Promise<AnalysisResult> => {
    try {
      // 1. Extract text from PDF (30%)
      onProgress(10, "Extracting text from PDF...");
      const extractedText = await extractTextFromPDF(file);
      onProgress(30, "PDF text extraction complete");
      
      // 2. Enhance text with AI (50%)
      onProgress(35, "Enhancing text with AI...");
      const combinedText = extractedText.map(page => page.text).join('\n\n');
      const enhancedTextResult = await enhanceText(combinedText);
      onProgress(50, "AI text enhancement complete");
      
      // 3. Analyze questions with AI (70%)
      onProgress(55, "Analyzing questions with AI...");
      const analysisResult = await analyzeQuestions(enhancedTextResult);
      
      // If the AI analysis was successful, convert to our Question format
      const extractedQuestions: Question[] = [];
      
      if (Array.isArray(analysisResult) && analysisResult.length > 0) {
        // Use AI-analyzed questions
        const currentYear = new Date().getFullYear();
        
        analysisResult.forEach((item, index) => {
          if (item.questionText && item.subject) {
            extractedQuestions.push({
              id: `q-${Date.now()}-${index}`,
              text: item.questionText,
              year: String(currentYear - Math.floor(Math.random() * 5)),
              subject: item.subject,
              topics: Array.isArray(item.topics) ? item.topics : [],
              keywords: Array.isArray(item.keywords) ? item.keywords : [],
            });
          }
        });
      } else {
        // Fall back to the original question extraction method
        const enhancedText: ExtractedText[] = [{ 
          text: enhancedTextResult, 
          pageNumber: 1 
        }];
        
        const fallbackQuestions = await extractQuestionsFromText(enhancedText);
        extractedQuestions.push(...fallbackQuestions);
      }
      
      onProgress(70, "Question analysis complete");
      
      // 4. Find related videos for each question (100%)
      onProgress(75, "Finding related educational videos...");
      const enhancedQuestions = [];
      
      for (let i = 0; i < extractedQuestions.length; i++) {
        const question = extractedQuestions[i];
        const questionWithVideos = await findRelatedVideos(question);
        enhancedQuestions.push(questionWithVideos);
        
        // Update progress incrementally
        const progressIncrement = 25 * ((i + 1) / extractedQuestions.length);
        onProgress(75 + progressIncrement, `Processing question ${i+1} of ${extractedQuestions.length}`);
      }
      
      // 5. Identify common topics across questions
      const topics = extractCommonTopics(enhancedQuestions);
      
      // 6. Save to database
      const result: AnalysisResult = {
        questions: enhancedQuestions,
        topics
      };
      
      await databaseService.saveQuestions(result);
      
      return result;
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Process an image file using OCR to extract questions
   */
  processImageFile: async (
    file: File,
    onProgress: (progress: number, step: string) => void
  ): Promise<AnalysisResult> => {
    try {
      // 1. Perform OCR on image (40%)
      onProgress(10, "Performing OCR on image...");
      const ocrResult = await performOCR(file);
      onProgress(40, "OCR processing complete");
      
      // 2. Enhance extracted text with AI (60%)
      onProgress(45, "Enhancing and correcting OCR text with AI...");
      const enhancedText = await enhanceText(ocrResult.text);
      onProgress(60, "AI text enhancement complete");
      
      // 3. Analyze questions with AI (80%)
      onProgress(65, "Analyzing questions with AI...");
      const analysisResult = await analyzeQuestions(enhancedText);
      
      // If AI analysis was successful, convert to our Question format
      let extractedQuestions: Question[] = [];
      
      if (Array.isArray(analysisResult) && analysisResult.length > 0) {
        // Use AI-analyzed questions
        const currentYear = new Date().getFullYear();
        
        analysisResult.forEach((item, index) => {
          if (item.questionText && item.subject) {
            extractedQuestions.push({
              id: `q-${Date.now()}-${index}`,
              text: item.questionText,
              year: String(currentYear - Math.floor(Math.random() * 5)),
              subject: item.subject,
              topics: Array.isArray(item.topics) ? item.topics : [],
              keywords: Array.isArray(item.keywords) ? item.keywords : [],
            });
          }
        });
      } else {
        // Fall back to the original question extraction method
        const extractedTextForFallback: ExtractedText[] = [{ 
          text: enhancedText, 
          pageNumber: 1 
        }];
        
        extractedQuestions = await extractQuestionsFromText(extractedTextForFallback);
      }
      
      onProgress(80, "Questions identified and analyzed");
      
      // 4. Find related videos for each question (100%)
      onProgress(85, "Finding related educational videos...");
      const enhancedQuestions = [];
      
      for (let i = 0; i < extractedQuestions.length; i++) {
        const question = extractedQuestions[i];
        const questionWithVideos = await findRelatedVideos(question);
        enhancedQuestions.push(questionWithVideos);
        
        // Update progress incrementally
        const progressIncrement = 15 * ((i + 1) / extractedQuestions.length);
        onProgress(85 + progressIncrement, `Processing question ${i+1} of ${extractedQuestions.length}`);
      }
      
      // 5. Identify common topics across questions
      const topics = extractCommonTopics(enhancedQuestions);
      
      // 6. Save to database
      const result: AnalysisResult = {
        questions: enhancedQuestions,
        topics
      };
      
      await databaseService.saveQuestions(result);
      
      return result;
    } catch (error) {
      console.error("Error processing image:", error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Process a PDF file using the OCR approach (convert to images first)
   */
  processPdfWithOCR: async (
    file: File,
    onProgress: (progress: number, step: string) => void
  ): Promise<AnalysisResult> => {
    try {
      // 1. Convert PDF to images and perform OCR (50%)
      onProgress(10, "Converting PDF to images for OCR...");
      const extractedText = await extractTextFromPDFViaOCR(file);
      onProgress(50, "PDF-to-image OCR complete");
      
      // 2. Analyze questions with AI (70%)
      onProgress(55, "Analyzing questions with AI...");
      const analysisResult = await analyzeQuestions(extractedText);
      
      // If the AI analysis was successful, convert to our Question format
      let extractedQuestions: Question[] = [];
      
      if (Array.isArray(analysisResult) && analysisResult.length > 0) {
        // Use AI-analyzed questions
        const currentYear = new Date().getFullYear();
        
        analysisResult.forEach((item, index) => {
          if (item.questionText && item.subject) {
            extractedQuestions.push({
              id: `q-${Date.now()}-${index}`,
              text: item.questionText,
              year: String(currentYear - Math.floor(Math.random() * 5)),
              subject: item.subject,
              topics: Array.isArray(item.topics) ? item.topics : [],
              keywords: Array.isArray(item.keywords) ? item.keywords : [],
            });
          }
        });
      } else {
        // Fall back to the original question extraction method
        const extractedTextForFallback: ExtractedText[] = [{ 
          text: extractedText, 
          pageNumber: 1 
        }];
        
        extractedQuestions = await extractQuestionsFromText(extractedTextForFallback);
      }
      
      onProgress(70, "Question analysis complete");
      
      // 3. Find related videos for each question (100%)
      onProgress(75, "Finding related educational videos...");
      const enhancedQuestions = [];
      
      for (let i = 0; i < extractedQuestions.length; i++) {
        const question = extractedQuestions[i];
        const questionWithVideos = await findRelatedVideos(question);
        enhancedQuestions.push(questionWithVideos);
        
        // Update progress incrementally
        const progressIncrement = 25 * ((i + 1) / extractedQuestions.length);
        onProgress(75 + progressIncrement, `Processing question ${i+1} of ${extractedQuestions.length}`);
      }
      
      // 4. Identify common topics across questions
      const topics = extractCommonTopics(enhancedQuestions);
      
      // 5. Save to database
      const result: AnalysisResult = {
        questions: enhancedQuestions,
        topics
      };
      
      await databaseService.saveQuestions(result);
      
      return result;
    } catch (error) {
      console.error("Error processing PDF with OCR:", error);
      throw new Error(`Failed to process PDF with OCR: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  
  /**
   * Get all questions from the database
   */
  getQuestions: async (): Promise<AnalysisResult> => {
    return await databaseService.getQuestions();
  },
  
  /**
   * Get filtered questions from the database
   */
  getFilteredQuestions: async (
    yearFilter: string,
    subjectFilter: string,
    keywordFilter: string
  ): Promise<AnalysisResult> => {
    return await databaseService.getQuestionsByFilter(
      yearFilter,
      subjectFilter,
      keywordFilter
    );
  }
};

/**
 * Extract common topics across multiple questions
 */
function extractCommonTopics(questions: Question[]): QuestionTopic[] {
  // Initialize topics map
  const topicsMap = new Map<string, { count: number, questions: string[] }>();
  
  // Process topics from each question
  questions.forEach(question => {
    // Process explicit topics if available
    if (question.topics && question.topics.length > 0) {
      question.topics.forEach(topic => {
        if (!topicsMap.has(topic)) {
          topicsMap.set(topic, { count: 0, questions: [] });
        }
        
        const topicData = topicsMap.get(topic)!;
        topicData.count += 1;
        topicData.questions.push(question.id);
      });
    } 
    // Otherwise use keywords
    else if (question.keywords && question.keywords.length > 0) {
      question.keywords.forEach(keyword => {
        if (!topicsMap.has(keyword)) {
          topicsMap.set(keyword, { count: 0, questions: [] });
        }
        
        const topicData = topicsMap.get(keyword)!;
        topicData.count += 1;
        topicData.questions.push(question.id);
      });
    }
  });
  
  // Convert map to array and sort by frequency
  const topicsArray: QuestionTopic[] = Array.from(topicsMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      questions: data.questions
    }))
    .filter(topic => topic.count > 1) // Only include topics that appear in multiple questions
    .sort((a, b) => b.count - a.count) // Sort by count (descending)
    .slice(0, 10); // Limit to top 10 topics
  
  return topicsArray;
}
