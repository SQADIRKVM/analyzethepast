
import FileUpload from "@/components/analyzer/FileUpload";
import ProcessingStatus from "@/components/analyzer/ProcessingStatus";
import ApiKeySettings from "@/components/analyzer/ApiKeySettings";
import { ProcessStatus } from "../types";

interface UploadSectionProps {
  status: ProcessStatus;
  progress: number;
  errorMessage: string;
  currentStep: string;
  questionCount?: number;
  onUploadPdf: (files: File[]) => void;
  onUploadImage: (files: File[]) => void;
  onUploadPdfOcr?: (files: File[]) => void;
}

const UploadSection = ({ 
  status, 
  progress, 
  errorMessage, 
  currentStep,
  questionCount,
  onUploadPdf,
  onUploadImage,
  onUploadPdfOcr
}: UploadSectionProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upload Document</h3>
        <ApiKeySettings />
      </div>
      
      {status === "idle" && (
        <FileUpload 
          onUploadPdf={onUploadPdf}
          onUploadImage={onUploadImage}
          onUploadPdfOcr={onUploadPdfOcr}
        />
      )}
      
      {status !== "idle" && (
        <ProcessingStatus 
          status={status}
          progress={progress}
          errorMessage={errorMessage}
          currentStep={currentStep}
          questionCount={questionCount}
        />
      )}
    </>
  );
};

export default UploadSection;
