import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, Sparkles, FileText, Link, Brain, Lightbulb } from 'lucide-react';
import ChartControls from '@/components/dashboard/ChartControls';
import MultiChartDisplay from '@/components/dashboard/MultiChartDisplay';
import DiagnosticsPanel from '@/components/dashboard/DiagnosticsPanel';
import DataInsights from '@/components/dashboard/DataInsights';
import PolicyAnalysis from '@/components/dashboard/PolicyAnalysis';
import AIAgentLoader from '@/components/dashboard/AIAgentLoader';

interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  created_at: string;
}

interface GenerationResult {
  charts: any[];
  diagnostics: any;
  insights: string[];
  policyData: {
    currentPolicies: string[];
    suggestedImprovements: string[];
    region: string;
    country: string;
  } | null;
}

const Dashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [numberOfCharts, setNumberOfCharts] = useState(1);
  const [chartTypes, setChartTypes] = useState<string[]>(['auto']);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Load user's uploaded files
  useEffect(() => {
    if (user) {
      loadUploadedFiles();
    }
  }, [user]);

  // Update chart types array when number of charts changes
  useEffect(() => {
    const newChartTypes = Array.from({ length: numberOfCharts }, (_, index) => 
      chartTypes[index] || 'auto'
    );
    setChartTypes(newChartTypes);
  }, [numberOfCharts]);

  const loadUploadedFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_files')
        .select('id, filename, original_filename, file_size, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your charts",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const requestBody = {
        prompt,
        numberOfCharts,
        chartTypes,
        useKnowledgeBase,
        knowledgeBaseFiles: useKnowledgeBase ? uploadedFiles.map(f => f.id) : []
      };

      const response = await supabase.functions.invoke('generate-advanced-charts', {
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      setGenerationResult(response.data);
      setHasGenerated(true);

      toast({
        title: "Charts Generated!",
        description: `Successfully created ${numberOfCharts} chart${numberOfCharts > 1 ? 's' : ''} with insights and policy analysis`,
      });
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate charts",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* AI Agent Loader */}
      <AIAgentLoader visible={generating} />
      
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ rotate: hasGenerated ? 360 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary"
            >
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ChartGen AI
              </h1>
              <p className="text-xs text-muted-foreground">Intelligent Data Visualization</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/knowledge-base')}
              className="transition-all duration-300 hover:shadow-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Knowledge Base
            </Button>
            <div className="text-right">
              <p className="text-sm font-medium">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground">AI Dashboard</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </motion.div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ChartControls
                numberOfCharts={numberOfCharts}
                onNumberOfChartsChange={setNumberOfCharts}
                chartTypes={chartTypes}
                onChartTypesChange={setChartTypes}
                useKnowledgeBase={useKnowledgeBase}
                onUseKnowledgeBaseChange={setUseKnowledgeBase}
                knowledgeBaseFilesCount={uploadedFiles.length}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generate Charts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Describe your visualization needs</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Example: Create sales performance charts for Q4 2024 by region and product category"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Charts
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome/Empty State */}
            {!hasGenerated && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ float: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-primary via-secondary to-accent p-6 shadow-lg">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Welcome to ChartGen AI
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Transform your data into stunning visualizations with the power of AI. 
                  Describe what you want to see, and our intelligent agents will create 
                  professional charts with insights and analysis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                  >
                    <BarChart3 className="h-8 w-8 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Smart Visualizations</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered chart generation that understands your data
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20"
                  >
                    <Brain className="h-8 w-8 text-secondary mb-4" />
                    <h3 className="font-semibold mb-2">Deep Insights</h3>
                    <p className="text-sm text-muted-foreground">
                      Automatic analysis and recommendations from your data
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20"
                  >
                    <Lightbulb className="h-8 w-8 text-accent mb-4" />
                    <h3 className="font-semibold mb-2">Policy Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Strategic recommendations based on your data trends
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Generated Content */}
            {hasGenerated && !generating && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <MultiChartDisplay 
                    chartOptions={generationResult?.charts || []} 
                    loading={generating} 
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <DiagnosticsPanel 
                    diagnostics={generationResult?.diagnostics}
                    visible={!!generationResult?.diagnostics}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <DataInsights 
                    insights={generationResult?.insights || []}
                    visible={!!(generationResult?.insights && generationResult.insights.length > 0)}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <PolicyAnalysis 
                    policyData={generationResult?.policyData}
                    visible={!!generationResult?.policyData}
                  />
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;