
import * as pdfjs from 'pdfjs-dist';
import { Question } from '@/pages/analyzer/types';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export interface ExtractedText {
  text: string;
  pageNumber: number;
}

export async function extractTextFromPDF(file: File): Promise<ExtractedText[]> {
  // Read the file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  
  const numPages = pdf.numPages;
  const extractedPages: ExtractedText[] = [];
  
  // Process each page
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Combine text items into a single string
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    extractedPages.push({
      text,
      pageNumber: i
    });
  }
  
  return extractedPages;
}

export async function extractQuestionsFromText(extractedPages: ExtractedText[]): Promise<Question[]> {
  const questions: Question[] = [];
  const subjects = ["Programming", "Operating Systems", "Database", "Networking", "Computer Science"];
  const currentYear = new Date().getFullYear();
  
  // Process each page to identify questions
  for (const page of extractedPages) {
    const text = page.text;
    
    // Split text into potential questions (using common patterns)
    // This is a basic implementation - a more sophisticated NLP approach would be better
    const questionPatterns = [
      /(\d+\.\s.+?\?)/g,  // Questions with numbers followed by period and ending with question mark
      /(\d+\.\s.+?\.(\s|$))/g,  // Questions with numbers followed by period and ending with period
      /(Question\s\d+.+?\?)/gi,  // Questions starting with "Question X" and ending with question mark
      /(Explain.+?\?)/gi,  // Questions starting with "Explain" and ending with question mark
      /(Describe.+?\?)/gi,  // Questions starting with "Describe" and ending with question mark
      /(Define.+?\?)/gi,  // Questions starting with "Define" and ending with question mark
    ];
    
    for (const pattern of questionPatterns) {
      const matches = text.match(pattern);
      
      if (matches) {
        for (const match of matches) {
          // Clean up the question text
          const cleanedText = match.trim()
            .replace(/^\d+\.\s/, '')  // Remove question numbers
            .replace(/\s+/g, ' ');    // Replace multiple spaces with single space
          
          // Skip if question is too short (likely not a real question)
          if (cleanedText.length < 15) continue;
          
          // Generate some keywords from the question
          const keywords = extractKeywords(cleanedText);
          
          // Determine subject based on keywords
          const subject = determineSubject(cleanedText, keywords, subjects);
          
          // Assign a random year from the last 5 years
          const yearOffset = Math.floor(Math.random() * 5);
          const year = String(currentYear - yearOffset);
          
          questions.push({
            id: `q-${Date.now()}-${questions.length}`,
            text: cleanedText,
            year,
            subject,
            keywords,
          });
        }
      }
    }
  }
  
  return questions;
}

function extractKeywords(text: string): string[] {
  // Remove common stop words
  const stopWords = ['and', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of'];
  
  // Split text into words and clean them
  const words = text.toLowerCase()
    .replace(/[.,?!;:()"']/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Count word frequencies
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // Sort by frequency and get top keywords
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Return top 5 keywords or less if there aren't enough
  return sortedWords.slice(0, 5);
}

function determineSubject(text: string, keywords: string[], subjects: string[]): string {
  const lowercaseText = text.toLowerCase();
  
  // Simple subject detection based on keywords
  const subjectKeywords: Record<string, string[]> = {
    'Programming': ['programming', 'code', 'algorithm', 'function', 'class', 'object', 'variable', 'loop', 'inheritance', 'polymorphism'],
    'Operating Systems': ['operating', 'system', 'memory', 'process', 'thread', 'scheduling', 'deadlock', 'filesystem', 'kernel', 'paging'],
    'Database': ['database', 'sql', 'query', 'table', 'join', 'index', 'transaction', 'normalization', 'schema', 'entity'],
    'Networking': ['network', 'protocol', 'tcp', 'ip', 'router', 'switch', 'packet', 'http', 'dns', 'firewall'],
    'Computer Science': ['complexity', 'data structure', 'graph', 'tree', 'sorting', 'searching', 'computation', 'theory', 'logic', 'analysis']
  };
  
  // Count matches for each subject
  const subjectScores: Record<string, number> = {};
  
  for (const subject of subjects) {
    subjectScores[subject] = 0;
    
    // Check if subject keywords appear in the text
    for (const keyword of subjectKeywords[subject] || []) {
      if (lowercaseText.includes(keyword)) {
        subjectScores[subject] += 1;
      }
    }
  }
  
  // Find subject with highest score
  let maxScore = 0;
  let bestSubject = subjects[0];
  
  for (const [subject, score] of Object.entries(subjectScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestSubject = subject;
    }
  }
  
  // If no clear subject, use Computer Science as default
  return maxScore > 0 ? bestSubject : 'Computer Science';
}

export async function fetchRelatedVideos(question: Question): Promise<Question> {
  // In a real implementation, this would call a YouTube API
  // For now, we'll generate mock video data
  const mockVideoIds = [
    '2quKyPnUShQ', 'pTB0EiLXUC8', 'rfscVS0vtbw', 
    'yE9v9rt6ziw', 'yQSfXb8nhB4', '8mAITcNt710'
  ];
  
  const randomVideoCount = Math.floor(Math.random() * 2) + 1; // 1-2 videos
  const relatedVideos = [];
  
  const usedTitles = new Set();
  const keyword = question.keywords[0] || question.subject;
  
  for (let i = 0; i < randomVideoCount; i++) {
    const randomIndex = Math.floor(Math.random() * mockVideoIds.length);
    const videoId = mockVideoIds[randomIndex];
    
    // Generate a title based on the question
    let title;
    do {
      title = generateVideoTitle(question.subject, keyword);
    } while (usedTitles.has(title));
    
    usedTitles.add(title);
    
    relatedVideos.push({
      id: videoId,
      title,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  
  return {
    ...question,
    relatedVideos
  };
}

function generateVideoTitle(subject: string, keyword: string): string {
  const titleTemplates = [
    `${keyword} explained - ${subject} fundamentals`,
    `Understanding ${keyword} in ${subject}`,
    `${subject} tutorial: mastering ${keyword}`,
    `Learn ${keyword} concepts easily`,
    `${keyword} deep dive for ${subject} students`,
    `${subject} basics: ${keyword} explained simply`
  ];
  
  const randomIndex = Math.floor(Math.random() * titleTemplates.length);
  return titleTemplates[randomIndex];
}
