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
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatAIResponse = (content: string) => {
    if (!content) return '';
    
    let formatted = content
      // Format main headings (##)
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-bold text-primary mb-3 mt-4 first:mt-0 pb-1 border-b border-primary/20">$1</h3>')
      
      // Format subheadings (###)
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-primary/80 mb-2 mt-3">$1</h4>')
      
      // Format bullet points (•)
      .replace(/^• (.+)$/gm, '<div class="flex items-start gap-2 mb-2"><span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span><span class="text-sm text-foreground leading-relaxed">$1</span></div>')
      
      // Format regular bullet points (-)
      .replace(/^- (.+)$/gm, '<div class="flex items-start gap-2 mb-2"><span class="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span><span class="text-sm text-foreground leading-relaxed">$1</span></div>')
      
      // Format bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-primary">$1</strong>')
      
      // Format italic text
      .replace(/\*(.+?)\*/g, '<em class="italic text-foreground/80">$1</em>')
      
      // Format numbers and percentages
      .replace(/(\d+%)/g, '<span class="font-semibold text-primary">$1</span>')
      .replace(/(\d+\.?\d*)/g, '<span class="font-medium text-primary">$1</span>');

    // Process paragraphs
    const paragraphs = formatted.split('\n\n').map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Skip already formatted elements
      if (paragraph.startsWith('<h') || paragraph.startsWith('<div')) {
        return paragraph;
      }
      
      // Regular paragraphs
      return `<p class="text-sm text-foreground leading-relaxed mb-3">${paragraph}</p>`;
    }).filter(p => p.trim()).join('\n');

    return paragraphs.replace(/\n/g, '');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ask-ai', {
        body: {
          question: userMessage.content,
          generationResult,
          knowledgeFileIds,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
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
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      <div 
                        className="formatted-response" 
                        dangerouslySetInnerHTML={{ 
                          __html: message.role === 'assistant' ? formatAIResponse(message.content) : message.content 
                        }}
                      />
                    </p>
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
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your analysis..."
            disabled={isLoading}
            className="flex-1 bg-background border-primary/20 focus:border-primary"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
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