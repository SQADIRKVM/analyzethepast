
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

const ApiKeySettings = () => {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [open, setOpen] = useState(false);

  // Load saved API keys on component mount
  useEffect(() => {
    const savedYoutubeKey = localStorage.getItem('youtubeApiKey') || '';
    const savedDeepseekKey = localStorage.getItem('deepseekApiKey') || '';
    setYoutubeApiKey(savedYoutubeKey);
    setDeepseekApiKey(savedDeepseekKey);
  }, []);

  const handleSave = () => {
    // Save API keys to localStorage
    if (youtubeApiKey) {
      localStorage.setItem('youtubeApiKey', youtubeApiKey);
    } else {
      localStorage.removeItem('youtubeApiKey');
    }
    
    if (deepseekApiKey) {
      localStorage.setItem('deepseekApiKey', deepseekApiKey);
    } else {
      localStorage.removeItem('deepseekApiKey');
    }
    
    toast.success('API settings saved');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Enter your API keys to enable advanced features. If left empty, the app will use simulated data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-api-key">YouTube API Key</Label>
            <Input
              id="youtube-api-key"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Enter your YouTube API key"
            />
            <p className="text-xs text-muted-foreground">
              Used for fetching related videos. Create a key in the Google Cloud Console.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deepseek-api-key">DeepSeek API Key</Label>
            <Input
              id="deepseek-api-key"
              value={deepseekApiKey}
              onChange={(e) => setDeepseekApiKey(e.target.value)}
              placeholder="Enter your DeepSeek API key"
            />
            <p className="text-xs text-muted-foreground">
              Used for AI text processing and question analysis. Get a key from DeepSeek.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeySettings;
