
import { useState } from "react";
import { Question } from "@/pages/analyzer/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Youtube } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface QuestionCardProps {
  question: Question;
}

const QuestionCard = ({ question }: QuestionCardProps) => {
  const [showVideos, setShowVideos] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{question.year}</Badge>
              <Badge variant="secondary">{question.subject}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-base">{question.text}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {question.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline" className="bg-primary/5">
              {keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
      {question.relatedVideos && question.relatedVideos.length > 0 && (
        <CardFooter className="flex-col items-stretch pt-0">
          <Button
            variant="ghost"
            className="flex items-center justify-between w-full"
            onClick={() => setShowVideos(!showVideos)}
          >
            <span className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              Related Videos
            </span>
            {showVideos ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {showVideos && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {question.relatedVideos.map((video) => (
                <Dialog key={video.id}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer group">
                      <div className="relative overflow-hidden rounded-md">
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          />
                        </AspectRatio>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                          <Youtube className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-medium line-clamp-2">{video.title}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>{video.title}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <AspectRatio ratio={16 / 9}>
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${video.id}`}
                          title={video.title}
                          frameBorder="0"
                          allowFullScreen
                        ></iframe>
                      </AspectRatio>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default QuestionCard;
