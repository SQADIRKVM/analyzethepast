import { Question } from '@/pages/analyzer/types';
import { toast } from 'sonner';

// Cache to store YouTube search results
const searchCache: Record<string, any[]> = {};

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

interface ExamContext {
  type: string;        // e.g., 'university', 'entrance', 'school', 'competitive', 'general'
  source: string;      // e.g., 'KTU', 'JEE', 'CBSE', 'NEET', etc.
  year?: string;       // e.g., '2023'
  subject?: string;    // The main subject
  level?: string;      // e.g., 'undergraduate', 'school', 'competitive'
  details?: {          // Optional additional details based on paper type
    course?: string;   // e.g., 'B.Tech', '12th Standard'
    semester?: string; // e.g., 'S4', 'Semester 4'
    branch?: string;   // e.g., 'CSE', 'Science'
    stream?: string;   // e.g., 'Science', 'Commerce', 'Arts'
  }
}

// Patterns to detect different types of question papers
const EXAM_PATTERNS = {
  university: {
    patterns: ['university', 'college', 'semester', 'degree'],
    sources: {
      'KTU': ['ktu', 'kerala technological', 'apj abdul kalam'],
      'CUSAT': ['cusat', 'cochin university'],
      'MG': ['mg university', 'mahatma gandhi']
    },
    level: 'undergraduate'
  },
  entrance: {
    patterns: ['entrance', 'admission test', 'competitive exam', 'selection test'],
    sources: {
      'JEE': ['jee', 'joint entrance', 'iit-jee'],
      'NEET': ['neet', 'medical entrance'],
      'GATE': ['gate', 'graduate aptitude']
    },
    level: 'competitive'
  },
  school: {
    patterns: ['school', 'class', 'grade', 'std', 'standard', 'board exam'],
    sources: {
      'CBSE': ['cbse', 'central board'],
      'ICSE': ['icse', 'indian certificate'],
      'State': ['state board', 'state syllabus']
    },
    level: 'school'
  },
  competitive: {
    patterns: ['competitive', 'recruitment', 'exam', 'test series'],
    sources: {
      'PSC': ['psc', 'public service'],
      'UPSC': ['upsc', 'civil service'],
      'SSC': ['ssc', 'staff selection']
    },
    level: 'competitive'
  }
};

// Common patterns to detect in question papers
const PAPER_PATTERNS = {
  course: {
    'B.Tech': ['b.tech', 'bachelor of technology', 'btech'],
    'M.Tech': ['m.tech', 'master of technology', 'mtech'],
    'BCA': ['bca', 'bachelor of computer applications'],
    'MCA': ['mca', 'master of computer applications']
  },
  semester: {
    patterns: ['semester', 'sem'],
    regex: /\b(s[1-8]|semester\s*[1-8]|sem\s*[1-8])\b/i
  },
  branch: {
    'CSE': ['computer science', 'cs', 'cse'],
    'ECE': ['electronics', 'ec', 'ece'],
    'EEE': ['electrical', 'ee', 'eee'],
    'ME': ['mechanical', 'me', 'mech']
  }
};

let detectedContext: ExamContext | null = null;

// Subject patterns for different levels
const SUBJECT_PATTERNS = {
  // Computer Science subjects
  computerScience: [
    'system software', 'operating system', 'data structures', 'computer networks',
    'database', 'artificial intelligence', 'programming', 'algorithms'
  ],
  // Science subjects
  science: [
    'physics', 'chemistry', 'biology', 'mathematics', 'botany', 'zoology',
    'environmental science'
  ],
  // Engineering subjects
  engineering: [
    'digital electronics', 'microprocessors', 'computer architecture',
    'electrical', 'mechanical', 'civil', 'electronics'
  ],
  // Commerce and Management subjects
  commerce: [
    'accountancy', 'business studies', 'economics', 'finance',
    'marketing', 'management'
  ],
  // Humanities subjects
  humanities: [
    'history', 'geography', 'political science', 'sociology',
    'psychology', 'philosophy', 'literature'
  ]
};

/**
 * Extract exam context from the question paper
 */
