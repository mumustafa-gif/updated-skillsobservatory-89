import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import MultiChartDisplay from './MultiChartDisplay';
import PolicyDisplay from './PolicyDisplay';
import InsightsPanel from './InsightsPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface GeneratedContent {
  charts?: any;
  policies?: any;
  insights?: any;
}

const ConversationalChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({});
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('conversational-chat', {
        body: {
          conversationId,
          message: input,
          userContext: {}
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { conversationId: newConversationId, messageId, response: aiResponse, generateContent, context } = response.data;
      
      if (!conversationId) {
        setConversationId(newConversationId);
      }

      const assistantMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        metadata: { generateContent, context }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate content if AI determined it's ready
      if (generateContent) {
        await generateAllContent(newConversationId, messageId, context);
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAllContent = async (convId: string, msgId: string, context: any) => {
    try {
      // Generate multiple charts
      const chartsResponse = await supabase.functions.invoke('generate-multiple-charts', {
        body: { conversationId: convId, messageId: msgId, context }
      });

      if (chartsResponse.data) {
        setGeneratedContent(prev => ({ ...prev, charts: chartsResponse.data }));
      }

      // Generate policies if region is mentioned
      if (context.region) {
        const policiesResponse = await supabase.functions.invoke('generate-policies', {
          body: { conversationId: convId, messageId: msgId, context, region: context.region }
        });

        if (policiesResponse.data) {
          setGeneratedContent(prev => ({ ...prev, policies: policiesResponse.data }));
        }
      }

      // Generate insights
      const insightsResponse = await supabase.functions.invoke('generate-insights', {
        body: { conversationId: convId, messageId: msgId, context, chartData: chartsResponse.data }
      });

      if (insightsResponse.data) {
        setGeneratedContent(prev => ({ ...prev, insights: insightsResponse.data }));
      }

    } catch (error) {
      console.error('Error generating content:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to ChartGen AI</h3>
            <p className="text-muted-foreground">
              I'm here to help you create data visualizations, analyze policies, and generate insights.
              Tell me about your data or what you'd like to analyze!
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' ? 'bg-primary' : 'bg-muted'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-foreground" />
                )}
              </div>
              <Card className={`${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.metadata?.generateContent && (
                    <div className="mt-2 text-xs opacity-80">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Generating visualizations and insights...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-3xl">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                <Bot className="w-4 h-4 text-foreground" />
              </div>
              <Card className="bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Generated Content Display */}
      {(generatedContent.charts || generatedContent.policies || generatedContent.insights) && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
          {generatedContent.charts && (
            <MultiChartDisplay charts={generatedContent.charts} />
          )}
          
          {generatedContent.policies && (
            <PolicyDisplay policies={generatedContent.policies} />
          )}
          
          {generatedContent.insights && (
            <InsightsPanel insights={generatedContent.insights} />
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about your data, request visualizations, or get policy insights..."
            className="resize-none"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationalChat;