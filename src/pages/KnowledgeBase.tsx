import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  File, 
  Download, 
  Trash2, 
  FileText, 
  Calendar,
  HardDrive,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import FileUpload from '@/components/dashboard/FileUpload';

interface KnowledgeBaseFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  extracted_content: string | null;
}

const KnowledgeBase = () => {
  const [files, setFiles] = useState<KnowledgeBaseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<KnowledgeBaseFile | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadFiles();
  }, [user, navigate]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesChange = (newFiles: any[]) => {
    // Refresh the file list when new files are uploaded
    loadFiles();
  };

  const deleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_base_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFiles(files.filter(file => file.id !== fileId));
      setSelectedFile(null);
      
      toast({
        title: "File deleted",
        description: "File has been removed from your knowledge base",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFiles = files.filter(file =>
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.mime_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = files.reduce((sum, file) => sum + file.file_size, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p>Loading knowledge base...</p>
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <HardDrive className="h-3 w-3 mr-1" />
              {formatFileSize(totalSize)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - File Upload */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FileUpload 
                onFilesChange={handleFilesChange}
                uploadedFiles={files.map(f => ({
                  id: f.id,
                  filename: f.filename,
                  original_filename: f.original_filename,
                  file_size: f.file_size,
                  created_at: f.created_at
                }))}
              />
            </motion.div>
          </div>

          {/* Right Panel - File List and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search files by name or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* File List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Files ({filteredFiles.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm ? 'No files match your search' : 'No files uploaded yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedFile?.id === file.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedFile(selectedFile?.id === file.id ? null : file)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {file.original_filename}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(file.file_size)}</span>
                                  <span>•</span>
                                  <span>{file.mime_type}</span>
                                  <span>•</span>
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {formatDate(file.created_at)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFile(file.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* File Content Preview */}
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <File className="h-5 w-5" />
                      File Content Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">{selectedFile.original_filename}</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Size: {formatFileSize(selectedFile.file_size)}</p>
                        <p>Type: {selectedFile.mime_type}</p>
                        <p>Uploaded: {formatDate(selectedFile.created_at)}</p>
                      </div>
                    </div>
                    
                    {selectedFile.extracted_content ? (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Extracted Content:</h5>
                        <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                            {selectedFile.extracted_content.slice(0, 2000)}
                            {selectedFile.extracted_content.length > 2000 && '...'}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p>Content extraction in progress or not available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;