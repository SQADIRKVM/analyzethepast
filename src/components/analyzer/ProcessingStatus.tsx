
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { ProcessStatus } from "@/pages/analyzer/types";

interface ProcessingStatusProps {
  status: ProcessStatus;
  progress: number;
  errorMessage: string;
  currentStep?: string;
  questionCount?: number;
}

const ProcessingStatus = ({ 
  status, 
  progress, 
  errorMessage,
  currentStep,
  questionCount
}: ProcessingStatusProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        {status === "uploading" && (
          <div className="text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full mx-auto w-fit">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium">Uploading File</h3>
          </div>
        )}
        
        {status === "processing" && (
          <div className="text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full mx-auto w-fit">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-medium">Processing Document</h3>
            {currentStep && (
              <p className="text-sm text-muted-foreground">{currentStep}</p>
            )}
          </div>
        )}
        
        {status === "completed" && (
          <div className="text-center space-y-4">
            <div className="bg-green-100 p-4 rounded-full mx-auto w-fit">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-medium">Processing Complete</h3>
            {questionCount !== undefined && questionCount > 0 && (
              <p className="text-sm text-green-600">
                Found {questionCount} question{questionCount !== 1 ? 's' : ''} in your document!
              </p>
            )}
          </div>
        )}
        
        {status === "error" && (
          <div className="text-center space-y-4">
            <div className="bg-red-100 p-4 rounded-full mx-auto w-fit">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-medium">Processing Failed</h3>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{getStatusLabel(status, currentStep)}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {status === "processing" && (
        <div className="text-sm text-muted-foreground">
          <p className="text-center">
            We're extracting questions, enhancing text, and finding relevant videos.
            This might take a few minutes.
          </p>
        </div>
      )}
      
      {status === "completed" && (
        <div className="text-sm text-center text-green-600">
          <p>All done! You can now view the extracted questions.</p>
        </div>
      )}
      
      {status === "error" && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

const getStatusLabel = (status: ProcessStatus, currentStep?: string): string => {
  switch (status) {
    case "uploading":
      return "Uploading file...";
    case "processing":
      return currentStep || "Processing document...";
    case "completed":
      return "Processing complete";
    case "error":
      return "Processing failed";
    default:
      return "";
  }
};

export default ProcessingStatus;
