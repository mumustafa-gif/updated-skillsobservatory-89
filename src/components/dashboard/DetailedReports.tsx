import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Brain, Shield, Lightbulb } from 'lucide-react';

interface DetailedReportsProps {
  generationResult: {
    detailedReport?: string;
    skillsIntelligence?: string;
    currentPoliciesReport?: string;
    suggestedImprovementsReport?: string;
  };
}

const DetailedReports: React.FC<DetailedReportsProps> = ({ generationResult }) => {
  const formatReport = (report: string) => {
    if (!report) return '';
    
    // Convert markdown-style formatting to HTML
    return report
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      .replace(/^• (.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-muted-foreground">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');
  };

  const ReportContent = ({ content, defaultMessage }: { content?: string; defaultMessage: string }) => {
    if (!content) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>{defaultMessage}</p>
        </div>
      );
    }

    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: `<p class="mb-4">${formatReport(content)}</p>` 
        }}
      />
    );
  };

  const hasAnyReport = generationResult.detailedReport || 
                      generationResult.skillsIntelligence || 
                      generationResult.currentPoliciesReport || 
                      generationResult.suggestedImprovementsReport;

  if (!hasAnyReport) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No detailed reports available. Generate charts to view comprehensive analysis.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Detailed Reports & Analysis
          <Badge variant="secondary" className="ml-2">
            AI-Generated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Skills Intelligence
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Current Policies
            </TabsTrigger>
            <TabsTrigger value="improvements" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Complete Detailed Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportContent 
                  content={generationResult.detailedReport}
                  defaultMessage="Complete detailed report will appear here after chart generation."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-secondary">
                  <Brain className="h-5 w-5" />
                  Skills Intelligence & Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportContent 
                  content={generationResult.skillsIntelligence}
                  defaultMessage="Skills intelligence and workforce analysis will appear here after chart generation."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-accent">
                  <Shield className="h-5 w-5" />
                  Current Policies & Regulations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportContent 
                  content={generationResult.currentPoliciesReport}
                  defaultMessage="Current policies and regulatory analysis will appear here after chart generation."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="improvements">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                  <Lightbulb className="h-5 w-5" />
                  AI-Suggested Policy Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportContent 
                  content={generationResult.suggestedImprovementsReport}
                  defaultMessage="AI-generated policy improvement suggestions will appear here after chart generation."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailedReports;