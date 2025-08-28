import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowRight, Brain, Shield, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Conversational Analytics
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Engage with our AI assistant to create multiple visualizations, get regional policy insights, 
            and receive strategic recommendations through natural conversation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center p-6">
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conversational AI</h3>
              <p className="text-muted-foreground">Dynamic conversations that adapt to your needs</p>
            </div>
            <div className="text-center p-6">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Policy Insights</h3>
              <p className="text-muted-foreground">Region-specific compliance and recommendations</p>
            </div>
            <div className="text-center p-6">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Strategic Analysis</h3>
              <p className="text-muted-foreground">AI-powered insights and improvement suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;