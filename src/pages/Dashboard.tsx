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
import { BarChart3, LogOut, Sparkles } from 'lucide-react';
import FileUpload from '@/components/dashboard/FileUpload';
import ChartDisplay from '@/components/dashboard/ChartDisplay';
import DiagnosticsPanel from '@/components/dashboard/DiagnosticsPanel';

interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  created_at: string;
}

const Dashboard = () => {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [chartOption, setChartOption] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
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
        description: "Please enter a description for your chart",
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

      const response = await supabase.functions.invoke('generate-chart', {
        body: {
          prompt,
          knowledgeBaseFiles: uploadedFiles.map(f => f.id)
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      const { option, diagnostics: chartDiagnostics } = response.data;
      setChartOption(option);
      setDiagnostics(chartDiagnostics);

      toast({
        title: "Chart Generated!",
        description: "Your chart has been created successfully",
      });
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate chart",
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Input & Upload */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Generate Chart
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Describe your chart</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Example: Generate a bar chart showing sales data by region for Q4 2024"
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
                        Generate Chart
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <FileUpload 
                onFilesChange={setUploadedFiles}
                uploadedFiles={uploadedFiles}
              />
            </motion.div>
          </div>

          {/* Right Panel - Chart & Diagnostics */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ChartDisplay chartOption={chartOption} loading={generating} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <DiagnosticsPanel 
                diagnostics={diagnostics}
                visible={!!diagnostics}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;