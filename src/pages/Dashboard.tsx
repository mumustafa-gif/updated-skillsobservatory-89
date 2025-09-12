import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, Sparkles, FileText, Link, Brain, Lightbulb, ChevronUp, ChevronDown, Crown, Users, GraduationCap, Loader2, RefreshCw } from 'lucide-react';
import ChartControls from '@/components/dashboard/ChartControls';
import MultiChartDisplay from '@/components/dashboard/MultiChartDisplay';
import DiagnosticsPanel from '@/components/dashboard/DiagnosticsPanel';
import DataInsights from '@/components/dashboard/DataInsights';
import PolicyAnalysis from '@/components/dashboard/PolicyAnalysis';
import ChartCustomizer from '@/components/dashboard/ChartCustomizer';
import AIAgentLoader from '@/components/dashboard/AIAgentLoader';
import DetailedReports from '@/components/dashboard/DetailedReports';
import PersonaSelector from '@/components/dashboard/PersonaSelector';
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
  detailedReport?: {
    report: string;
  };
}
const Dashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [numberOfCharts, setNumberOfCharts] = useState(1);
  const [chartTypes, setChartTypes] = useState<string[]>(['auto']);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [configMinimized, setConfigMinimized] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('minister');
  const {
    user,
    signOut,
    loading
  } = useAuth();
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
    const newChartTypes = Array.from({
      length: numberOfCharts
    }, (_, index) => chartTypes[index] || 'auto');
    setChartTypes(newChartTypes);
  }, [numberOfCharts]);
  const loadUploadedFiles = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('knowledge_base_files').select('id, filename, original_filename, file_size, created_at').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
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
        variant: "destructive"
      });
      return;
    }
    setGenerating(true);
    try {
      // Get current session
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No valid session found');
        toast({
          title: "Authentication Error",
          description: "Please sign in again",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      console.log('Starting chart generation with user:', user?.email);
      const requestBody = {
        prompt,
        numberOfCharts,
        chartTypes,
        useKnowledgeBase,
        knowledgeBaseFiles: useKnowledgeBase ? uploadedFiles.map(f => f.id) : [],
        generateDetailedReports: true,
        persona: selectedPersona
      };
      console.log('Request body:', requestBody);
      console.log('Request body stringified:', JSON.stringify(requestBody));

      // Validate request body before sending
      if (!prompt || prompt.trim() === '') {
        toast({
          title: "Error",
          description: "Please enter a prompt for chart generation",
          variant: "destructive"
        });
        setGenerating(false);
        return;
      }
      const response = await supabase.functions.invoke('generate-advanced-charts', {
        body: requestBody
      });
      console.log('Response received:', response);
      if (response.error) {
        console.error('Function error:', response.error);

        // Provide specific error handling for different error types
        if (response.error.message?.includes('Unauthorized')) {
          toast({
            title: "Authentication Error",
            description: "Please sign in again to continue",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        } else if (response.error.message?.includes('Failed to fetch') || response.error.message?.includes('NetworkError') || response.error.message?.includes('Failed to send a request')) {
          toast({
            title: "Network Error",
            description: "Connection issue. The service may be temporarily unavailable - please try again in a moment.",
            variant: "destructive"
          });
          return;
        } else if (response.error.message?.includes('OpenAI')) {
          toast({
            title: "AI Service Error",
            description: "Chart generation service is temporarily unavailable. Please try again later.",
            variant: "destructive"
          });
          return;
        }
        throw response.error;
      }
      if (!response.data) {
        throw new Error('No data received from chart generation service');
      }
      setGenerationResult(response.data);
      setHasGenerated(true);
      setConfigMinimized(true); // Minimize configuration by default after generation
      setShowCustomizer(true);
      toast({
        title: "Charts Generated!",
        description: `Successfully created ${numberOfCharts} chart${numberOfCharts > 1 ? 's' : ''} with insights and policy analysis`
      });
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate charts",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const handleChartsUpdate = (updatedCharts: any[]) => {
    if (generationResult) {
      setGenerationResult({
        ...generationResult,
        charts: updatedCharts
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div animate={{
          rotate: 360
        }} transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }} className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* AI Agent Loader */}
      <AIAgentLoader visible={generating} />
      
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div className="flex items-center space-x-3" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5
        }}>
            <img src="/lovable-uploads/c4d663bc-27ef-4ba5-9a5e-f8401832952e.png" alt="Logo" className="h-16 w-auto hover-scale transition-transform duration-200" />
          </motion.div>
          <motion.div className="flex items-center space-x-4" initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.5,
          delay: 0.1
        }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/knowledge-base')} className="transition-all duration-300 hover:shadow-md">
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
        {/* Centered Configuration (Before Generation) */}
        {!hasGenerated && !generating && <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
            <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="w-full max-w-4xl">
              {/* Welcome Header */}
              <div className="text-center mb-12">
                <motion.div animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }} transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }} className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent p-5 shadow-lg">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </motion.div>
                <h1 className="text-4xl font-bold mb-4 text-primary">
                  Skills Observatory
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  AI-powered platform mapping workforce skills supply and demand across the UAE. 
                  Supporting strategic planning in education, employment, and policy development.
                </p>
              </div>

              {/* Persona Selector */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mb-8"
              >
                <PersonaSelector 
                  selectedPersona={selectedPersona}
                  onPersonaChange={setSelectedPersona}
                />
              </motion.div>

              {/* Centered Configuration Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Chart Configuration */}
                <motion.div initial={{
              opacity: 0,
              x: -30
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.6,
              delay: 0.2
            }}>
                  <Card className="h-full bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        Chart Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <ChartControls numberOfCharts={numberOfCharts} onNumberOfChartsChange={setNumberOfCharts} chartTypes={chartTypes} onChartTypesChange={setChartTypes} useKnowledgeBase={useKnowledgeBase} onUseKnowledgeBaseChange={setUseKnowledgeBase} knowledgeBaseFilesCount={uploadedFiles.length} />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Generate Charts */}
                <motion.div initial={{
              opacity: 0,
              x: 30
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.6,
              delay: 0.3
            }}>
                  <Card className="h-full bg-gradient-to-br from-card to-card/50 border-secondary/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <Sparkles className="h-5 w-5 text-secondary" />
                        </div>
                        Generate Charts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label htmlFor="prompt" className="text-base font-medium">
                          Describe your workforce analysis needs
                        </Label>
                        <Textarea id="prompt" placeholder="Example: Analyze demand for AI and data science skills in Dubai's financial sector for 2025 workforce planning..." value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="resize-none text-base leading-relaxed" />
                      </div>

                      {/* Knowledge Base Toggle */}
                      {uploadedFiles.length > 0 && <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg border border-muted-foreground/20">
                          <div className="space-y-1">
                            <Label className="text-base font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Use Knowledge Base
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Analyze {uploadedFiles.length} uploaded file{uploadedFiles.length > 1 ? 's' : ''} for enhanced insights
                            </p>
                          </div>
                          <Switch checked={useKnowledgeBase} onCheckedChange={setUseKnowledgeBase} className="data-[state=checked]:bg-primary" />
                        </div>}

                      <Button onClick={handleGenerate} disabled={generating} size="lg" className={`w-full h-12 text-base font-medium transition-all duration-300 ${useKnowledgeBase && uploadedFiles.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700' : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90'}`}>
                        {generating ? <>
                            <motion.div animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                            {useKnowledgeBase && uploadedFiles.length > 0 ? 'Generating Skill Analysis with Knowledge Base...' : 'Generating Skills Analysis...'}
                          </> : <>
                            {useKnowledgeBase && uploadedFiles.length > 0 ? <>
                                <Brain className="h-5 w-5 mr-3" />
                                Generate Skill Analysis (with Knowledge Base)
                              </> : <>
                                <Sparkles className="h-5 w-5 mr-3" />
                                Generate Skills Analysis
                              </>}
                          </>}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Feature Highlights */}
              <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.6,
            delay: 0.4
          }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Skills Mapping</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis of workforce skills supply and demand patterns
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-colors rounded-2xl">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold mb-2">Workforce Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Strategic insights for education and employment planning in the UAE
                  </p>
                </div>
                <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 hover:border-accent/40 transition-colors">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-2">Policy Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    Data-driven recommendations for strategic workforce development
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>}


        {/* New Layout (After Generation) */}
        {hasGenerated && !generating && <div className="space-y-6">
            {/* Top Configuration Section - Two Columns with Minimize */}
            <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.5
        }} className="bg-card border rounded-lg shadow-sm">
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Chart Configuration</h3>
                  <Button variant="ghost" size="sm" onClick={() => setConfigMinimized(!configMinimized)} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                    {configMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
              
              {!configMinimized && <motion.div initial={{
            opacity: 0,
            height: 0
          }} animate={{
            opacity: 1,
            height: 'auto'
          }} exit={{
            opacity: 0,
            height: 0
          }} transition={{
            duration: 0.3
          }} className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Persona Display */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Current Persona</span>
                      </div>
                      <div className="bg-gradient-to-br from-card to-card/50 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            {(() => {
                              const currentPersona = [
                                { value: 'minister', icon: Crown, color: 'text-purple-600' },
                                { value: 'chro', icon: Users, color: 'text-blue-600' },
                                { value: 'educationist', icon: GraduationCap, color: 'text-green-600' }
                              ].find(p => p.value === selectedPersona);
                              const IconComponent = currentPersona?.icon || Users;
                              return <IconComponent className={`h-4 w-4 ${currentPersona?.color || 'text-primary'}`} />;
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">
                              {selectedPersona === 'minister' ? 'Minister' : 
                               selectedPersona === 'chro' ? 'CHRO' : 
                               selectedPersona === 'educationist' ? 'Educationist' : 'Default'}
                            </p>
                            <p className="text-xs text-muted-foreground">Active analysis perspective</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configuration Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Configuration</span>
                      </div>
                      <ChartControls numberOfCharts={numberOfCharts} onNumberOfChartsChange={setNumberOfCharts} chartTypes={chartTypes} onChartTypesChange={setChartTypes} useKnowledgeBase={useKnowledgeBase} onUseKnowledgeBaseChange={setUseKnowledgeBase} knowledgeBaseFilesCount={uploadedFiles.length} />
                    </div>

                    {/* Regenerate Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-accent">Regenerate</span>
                      </div>
                      <div className="space-y-3">
                        <PersonaSelector selectedPersona={selectedPersona} onPersonaChange={setSelectedPersona} />
                        <Textarea placeholder="Modify your workforce analysis requirements..." value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="resize-none text-sm" />
                        <Button onClick={handleGenerate} disabled={generating} size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          {generating ? <>
                              <motion.div animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              {useKnowledgeBase && uploadedFiles.length > 0 ? 'Analyzing...' : 'Generating...'}
                            </> : <>
                              {useKnowledgeBase && uploadedFiles.length > 0 ? <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  Skill Analysis
                                </> : <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Regenerate
                                </>}
                            </>}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>}
            </motion.div>

            {/* Main Content - Left: Charts, Right: Analysis - Equal Width */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side - Charts - Equal Width */}
              <div className="space-y-6">
                <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.5
            }}>
                  <MultiChartDisplay chartOptions={generationResult?.charts || []} loading={generating} />
                </motion.div>

                <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.5,
              delay: 0.1
            }}>
                  <DiagnosticsPanel diagnostics={generationResult?.diagnostics} visible={!!generationResult?.diagnostics} />
                </motion.div>

                <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.5,
              delay: 0.3
            }}>
                  <DataInsights insights={generationResult?.insights || []} visible={!!(generationResult?.insights && generationResult.insights.length > 0)} />
                </motion.div>
              </div>

              {/* Right Side - Technical Report - Equal Width */}
              <div className="">
                <motion.div initial={{
              opacity: 0,
              x: 20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              duration: 0.5,
              delay: 0.4
            }} className="sticky top-6">
                  <DetailedReports generationResult={generationResult} persona={selectedPersona} />
                </motion.div>
              </div>
            </div>
          </div>}

        <ChartCustomizer charts={generationResult?.charts || []} onChartsUpdate={handleChartsUpdate} isVisible={showCustomizer && generationResult?.charts.length > 0} onToggle={() => setShowCustomizer(!showCustomizer)} />
      </div>
    </div>;
};
export default Dashboard;