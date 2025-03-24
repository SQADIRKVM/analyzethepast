
import { Badge } from "@/components/ui/badge";
import { QuestionTopic } from "@/pages/analyzer/types";
import { Card, CardContent } from "@/components/ui/card";

interface TopicsDisplayProps {
  topics: QuestionTopic[];
}

const TopicsDisplay = ({ topics }: TopicsDisplayProps) => {
  if (!topics || topics.length === 0) {
    return null;
  }

  // Sort topics by occurrence count (highest first)
  const sortedTopics = [...topics].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {sortedTopics.map((topic, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="px-3 py-1 bg-primary/5 text-primary"
            >
              {topic.name} ({topic.count})
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Common topics identified across multiple questions in this document
        </p>
      </CardContent>
    </Card>
  );
};

export default TopicsDisplay;
