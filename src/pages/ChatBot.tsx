import React, { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Bot, Upload } from 'lucide-react';
import ConversationalChat from '@/components/chat/ConversationalChat';
import FileUpload from '@/components/dashboard/FileUpload';
import { useState } from 'react';

interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  created_at: string;
}

const ChatBot = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  // For prototyping - no auth needed

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ChartGen AI Assistant (Prototype)</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Files ({uploadedFiles.length})
            </Button>
            <span className="text-sm text-muted-foreground">
              Test User (Prototype Mode)
            </span>
          </div>
        </div>
        
        {/* File Upload Panel */}
        {showUpload && (
          <div className="border-t bg-muted/20 p-4">
            <div className="container mx-auto">
              <FileUpload 
                onFilesChange={setUploadedFiles}
                uploadedFiles={uploadedFiles}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Chat Interface */}
      <main className="container mx-auto h-[calc(100vh-80px)] p-4">
        <div className="h-full bg-card rounded-lg shadow-sm border">
          <ConversationalChat />
        </div>
      </main>
    </div>
  );
};

export default ChatBot;