export function detectExamContext(paperText: string): ExamContext | null {
  // If already detected, return cached result
  if (detectedContext) {
    return detectedContext;
  }

  const lowerText = paperText.toLowerCase();
  const context: ExamContext = { 
    type: 'general',
    source: 'general',
    details: {}
  };

  // First, try to detect the type of paper and its source
  for (const [type, typeData] of Object.entries(EXAM_PATTERNS)) {
    if (typeData.patterns.some(pattern => lowerText.includes(pattern))) {
      context.type = type;
      context.level = typeData.level;
      
      // Try to detect the specific source
      for (const [source, sourcePatterns] of Object.entries(typeData.sources)) {
        if (sourcePatterns.some(pattern => lowerText.includes(pattern))) {
          context.source = source;
          break;
        }
      }
      break;
    }
  }

  // Detect subject by checking all subject patterns
  for (const [category, subjects] of Object.entries(SUBJECT_PATTERNS)) {
    for (const subject of subjects) {
      if (lowerText.includes(subject)) {
        context.subject = subject.charAt(0).toUpperCase() + subject.slice(1);
        break;
      }
    }
    if (context.subject) break;
  }

  // Extract additional details based on the detected type
  if (context.type === 'university') {
    // Look for course, semester, branch
    for (const [course, patterns] of Object.entries(PAPER_PATTERNS.course)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        context.details.course = course;
        break;
      }
    }
    
    const semMatch = lowerText.match(/\b(s[1-8]|semester\s*[1-8]|sem\s*[1-8])\b/i);
    if (semMatch) {
      context.details.semester = semMatch[0].toUpperCase();
    }
  } else if (context.type === 'school') {
    // Look for class/grade level
    const classMatch = lowerText.match(/\b(class|grade|std\.?)\s*([1-9]|1[0-2])(th|st|nd|rd)?\b/i);
    if (classMatch) {
      context.details.course = `Class ${classMatch[2]}`;
    }
    
    // Look for stream
    const streams = ['science', 'commerce', 'arts', 'humanities'];
    for (const stream of streams) {
      if (lowerText.includes(stream)) {
        context.details.stream = stream.charAt(0).toUpperCase() + stream.slice(1);
        break;
      }
    }
  }

  console.log('Detected exam context:', context);
  detectedContext = context;
  return context;
}

/**
 * Search for videos on YouTube related to a question
 * Uses the YouTube Data API v3
 */
export async function searchYouTubeVideos(
  query: string,
  topics: string[] = [],
  keywords: string[] = [],
  maxResults: number = 3
): Promise<YouTubeVideo[]> {
  try {
    const context = detectedContext || { type: 'general', source: 'general' };
    
    // Build search query based on detected context and content
    const searchParts = [
      // Primary topic and keywords (most important)
      ...topics.slice(0, 2),
      ...keywords.slice(0, 2),
      
      // Subject (if available)
      context.subject,
      
      // Level-specific terms
      context.level === 'undergraduate' ? 'college' : '',
      context.level === 'school' ? 'school' : '',
      context.level === 'competitive' ? 'exam' : '',
      
      // Original query
      query,
      
      // Educational content markers
      'explanation',
      'tutorial'
    ].filter(Boolean);

    const contextQuery = searchParts.join(' ');
    
    // Check cache
    const cacheKey = `${contextQuery}_${maxResults}`;
    if (searchCache[cacheKey]) {
      return searchCache[cacheKey];
    }
    
    console.log('Searching YouTube for:', contextQuery);
    const videos = await fetchFromYouTubeAPI(contextQuery, maxResults);
    searchCache[cacheKey] = videos;
    return videos;
  } catch (error) {
    console.error('YouTube search error:', error);
    toast.error("Failed to fetch related videos");
    return [];
  }
}

/**
 * Find related videos for a question
 */
export async function findRelatedVideos(question: Question): Promise<Question> {
  try {
    // Extract topics and keywords from the question
    const topics = question.topics || [];
    const keywords = question.keywords || [];
    const subject = question.subject || '';

    // Search for videos with topics and keywords
    const videos = await searchYouTubeVideos(subject, topics, keywords);
    
    // Add videos to question
    return {
      ...question,
      relatedVideos: videos
    };
  } catch (error) {
    console.error('Error finding related videos:', error);
    return question;
  }
}

// Fetch from YouTube API
async function fetchFromYouTubeAPI(query: string, maxResults: number): Promise<YouTubeVideo[]> {
  const youtubeApiKey = localStorage.getItem('youtubeApiKey');
  
  if (!youtubeApiKey) {
    toast.error("YouTube API key is required for video recommendations");
    throw new Error("YouTube API key is required");
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&maxResults=${maxResults}&type=video&relevanceLanguage=en&videoDuration=medium&key=${youtubeApiKey}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter results to prefer topic-specific content
    const items = data.items.filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();
      
      // Check if video title/description contains any of the topics or keywords
      const hasTopicMatch = query.toLowerCase().split(' ').some(term => 
        title.includes(term) || description.includes(term)
      );

      // Check for educational content markers
      const isEducational = 
        title.includes('lecture') ||
        title.includes('tutorial') ||
        title.includes('explanation') ||
        title.includes('concept') ||
        description.includes('lecture') ||
        description.includes('tutorial') ||
        description.includes('learn') ||
        description.includes('course');

      // Prioritize videos that match both topic and are educational
      return hasTopicMatch && isEducational;
    });
    
    // Sort results by relevance (matching topics in title gets higher priority)
    const sortedItems = items.sort((a, b) => {
      const titleA = a.snippet.title.toLowerCase();
      const titleB = b.snippet.title.toLowerCase();
      const queryTerms = query.toLowerCase().split(' ');
      
      // Count how many query terms appear in each title
      const matchesA = queryTerms.filter(term => titleA.includes(term)).length;
      const matchesB = queryTerms.filter(term => titleB.includes(term)).length;
      
      return matchesB - matchesA;
    });
    
    // Map API response to our video interface
    return sortedItems.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error('Error fetching from YouTube API:', error);
    throw error;
  }
}
