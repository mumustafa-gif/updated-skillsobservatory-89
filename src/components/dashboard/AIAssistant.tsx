import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Send, 
  Brain, 
  Database, 
  Loader2,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface AIResponse {
  generatedText: string;
  usedKnowledgeBase: boolean;
  knowledgeBaseFilesCount: number;
}

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a question or prompt.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-with-knowledge', {
        body: {
          prompt: prompt.trim(),
          useKnowledgeBase
        }
      });

      if (error) {
        console.error('Error calling AI function:', error);
        toast({
          title: "Error",
          description: "Failed to generate AI response. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setResponse(data);
      toast({
        title: "Response generated",
        description: useKnowledgeBase 
          ? `AI used ${data.knowledgeBaseFilesCount} knowledge base files` 
          : "AI response generated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            <span>AI Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Knowledge Base Toggle */}
          <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="knowledge-base-toggle" className="text-sm font-medium">
                Use Knowledge Base
              </Label>
              <p className="text-xs text-muted-foreground">
                Include your uploaded files as context for AI responses
              </p>
            </div>
            <Switch
              id="knowledge-base-toggle"
              checked={useKnowledgeBase}
              onCheckedChange={setUseKnowledgeBase}
            />
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Your Question or Prompt
            </Label>
            <Textarea
              id="prompt"
              placeholder="Ask me anything... (Ctrl+Enter to send)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              className="min-h-[100px] resize-none"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Generate Response
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Response */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>AI Response</span>
                </CardTitle>
                <div className="flex space-x-2">
                  {response.usedKnowledgeBase && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <FileText className="h-3 w-3" />
                      <span>{response.knowledgeBaseFilesCount} files used</span>
                    </Badge>
                  )}
                  <Badge variant={response.usedKnowledgeBase ? "default" : "outline"}>
                    {response.usedKnowledgeBase ? "With Knowledge Base" : "General AI"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {response.generatedText}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">Tips for better responses:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Enable "Use Knowledge Base" to get answers based on your uploaded files</li>
              <li>Be specific in your questions for more accurate responses</li>
              <li>Use Ctrl+Enter or Cmd+Enter to quickly send your prompt</li>
              <li>Upload relevant documents to your Knowledge Base for better context</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIAssistant;