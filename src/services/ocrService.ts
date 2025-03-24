
import { createWorker, PSM } from 'tesseract.js';
import { toast } from 'sonner';
import { enhanceText } from './deepSeekService';

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Performs OCR on an image using Tesseract.js
 */
export async function performOCR(imageFile: File): Promise<OCRResult> {
  try {
    toast.info("Starting OCR processing...");
    
    // Create worker with improved settings
    const worker = await createWorker('eng', 1, {
      logger: m => console.log(m),
      errorHandler: err => console.error(err)
    });
    
    // Set parameters for better OCR quality
    await worker.setParameters({
      tessedit_ocr_engine_mode: '1', // Use LSTM only (as string)
      tessedit_pageseg_mode: PSM.AUTO, // Use PSM enum for page segmentation mode
      preserve_interword_spaces: '1' // Preserve space between words (as string)
    });
    
    // Convert file to data URL
    const imageDataUrl = await fileToDataURL(imageFile);
    
    // Recognize text in image
    const result = await worker.recognize(imageDataUrl);
    
    // Terminate worker to free resources
    await worker.terminate();
    
    toast.success("OCR processing complete");
    
    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('OCR error:', error);
    toast.error("OCR processing failed");
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert PDF to image and then extract text
 * This is a simulated function since actual PDF-to-image conversion
 * would require a backend service with Python
 */
export async function extractTextFromPDFViaOCR(pdfFile: File): Promise<string> {
  try {
    toast.info("Converting PDF to images for OCR...");
    
    // In a real implementation, this would call a backend API that uses Python
    // to convert PDF pages to images and then perform OCR
    
    // For demo purposes, we'll simulate the process
    toast.info("Using simulated PDF-to-image conversion. In production, this would use a Python backend service.");
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Use the existing PDF extraction method and enhance the result
    const pdfText = await simulatePdfToImageOCR(pdfFile);
    
    toast.success("PDF image extraction complete");
    
    return pdfText;
  } catch (error) {
    console.error('PDF to image OCR error:', error);
    toast.error("PDF to image conversion failed");
    throw new Error(`PDF to image OCR failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to convert File to data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Simulate PDF to image OCR
// In a real implementation, this would be replaced with a call to a Python backend
async function simulatePdfToImageOCR(pdfFile: File): Promise<string> {
  // Wait to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // For demo purposes, we'll use the existing PDF text extraction
  // Import dynamically to avoid circular dependencies
  const { extractTextFromPDF } = await import('./pdfService');
  
  // Extract text using the existing method
  const extractedPages = await extractTextFromPDF(pdfFile);
  
  // Combine the text from all pages
  const combinedText = extractedPages.map(page => page.text).join('\n\n');
  
  // Enhance the text using AI with better formatting prompt
  const enhancedText = await enhanceText(combinedText);
  
  return enhancedText;
}
