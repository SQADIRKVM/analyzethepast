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
    
    const pdfFile = files[0];
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep("");
      
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
        processPdfFile(pdfFile);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the file. Please try again.");
      toast.error("Failed to upload the file");
    }
  };

  const handlePdfOcrUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const pdfFile = files[0];
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep("");
      
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
        processPdfWithOcr(pdfFile);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading file for OCR:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the file. Please try again.");
      toast.error("Failed to upload the file");
    }
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const imageFile = files[0];
    
    try {
      setStatus("uploading");
      setProgress(0);
      setCurrentStep("");
      
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
        processImageFile(imageFile);
      }, 1000);
      
    } catch (error) {
      console.error("Error uploading image:", error);
      setStatus("error");
      setErrorMessage("Failed to upload the image. Please try again.");
      toast.error("Failed to upload the image");
    }
  };

  const processPdfFile = async (file: File) => {
    try {
      const result = await apiService.processPdfFile(
        file,
        (progress, step) => {
          setProgress(progress);
          setCurrentStep(step);
        }
      );
      
      setProgress(100);
      setStatus("completed");
      setQuestions(result.questions);
      setTopics(result.topics);
      
      toast.success(`Successfully extracted ${result.questions.length} questions!`);
      
    } catch (error) {
      console.error("Error processing file:", error);
      setStatus("error");
      setErrorMessage("Failed to process the file. Please try a different PDF.");
      toast.error("Failed to process the file");
    }
  };

  const processPdfWithOcr = async (file: File) => {
    try {
      const result = await apiService.processPdfWithOCR(
        file,
        (progress, step) => {
          setProgress(progress);
          setCurrentStep(step);
        }
      );
      
      setProgress(100);
      setStatus("completed");
      setQuestions(result.questions);
      setTopics(result.topics);
      
      toast.success(`Successfully extracted ${result.questions.length} questions!`);
      
    } catch (error) {
      console.error("Error processing file with OCR:", error);
      setStatus("error");
      setErrorMessage("Failed to process the file with OCR. Please try a different approach.");
      toast.error("Failed to process the file with OCR");
    }
  };

  const processImageFile = async (file: File) => {
    try {
      const result = await apiService.processImageFile(
        file,
        (progress, step) => {
          setProgress(progress);
          setCurrentStep(step);
        }
      );
      
      setProgress(100);
      setStatus("completed");
      setQuestions(result.questions);
      setTopics(result.topics);
      
      const message = result.questions.length > 0
        ? `Successfully extracted ${result.questions.length} questions!`
        : "Processing complete, but no questions were found.";
        
      toast.success(message);
      
    } catch (error) {
      console.error("Error processing image:", error);
      setStatus("error");
      setErrorMessage("Failed to process the image. Please try a different image with clearer text.");
      toast.error("Failed to process the image");
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
