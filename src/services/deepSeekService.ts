import { toast } from 'sonner';

interface DeepSeekOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface VideoSearchResult {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

/**
 * Process text using the DeepSeek V3 API
 * @param text The text to process
 * @param prompt The system prompt for DeepSeek
 * @param options Configuration options for the API
 * @returns Enhanced and processed text
 */
export async function processWithDeepSeek(
  text: string, 
  prompt: string,
  options: DeepSeekOptions = {}
): Promise<string> {
  try {
    // Get the API key from localStorage
    const deepseekApiKey = localStorage.getItem('deepseekApiKey');
    
    if (!deepseekApiKey) {
      console.log("No DeepSeek API key found");
      throw new Error("DeepSeek API key is required");
    }

    console.log("Making request to proxy server with API key:", deepseekApiKey.substring(0, 5) + "...");

    // Define default options
    const defaultOptions = {
      model: "deepseek-chat",
      temperature: 0.2,
      max_tokens: 4000,
      ...options
    };

    const requestBody = {
        model: defaultOptions.model,
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: defaultOptions.temperature,
        max_tokens: defaultOptions.max_tokens
    };

    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Make request to our proxy server instead of DeepSeek API directly
    const response = await fetch("http://localhost:3001/api/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-DeepSeek-API-Key": deepseekApiKey
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Proxy server response status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error("DeepSeek API error response:", errorData);
      
      // Check if it's an API key issue
      if (response.status === 401 || response.status === 403) {
        toast.error("Invalid DeepSeek API key. Please check your settings.");
      }
      
      throw new Error(`DeepSeek API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Log the response for debugging
    console.log("DeepSeek API response data:", JSON.stringify(data, null, 2));

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid API response structure:", data);
      
      // If we got an error message from the API, show it
      if (data.error || data.error_msg) {
        toast.error(`DeepSeek API error: ${data.error || data.error_msg}`);
      } else {
        toast.error("Unexpected API response format");
      }
      
      throw new Error("Invalid API response structure");
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API error:", error);
    toast.error("AI text processing failed");
    throw error;
  }
}

/**
 * Enhance and correct text using DeepSeek
 * @param text The text to enhance
 * @returns Enhanced text with grammar corrections and formatting
 */
export async function enhanceText(text: string): Promise<string> {
  toast.info("Enhancing extracted text with AI...");
  
  const prompt = `
    You are an expert at enhancing and correcting text extracted from academic question papers. 
    Your tasks:
    
    1. Fix grammar, spelling, and OCR errors
    2. Properly format questions with correct numbering
    3. Ensure each question starts on a new line with proper indentation
    4. Maintain the original structure of the document
    5. Preserve question numbers and section headings
    6. Fix any broken sentences or paragraphs
    7. Ensure math equations are properly formatted (use LaTeX-style formatting for equations)
    8. Add line breaks between questions for clarity
    9. Make sure each question is clearly separated for easy readability
    10. IMPORTANT: Remove any document headers, footers, or page numbers that aren't part of questions
    
    Format the text to look exactly like a professional academic question paper.
    Return only the enhanced text without any explanations or comments.
  `;
  
  try {
    const enhancedText = await processWithDeepSeek(text, prompt);
    toast.success("Text enhancement complete");
    return enhancedText;
  } catch (error) {
    console.error("Text enhancement error:", error);
    toast.error("Text enhancement failed");
    // Return original text if enhancement fails
    return text;
  }
}

/**
 * Identify and analyze questions in a text
 * @param text The text containing questions
 * @returns Structured analysis of identified questions
 */
export async function analyzeQuestions(text: string): Promise<any> {
  toast.info("Analyzing questions with AI...");
  
  const prompt = `
    You are an expert at analyzing academic question papers across all subjects. Your task is to:
    
    1. First, identify the exam year from the question paper header/metadata
    
    2. Identify the main subject area and sub-disciplines. Common subjects include:
       - Sciences (Physics, Chemistry, Biology, etc.)
       - Mathematics (Algebra, Calculus, Statistics, etc.)
       - Computer Science & Engineering
       - Social Sciences & Humanities
       - Languages & Literature
       - Business & Economics
       - And other academic fields
    
    3. For each question:
       - Extract the complete question text with its numbering
       - Identify the specific subject and sub-discipline
       - Extract the main concepts being tested (NOT action words)
       - Identify key technical terms and concepts
    
    4. Group and classify topics by:
       - Core concepts of the subject
       - Sub-topics within the discipline
       - Technical terms and theories
       - Methods and applications
    
    IMPORTANT:
    - Extract the year from the question paper (look for year patterns like 2021, 2022-23, etc.)
    - NEVER include action words (explain, describe, write, etc.) as topics
    - Group related concepts under consistent names
    - Use subject-appropriate terminology
    - Focus on actual concepts being tested, not question words
    
    Return ONLY a valid JSON array where each item follows this EXACT format:
    {
      "questionText": "The complete question text with number",
      "subject": "The main subject area",
      "subSubject": "The specific branch or sub-discipline",
      "topics": ["2-3 main concepts being tested"],
      "keywords": ["3-5 key technical terms"],
      "year": "The extracted year from the question paper"
    }
  `;
  
  try {
    const analysisText = await processWithDeepSeek(text, prompt, {
      temperature: 0.1 // Lower temperature for more consistent results
    });
    
    // Remove code block markers if present
    const cleanedAnalysisText = analysisText.replace(/```json|```/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(cleanedAnalysisText);
      if (!Array.isArray(analysis)) {
        throw new Error("Response is not an array");
      }
      
      // Extract year from the question paper text
      const extractedYear = extractYearFromText(text);
      
      // Filter out any non-question entries and standardize the data
      analysis = analysis.filter(item => {
        return (
          item.questionText && 
          item.questionText.length > 20 &&
          !item.questionText.toLowerCase().includes("reg.no") &&
          !item.questionText.toLowerCase().includes("technology") &&
          /\d/.test(item.questionText)
        );
      }).map(item => {
        // Ensure consistent data structure
        const standardizedItem = {
          ...item,
          year: extractedYear || item.year || "Unknown", // Use extracted year or fallback
          subject: item.subject || "General",
          subSubject: item.subSubject || "General",
          topics: standardizeTopics(item.topics || []),
          keywords: (item.keywords || []).filter(k => typeof k === 'string')
        };
        return standardizedItem;
      });
      
      toast.success("Question analysis complete");
      return analysis;
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError, "Raw text:", cleanedAnalysisText);
      toast.error("Failed to parse question analysis");
      throw jsonError;
    }
  } catch (error) {
    console.error("Question analysis error:", error);
    toast.error("Question analysis failed");
    throw error;
  }
}

// Helper function to extract year from text
function extractYearFromText(text: string): string | null {
  // Common year patterns
  const yearPatterns = [
    /\b20\d{2}\b/, // Regular year like 2021
    /\b20\d{2}-\d{2,4}\b/, // Year range like 2021-22 or 2021-2022
    /\b20\d{2}\/\d{2,4}\b/, // Year range with slash like 2021/22
    /\b20\d{2}\s*\(\s*\d{2,4}\s*\)/, // Year with bracket like 2021(22)
    /\b20\d{2}\s*batch\b/i, // Year with batch like 2021 Batch
    /\b20\d{2}\s*scheme\b/i // Year with scheme like 2021 Scheme
  ];

  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Clean up the matched year
      const year = match[0].replace(/[^0-9\-\/]/g, '');
      return year;
    }
  }

  return null;
}

// Helper function to standardize topics
function standardizeTopics(topics: string[]): string[] {
  // Remove action verbs and common words
  const actionVerbs = ['explain', 'describe', 'write', 'list', 'illustrate', 'outline', 'discuss', 'define', 'analyze', 'compare'];
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  
  const cleanedTopics = topics.filter(topic => {
    const lowerTopic = topic.toLowerCase();
    return !actionVerbs.some(verb => lowerTopic.startsWith(verb)) &&
           !commonWords.some(word => word === lowerTopic);
  });

  // Remove duplicates and standardize
  return Array.from(new Set(cleanedTopics)).map(topic => {
    // Capitalize first letter of each word
    return topic.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });
}

/**
 * Get relevant YouTube videos for a question
 * @param question The analyzed question data
 * @returns Array of relevant video information
 */
export async function getRelevantVideos(question: {
  subject: string;
  subSubject: string;
  topics: string[];
  keywords: string[];
}): Promise<VideoSearchResult[]> {
  try {
    // Get YouTube API key from localStorage
    const youtubeApiKey = localStorage.getItem('youtubeApiKey');
    if (!youtubeApiKey) {
      toast.error("YouTube API key is required for video recommendations");
      throw new Error("YouTube API key is required");
    }

    // Construct search query
    const searchTerms = [
      question.subject,
      question.subSubject,
      ...question.topics,
      ...question.keywords
    ].filter(Boolean);

    // Add educational terms to improve results
    const educationalTerms = ['lecture', 'tutorial', 'explanation'];
    const searchQuery = [...searchTerms, ...educationalTerms].join(' ');

    console.log("Searching YouTube videos for:", searchQuery);

    // Make request to YouTube Data API
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchQuery)}&type=video&relevanceLanguage=en&videoDuration=medium&key=${youtubeApiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error:", errorData);
      toast.error("Failed to fetch relevant videos");
      throw new Error(`YouTube API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Transform YouTube API response into our format
    const videos: VideoSearchResult[] = data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url
    }));

    console.log("Found relevant videos:", videos);
    return videos;
  } catch (error) {
    console.error("Error fetching videos:", error);
    toast.error("Failed to fetch relevant videos");
    throw error;
  }
}

/**
 * Analyze questions and fetch relevant videos
 * @param text The text containing questions
 * @returns Analyzed questions with relevant videos
 */
export async function analyzeQuestionsWithVideos(text: string): Promise<any> {
  // First analyze the questions
  const analysis = await analyzeQuestions(text);
  
  // Then fetch relevant videos for each question
  const analysisWithVideos = await Promise.all(
    analysis.map(async (question) => {
      try {
        const videos = await getRelevantVideos(question);
        return {
          ...question,
          relatedVideos: videos
        };
      } catch (error) {
        console.error("Error getting videos for question:", error);
        return {
          ...question,
          relatedVideos: []
        };
      }
    })
  );

  return analysisWithVideos;
}
