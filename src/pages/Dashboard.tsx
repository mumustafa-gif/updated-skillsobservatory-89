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
import { BarChart3, LogOut, Sparkles, FileText, Link } from 'lucide-react';
import ChartControls from '@/components/dashboard/ChartControls';
import MultiChartDisplay from '@/components/dashboard/MultiChartDisplay';
import DiagnosticsPanel from '@/components/dashboard/DiagnosticsPanel';
import DataInsights from '@/components/dashboard/DataInsights';
import PolicyAnalysis from '@/components/dashboard/PolicyAnalysis';

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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ChartGen AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/knowledge-base')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Knowledge Base
            </Button>
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;