import React, { useState, useEffect, memo } from 'react';
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
import { BarChart3, LogOut, Sparkles, FileText, Link, Brain, Lightbulb, ChevronUp, ChevronDown, Crown, Users, GraduationCap, Loader2, RefreshCw, Shield, Target, TrendingUp, BookOpen, ArrowLeft } from 'lucide-react';
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
const Dashboard = memo(() => {
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
  const { selectedPersona, updatePersona } = useAuth();
  
  // Use default persona if none is selected yet
  const currentPersona = selectedPersona || 'minister';

  // Persona-specific styling functions
  const getPersonaStyles = (persona: string) => {
    switch (persona) {
      case 'minister':
        return {
          primaryColor: 'from-purple-600 to-indigo-600',
          accentColor: 'from-purple-500/20 to-indigo-500/20',
          borderColor: 'border-purple-200',
          hoverBorderColor: 'hover:border-purple-300',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          title: 'Strategic Policy Analysis',
          subtitle: 'Executive-level workforce insights for national planning',
          description: 'Comprehensive policy analysis with strategic recommendations for UAE workforce development',
          features: [
            { icon: Crown, title: 'Policy Intelligence', desc: 'Strategic policy analysis and recommendations' },
            { icon: Shield, title: 'Executive Briefings', desc: 'High-level workforce insights for decision makers' },
            { icon: Target, title: 'Strategic Planning', desc: 'Long-term workforce development strategies' }
          ]
        };
      case 'chro':
        return {
          primaryColor: 'from-blue-600 to-cyan-600',
          accentColor: 'from-blue-500/20 to-cyan-500/20',
          borderColor: 'border-blue-200',
          hoverBorderColor: 'hover:border-blue-300',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          title: 'Human Resources Analytics',
          subtitle: 'Data-driven insights for workforce management and talent acquisition',
          description: 'Advanced HR analytics focusing on talent acquisition, retention, and workforce optimization',
          features: [
            { icon: Users, title: 'Talent Analytics', desc: 'Comprehensive talent acquisition and retention insights' },
            { icon: BarChart3, title: 'Workforce Metrics', desc: 'Key performance indicators and workforce trends' },
            { icon: TrendingUp, title: 'HR Optimization', desc: 'Strategic HR planning and optimization' }
          ]
        };
      case 'educationist':
        return {
          primaryColor: 'from-emerald-600 to-teal-600',
          accentColor: 'from-emerald-500/20 to-teal-500/20',
          borderColor: 'border-emerald-200',
          hoverBorderColor: 'hover:border-emerald-300',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          title: 'Educational Planning',
          subtitle: 'Skills development insights for curriculum design and educational outcomes',
          description: 'Educational planning focused on skills development, curriculum design, and learning outcomes',
          features: [
            { icon: GraduationCap, title: 'Skills Development', desc: 'Curriculum design and skills gap analysis' },
            { icon: BookOpen, title: 'Learning Outcomes', desc: 'Educational effectiveness and learning metrics' },
            { icon: Lightbulb, title: 'Innovation in Education', desc: 'Future-ready educational strategies' }
          ]
        };
      default:
        return {
          primaryColor: 'from-primary to-secondary',
          accentColor: 'from-primary/20 to-secondary/20',
          borderColor: 'border-primary/20',
          hoverBorderColor: 'hover:border-primary/40',
          iconBg: 'bg-primary/10',
          iconColor: 'text-primary',
          title: 'Skills Observatory',
          subtitle: 'AI-powered workforce analytics platform',
          description: 'Comprehensive workforce skills analysis and strategic planning platform',
          features: [
            { icon: BarChart3, title: 'Skills Mapping', desc: 'AI-powered analysis of workforce skills supply and demand patterns' },
            { icon: Brain, title: 'Workforce Analytics', desc: 'Strategic insights for education and employment planning in the UAE' },
            { icon: Lightbulb, title: 'Policy Intelligence', desc: 'Data-driven recommendations for strategic workforce development' }
          ]
        };
    }
  };
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
    if (user && !loading) {
      loadUploadedFiles();
    }
  }, [user, loading]);

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
        persona: currentPersona
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
          <p className="text-sm text-muted-foreground mt-2">Initializing application...</p>
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
            }} className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${getPersonaStyles(currentPersona).primaryColor} p-5 shadow-lg`}>
                  <Sparkles className="h-10 w-10 text-white" />
                </motion.div>
                <h1 className={`text-4xl font-bold mb-2 ${getPersonaStyles(currentPersona).iconColor}`}>
                  {getPersonaStyles(currentPersona).title}
                </h1>
                <p className="text-lg font-medium text-muted-foreground mb-3">
                  {getPersonaStyles(currentPersona).subtitle}
                </p>
                <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                  {getPersonaStyles(currentPersona).description}
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
                    onPersonaChange={updatePersona}
                  />
              </motion.div>

              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mb-6"
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 hover:shadow-md transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
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
                  <Card className={`h-full bg-gradient-to-br from-card to-card/50 ${getPersonaStyles(currentPersona).borderColor} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className={`p-2 rounded-lg ${getPersonaStyles(currentPersona).iconBg}`}>
                          <BarChart3 className={`h-5 w-5 ${getPersonaStyles(currentPersona).iconColor}`} />
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
                  <Card className={`h-full bg-gradient-to-br from-card to-card/50 ${getPersonaStyles(currentPersona).borderColor} shadow-lg hover:shadow-xl transition-all duration-300`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className={`p-2 rounded-lg ${getPersonaStyles(currentPersona).iconBg}`}>
                          <Sparkles className={`h-5 w-5 ${getPersonaStyles(currentPersona).iconColor}`} />
                        </div>
                        Generate Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <Label htmlFor="prompt" className="text-base font-medium">
                          {currentPersona === 'minister' ? 'Describe your policy analysis requirements' :
                           currentPersona === 'chro' ? 'Describe your HR analytics needs' :
                           currentPersona === 'educationist' ? 'Describe your educational planning requirements' :
                           'Describe your workforce analysis needs'}
                        </Label>
                        <Textarea 
                          id="prompt" 
                          placeholder={
                            currentPersona === 'minister' ? 'Example: Analyze current workforce policies and recommend strategic initiatives for UAE Vision 2071 alignment...' :
                            currentPersona === 'chro' ? 'Example: Analyze talent acquisition trends and retention strategies for tech companies in Dubai...' :
                            currentPersona === 'educationist' ? 'Example: Evaluate skills gap in STEM education and recommend curriculum improvements for 2025...' :
                            'Example: Analyze demand for AI and data science skills in Dubai\'s financial sector for 2025 workforce planning...'
                          }
                          value={prompt} 
                          onChange={e => setPrompt(e.target.value)} 
                          rows={6} 
                          className="resize-none text-base leading-relaxed" 
                        />
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

                      <Button onClick={handleGenerate} disabled={generating} size="lg" className={`w-full h-12 text-base font-medium transition-all duration-300 ${useKnowledgeBase && uploadedFiles.length > 0 ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700' : `bg-gradient-to-r ${getPersonaStyles(currentPersona).primaryColor} hover:opacity-90`}`}>
                        {generating ? <>
                            <motion.div animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3" />
                            {useKnowledgeBase && uploadedFiles.length > 0 ? 
                              (currentPersona === 'minister' ? 'Generating Policy Analysis with Knowledge Base...' :
                               currentPersona === 'chro' ? 'Generating HR Analytics with Knowledge Base...' :
                               currentPersona === 'educationist' ? 'Generating Educational Analysis with Knowledge Base...' :
                               'Generating Skill Analysis with Knowledge Base...') :
                              (currentPersona === 'minister' ? 'Generating Policy Analysis...' :
                               currentPersona === 'chro' ? 'Generating HR Analytics...' :
                               currentPersona === 'educationist' ? 'Generating Educational Analysis...' :
                               'Generating Skills Analysis...')}
                          </> : <>
                            {useKnowledgeBase && uploadedFiles.length > 0 ? <>
                                <Brain className="h-5 w-5 mr-3" />
                                {currentPersona === 'minister' ? 'Generate Policy Analysis (with Knowledge Base)' :
                                 currentPersona === 'chro' ? 'Generate HR Analytics (with Knowledge Base)' :
                                 currentPersona === 'educationist' ? 'Generate Educational Analysis (with Knowledge Base)' :
                                 'Generate Skill Analysis (with Knowledge Base)'}
                              </> : <>
                                <Sparkles className="h-5 w-5 mr-3" />
                                {currentPersona === 'minister' ? 'Generate Policy Analysis' :
                                 currentPersona === 'chro' ? 'Generate HR Analytics' :
                                 currentPersona === 'educationist' ? 'Generate Educational Analysis' :
                                 'Generate Skills Analysis'}
                              </>}
                          </>}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

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
                              const personaData = [
                                { value: 'minister', icon: Crown, color: 'text-purple-600' },
                                { value: 'chro', icon: Users, color: 'text-blue-600' },
                                { value: 'educationist', icon: GraduationCap, color: 'text-green-600' }
                              ].find(p => p.value === currentPersona);
                              const IconComponent = personaData?.icon || Users;
                              return <IconComponent className={`h-4 w-4 ${personaData?.color || 'text-primary'}`} />;
                            })()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">
                              {currentPersona === 'minister' ? 'Minister' : 
                               currentPersona === 'chro' ? 'CHRO' : 
                               currentPersona === 'educationist' ? 'Educationist' : 'Default'}
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
                         <PersonaSelector selectedPersona={selectedPersona} onPersonaChange={updatePersona} />
                        <Textarea 
                          placeholder={
                            currentPersona === 'minister' ? 'Modify your policy analysis requirements...' :
                            currentPersona === 'chro' ? 'Modify your HR analytics requirements...' :
                            currentPersona === 'educationist' ? 'Modify your educational planning requirements...' :
                            'Modify your workforce analysis requirements...'
                          }
                          value={prompt} 
                          onChange={e => setPrompt(e.target.value)} 
                          rows={3} 
                          className="resize-none text-sm" 
                        />
                        <Button onClick={handleGenerate} disabled={generating} size="sm" className={`w-full bg-gradient-to-r ${getPersonaStyles(currentPersona).primaryColor} hover:opacity-90 text-white`}>
                          {generating ? <>
                              <motion.div animate={{
                        rotate: 360
                      }} transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear"
                      }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                              {useKnowledgeBase && uploadedFiles.length > 0 ? 
                                (currentPersona === 'minister' ? 'Analyzing Policy...' :
                                 currentPersona === 'chro' ? 'Analyzing HR Data...' :
                                 currentPersona === 'educationist' ? 'Analyzing Education...' :
                                 'Analyzing...') :
                                (currentPersona === 'minister' ? 'Generating Policy...' :
                                 currentPersona === 'chro' ? 'Generating HR Analytics...' :
                                 currentPersona === 'educationist' ? 'Generating Education Analysis...' :
                                 'Generating...')}
                            </> : <>
                              {useKnowledgeBase && uploadedFiles.length > 0 ? <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  {currentPersona === 'minister' ? 'Policy Analysis' :
                                   currentPersona === 'chro' ? 'HR Analytics' :
                                   currentPersona === 'educationist' ? 'Education Analysis' :
                                   'Skill Analysis'}
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
                  <DataInsights insights={generationResult?.insights || []} visible={!!(generationResult?.insights && generationResult.insights.length > 0)} persona={currentPersona} />
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
                  <DetailedReports generationResult={generationResult} persona={currentPersona} />
                </motion.div>
              </div>
            </div>
          </div>}

        <ChartCustomizer charts={generationResult?.charts || []} onChartsUpdate={handleChartsUpdate} isVisible={showCustomizer && generationResult?.charts.length > 0} onToggle={() => setShowCustomizer(!showCustomizer)} />
      </div>
    </div>;
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;