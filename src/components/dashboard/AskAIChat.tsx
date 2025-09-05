import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Send, Bot, User, Loader2, Brain, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskAIChatProps {
  generationResult: any;
  knowledgeFileIds?: string[];
}

const AskAIChat: React.FC<AskAIChatProps> = ({ generationResult, knowledgeFileIds = [] }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatAIResponse = (content: string, isStreaming: boolean = false): string => {
    if (!content) return '';
    
    // For streaming, only format complete lines to avoid breaking mid-sentence
    if (isStreaming) {
      const lines = content.split('\n');
      const completedLines = lines.slice(0, -1); // All but the last line
      const lastLine = lines[lines.length - 1];
      
      const formattedCompleted = completedLines.join('\n')
        .replace(/## (.*)/g, '<div class="text-lg font-semibold mt-4 mb-2 text-primary">$1</div>')
        .replace(/### (.*)/g, '<div class="text-base font-medium mt-3 mb-2 text-muted-foreground">$1</div>')
        .replace(/• (.*)/g, '<div class="ml-4 mb-1">• $1</div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\n/g, '<br />');
      
      // Add the last line without formatting (might be incomplete)
      return formattedCompleted + (completedLines.length > 0 ? '<br />' : '') + lastLine;
    }
    
    // For completed responses, format everything
    return content
      .replace(/## (.*)/g, '<div class="text-lg font-semibold mt-4 mb-2 text-primary">$1</div>')
      .replace(/### (.*)/g, '<div class="text-base font-medium mt-3 mb-2 text-muted-foreground">$1</div>')
      .replace(/• (.*)/g, '<div class="ml-4 mb-1">• $1</div>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\n/g, '<br />');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`https://yduosziameskzofrcodg.supabase.co/functions/v1/ask-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          generationResult,
          knowledgeFileIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (!reader) {
        throw new Error('No response body reader');
      }

      setIsLoading(false);

      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data && data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                    setStreamingMessage(accumulatedContent);
                  }
                } catch (e) {
                  // Skip invalid JSON or heartbeats
                }
              }
            } else if (line.startsWith(': heartbeat')) {
              // Skip heartbeat messages
              continue;
            }
          }
        }
      } catch (streamError) {
        console.error('Stream processing error:', streamError);
        // Don't throw - preserve partial content
        if (accumulatedContent) {
          setStreamingMessage(accumulatedContent);
        }
      }

      // Create final message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: accumulatedContent || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      setIsStreaming(false);

    } catch (error) {
      console.error('Error asking AI:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setStreamingMessage('');
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the main insights from this analysis?",
    "What policy recommendations emerge from this data?",
    "How can we improve workforce skills based on these findings?",
    "What are the key challenges identified in the report?",
  ];

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-semibold text-primary mb-2">Welcome to AI Assistant</h4>
            <p className="text-sm text-muted-foreground mb-6">
              I can help you understand your analysis results and answer questions about your data.
            </p>
            
            {/* Suggested Questions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">Try asking:</p>
              <div className="grid gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs text-left h-auto p-3 bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/20"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <Card className={`${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card border-border'
                }`}>
                   <CardContent className="p-3">
                      <div 
                        className="formatted-response text-sm leading-relaxed whitespace-pre-wrap" 
                        dangerouslySetInnerHTML={{ 
                          __html: message.role === 'assistant' ? formatAIResponse(message.content, false) : message.content 
                        }}
                      />
                     <p className={`text-xs mt-2 opacity-70 ${
                       message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                     }`}>
                       {message.timestamp.toLocaleTimeString()}
                     </p>
                   </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="bg-card border-border">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">AI is thinking...</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {isStreaming && streamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <Card className="bg-card border-border">
               <CardContent className="p-3">
                 <div 
                   className="formatted-response text-sm leading-relaxed whitespace-pre-wrap" 
                   dangerouslySetInnerHTML={{ 
                     __html: formatAIResponse(streamingMessage, true) 
                   }}
                 />
                 <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                 <p className="text-xs mt-2 opacity-70 text-muted-foreground flex items-center gap-1">
                   <Loader2 className="h-3 w-3 animate-spin" />
                   Generating response...
                 </p>
               </CardContent>
            </Card>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-4 bg-gradient-to-r from-background/50 to-background/30 rounded-b-xl">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your analysis..."
            disabled={isLoading || isStreaming}
            className="flex-1 bg-background border-primary/20 focus:border-primary"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isStreaming}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            {(isLoading || isStreaming) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AskAIChat;