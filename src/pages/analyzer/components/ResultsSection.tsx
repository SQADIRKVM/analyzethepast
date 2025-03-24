
import FilterBar from "@/components/analyzer/FilterBar";
import QuestionsList from "@/components/analyzer/QuestionsList";
import { Question, QuestionTopic } from "../types";
import { Separator } from "@/components/ui/separator";
import TopicsDisplay from "@/components/analyzer/TopicsDisplay";

interface ResultsSectionProps {
  questions: Question[];
  topics?: QuestionTopic[];
  years: string[];
  subjects: string[];
  filters: {
    year: string;
    subject: string;
    keyword: string;
  };
  onFilterChange: (name: string, value: string) => void;
}

const ResultsSection = ({ 
  questions, 
  topics = [],
  years, 
  subjects, 
  filters, 
  onFilterChange 
}: ResultsSectionProps) => {
  return (
    <>
      <FilterBar
        years={years}
        subjects={subjects}
        onFilterChange={onFilterChange}
        filters={filters}
      />
      
      {topics.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Common Topics</h3>
          <TopicsDisplay topics={topics} />
          <Separator className="my-4" />
        </div>
      )}
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Extracted Questions</h3>
        <QuestionsList questions={questions} />
      </div>
    </>
  );
};

export default ResultsSection;
