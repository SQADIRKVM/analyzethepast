import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";
import UploadSection from "./components/UploadSection";
import ResultsSection from "./components/ResultsSection";
import { Question, ProcessStatus, AnalysisResult, QuestionTopic } from "./types";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle } from "lucide-react";
import { databaseService } from "@/services/databaseService";

const AnalyzerPage = () => {
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<QuestionTopic[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [filters, setFilters] = useState({
    year: "all_years",
    subject: "all_subjects",
    keyword: "",
  });

  useEffect(() => {
    const loadSavedQuestions = async () => {
      try {
        const savedResult = await apiService.getQuestions();
        if (savedResult.questions.length > 0) {
          setQuestions(savedResult.questions);
          setTopics(savedResult.topics);
          if (status === "idle") {
            setStatus("completed");
            toast.info(`Loaded ${savedResult.questions.length} questions from your previous session`);
          }
        }
      } catch (error) {
        console.error("Error loading saved questions:", error);
      }
    };

    loadSavedQuestions();
  }, [status]);

  const resetForNewUpload = () => {
    setStatus("idle");
    setProgress(0);
    setCurrentStep("");
    setErrorMessage("");
    setQuestions([]);
    setTopics([]);
    setFilters({
      year: "all_years",
      subject: "all_subjects",
      keyword: "",
    });
    
    databaseService.clearQuestions();
    
    toast.info("Ready for new document upload");
  };

  const handlePdfUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep(`Preparing to process ${files.length} PDF file(s)`);
      
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      setTimeout(() => {
        clearInterval(uploadInterval);
        setStatus("processing");
        setProgress(0);
        processPdfFiles(files);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading files:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the files. Please try again.");
      toast.error("Failed to upload the files");
    }
  };

  const handlePdfOcrUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep(`Preparing to process ${files.length} PDF file(s) with OCR`);
      
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      setTimeout(() => {
        clearInterval(uploadInterval);
        setStatus("processing");
        setProgress(0);
        processPdfFilesWithOcr(files);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading files for OCR:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the files. Please try again.");
      toast.error("Failed to upload the files");
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep(`Preparing to process ${files.length} image file(s)`);
      
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      setTimeout(() => {
        clearInterval(uploadInterval);
        setStatus("processing");
        setProgress(0);
        processImageFiles(files);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading images:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the images. Please try again.");
      toast.error("Failed to upload the images");
    }
  };

  const processPdfFiles = async (files: File[]) => {
    try {
      let allQuestions: Question[] = [];
      let allTopics: QuestionTopic[] = [];
      let totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing PDF ${i+1} of ${totalFiles}: ${file.name}`);
        
        const fileStartProgress = (i / totalFiles) * 100;
        const fileEndProgress = ((i + 1) / totalFiles) * 100;
        
        const result = await apiService.processPdfFile(
          file,
          (fileProgress, step) => {
            const scaledProgress = fileStartProgress + (fileProgress * (fileEndProgress - fileStartProgress) / 100);
            setProgress(Math.floor(scaledProgress));
            setCurrentStep(`PDF ${i+1} of ${totalFiles} (${file.name}): ${step}`);
          }
        );
        
        allQuestions = [...allQuestions, ...result.questions];
        
        toast.success(`Processed ${i+1} of ${totalFiles} files`);
      }
      
      const combinedResult = await apiService.combineResults(allQuestions);
      
      setProgress(100);
      setStatus("completed");
      setQuestions(combinedResult.questions);
      setTopics(combinedResult.topics);
      
      toast.success(`Successfully extracted ${combinedResult.questions.length} questions from ${totalFiles} files!`);
      
    } catch (error) {
      console.error("Error processing files:", error);
      setStatus("error");
      setErrorMessage("Failed to process one or more files. Please try again.");
      toast.error("Failed to process the files");
    }
  };

  const processPdfFilesWithOcr = async (files: File[]) => {
    try {
      let allQuestions: Question[] = [];
      let totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing PDF with OCR ${i+1} of ${totalFiles}: ${file.name}`);
        
        const fileStartProgress = (i / totalFiles) * 100;
        const fileEndProgress = ((i + 1) / totalFiles) * 100;
        
        const result = await apiService.processPdfWithOCR(
          file,
          (fileProgress, step) => {
            const scaledProgress = fileStartProgress + (fileProgress * (fileEndProgress - fileStartProgress) / 100);
            setProgress(Math.floor(scaledProgress));
            setCurrentStep(`PDF with OCR ${i+1} of ${totalFiles} (${file.name}): ${step}`);
          }
        );
        
        allQuestions = [...allQuestions, ...result.questions];
        
        toast.success(`Processed ${i+1} of ${totalFiles} files with OCR`);
      }
      
      const combinedResult = await apiService.combineResults(allQuestions);
      
      setProgress(100);
      setStatus("completed");
      setQuestions(combinedResult.questions);
      setTopics(combinedResult.topics);
      
      toast.success(`Successfully extracted ${combinedResult.questions.length} questions from ${totalFiles} files with OCR!`);
      
    } catch (error) {
      console.error("Error processing files with OCR:", error);
      setStatus("error");
      setErrorMessage("Failed to process one or more files with OCR. Please try again.");
      toast.error("Failed to process the files with OCR");
    }
  };

  const processImageFiles = async (files: File[]) => {
    try {
      let allQuestions: Question[] = [];
      let totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentStep(`Processing image ${i+1} of ${totalFiles}: ${file.name}`);
        
        const fileStartProgress = (i / totalFiles) * 100;
        const fileEndProgress = ((i + 1) / totalFiles) * 100;
        
        const result = await apiService.processImageFile(
          file,
          (fileProgress, step) => {
            const scaledProgress = fileStartProgress + (fileProgress * (fileEndProgress - fileStartProgress) / 100);
            setProgress(Math.floor(scaledProgress));
            setCurrentStep(`Image ${i+1} of ${totalFiles} (${file.name}): ${step}`);
          }
        );
        
        allQuestions = [...allQuestions, ...result.questions];
        
        toast.success(`Processed ${i+1} of ${totalFiles} image files`);
      }
      
      const combinedResult = await apiService.combineResults(allQuestions);
      
      setProgress(100);
      setStatus("completed");
      setQuestions(combinedResult.questions);
      setTopics(combinedResult.topics);
      
      toast.success(`Successfully extracted ${combinedResult.questions.length} questions from ${totalFiles} image files!`);
      
    } catch (error) {
      console.error("Error processing images:", error);
      setStatus("error");
      setErrorMessage("Failed to process one or more images. Please try again.");
      toast.error("Failed to process the images");
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const applyFilters = async () => {
      if (status !== "completed") return;
      
      try {
        const filteredResults = await apiService.getFilteredQuestions(
          filters.year,
          filters.subject,
          filters.keyword
        );
        
        setQuestions(filteredResults.questions);
        setTopics(filteredResults.topics);
      } catch (error) {
        console.error("Error applying filters:", error);
        toast.error("Failed to apply filters");
      }
    };

    applyFilters();
  }, [filters, status]);

  const getUniqueYears = () => {
    const years = new Set<string>();
    questions.forEach(q => years.add(q.year));
    return Array.from(years).sort().reverse();
  };

  const getUniqueSubjects = () => {
    const subjects = new Set<string>();
    questions.forEach(q => subjects.add(q.subject));
    return Array.from(subjects).sort();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Question Paper Analyzer
      </h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload & Process</TabsTrigger>
          <TabsTrigger value="results" disabled={questions.length === 0}>
            View Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {status === "completed" && (
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={resetForNewUpload} 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Upload New Document
                  </Button>
                </div>
              )}
              
              <UploadSection 
                status={status}
                progress={progress}
                errorMessage={errorMessage}
                currentStep={currentStep}
                questionCount={status === "completed" ? questions.length : undefined}
                onUploadPdf={handlePdfUpload}
                onUploadImage={handleImageUpload}
                onUploadPdfOcr={handlePdfOcrUpload}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          <ResultsSection 
            questions={questions}
            topics={topics}
            years={getUniqueYears()}
            subjects={getUniqueSubjects()}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyzerPage;
