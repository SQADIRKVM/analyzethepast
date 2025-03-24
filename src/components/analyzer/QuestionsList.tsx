
import { Question } from "@/pages/analyzer/types";
import QuestionCard from "./QuestionCard";

interface QuestionsListProps {
  questions: Question[];
}

const QuestionsList = ({ questions }: QuestionsListProps) => {
  if (questions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No questions found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Showing {questions.length} question{questions.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 gap-6">
        {questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
};

export default QuestionsList;
