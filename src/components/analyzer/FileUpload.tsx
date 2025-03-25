import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileText, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadPdf: (files: File[]) => void;
  onUploadImage: (files: File[]) => void;
  onUploadPdfOcr?: (files: File[]) => void;
  maxFiles?: number;
}

const FileUpload = ({ 
  onUploadPdf, 
  onUploadImage, 
  onUploadPdfOcr, 
  maxFiles = 10 
}: FileUploadProps) => {
  const [isOver, setIsOver] = useState(false);
  
  const onDropPdf = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Check file sizes (10MB limit per file)
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) are too large. Maximum size per file is 10MB.`);
      // Filter out oversized files
      const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
      if (validFiles.length === 0) return;
      
      onUploadPdf(validFiles);
    } else {
      // Log file count to help with debugging
      console.log(`Uploading ${acceptedFiles.length} PDF files:`, acceptedFiles.map(f => f.name));
      onUploadPdf(acceptedFiles);
    }
  }, [onUploadPdf]);

  const onDropImage = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Check file sizes (10MB limit per file)
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) are too large. Maximum size per file is 10MB.`);
      // Filter out oversized files
      const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
      if (validFiles.length === 0) return;
      
      onUploadImage(validFiles);
    } else {
      onUploadImage(acceptedFiles);
    }
  }, [onUploadImage]);

  const onDropPdfOcr = useCallback((acceptedFiles: File[]) => {
    if (!onUploadPdfOcr || acceptedFiles.length === 0) return;
    
    // Check file sizes (10MB limit per file)
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) are too large. Maximum size per file is 10MB.`);
      // Filter out oversized files
      const validFiles = acceptedFiles.filter(file => file.size <= 10 * 1024 * 1024);
      if (validFiles.length === 0) return;
      
      onUploadPdfOcr(validFiles);
    } else {
      onUploadPdfOcr(acceptedFiles);
    }
  }, [onUploadPdfOcr]);

  const { 
    getRootProps: getPdfRootProps, 
    getInputProps: getPdfInputProps, 
    isDragActive: isPdfDragActive 
  } = useDropzone({
    onDrop: onDropPdf,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: maxFiles,
    onDragEnter: () => setIsOver(true),
    onDragLeave: () => setIsOver(false),
    multiple: true,
  });

  const { 
    getRootProps: getImageRootProps, 
    getInputProps: getImageInputProps, 
    isDragActive: isImageDragActive 
  } = useDropzone({
    onDrop: onDropImage,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],
    },
    maxFiles: maxFiles,
    onDragEnter: () => setIsOver(true),
    onDragLeave: () => setIsOver(false),
    multiple: true,
  });

  const { 
    getRootProps: getPdfOcrRootProps, 
    getInputProps: getPdfOcrInputProps, 
    isDragActive: isPdfOcrDragActive 
  } = useDropzone({
    onDrop: onDropPdfOcr,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: maxFiles,
    onDragEnter: () => setIsOver(true),
    onDragLeave: () => setIsOver(false),
    disabled: !onUploadPdfOcr,
    multiple: true,
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="pdf" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pdf">PDF Text Extract</TabsTrigger>
          <TabsTrigger value="pdfocr" disabled={!onUploadPdfOcr}>PDF to Image OCR</TabsTrigger>
          <TabsTrigger value="image">Image OCR</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pdf" className="mt-4">
          <div
            {...getPdfRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isPdfDragActive || isOver
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getPdfInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isPdfDragActive ? 'Drop the PDF files here' : 'Drag & drop your PDF files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files (PDF only, up to {maxFiles} files)
                </p>
              </div>
              <Button type="button" className="mt-4">
                Select PDF Files
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Supported format: PDF (scanned question papers)</p>
            <p>Maximum file size: 10MB per file</p>
            <p className="font-medium mt-1">Note: This method extracts text directly from the PDF</p>
          </div>
        </TabsContent>
        
        <TabsContent value="pdfocr" className="mt-4">
          <div
            {...getPdfOcrRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              !onUploadPdfOcr
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                : isPdfOcrDragActive || isOver
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getPdfOcrInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <Wand2 className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isPdfOcrDragActive 
                    ? 'Drop the PDF files here' 
                    : onUploadPdfOcr 
                    ? 'Drag & drop your PDF files here' 
                    : 'Feature not available in demo'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {onUploadPdfOcr 
                    ? `Convert PDF to images for better OCR results (up to ${maxFiles} files)` 
                    : 'This feature requires a backend Python service'}
                </p>
              </div>
              {onUploadPdfOcr && (
                <Button type="button" className="mt-4">
                  Select PDF Files for OCR
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Supported format: PDF (scanned question papers)</p>
            <p>Maximum file size: 10MB per file</p>
            <p className="font-medium mt-1">
              Note: This method converts PDF to images before OCR for better results with scanned documents
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="mt-4">
          <div
            {...getImageRootProps()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              isImageDragActive || isOver
                ? 'border-primary bg-primary/5' 
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getImageInputProps()} />
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <FileImage className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isImageDragActive ? 'Drop the image files here' : 'Drag & drop your image files here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse files (JPG, PNG, TIFF, up to {maxFiles} files)
                </p>
              </div>
              <Button type="button" className="mt-4">
                Select Image Files
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Supported formats: JPG, PNG, TIFF (scanned question papers)</p>
            <p>Maximum file size: 10MB per file</p>
            <p className="font-medium mt-1">Note: OCR works best with clear, high-contrast images</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FileUpload;

