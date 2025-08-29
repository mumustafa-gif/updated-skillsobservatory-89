import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText, Lightbulb } from 'lucide-react';

interface DetailedReportsProps {
  detailedReport: string;
  skillsIntelligence: string;
  currentPolicies: string;
  suggestedImprovements: string;
}

const DetailedReports: React.FC<DetailedReportsProps> = ({
  detailedReport,
  skillsIntelligence,
  currentPolicies,
  suggestedImprovements
}) => {
  const formatReport = (content: string) => {
    if (!content) return null;

    // Split content into sections and format
    const sections = content.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n');
      const formattedLines = lines.map((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // Handle headings (lines starting with #, ##, etc. or ALL CAPS)
        if (trimmedLine.startsWith('#') || (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && !trimmedLine.includes('•'))) {
          const headingText = trimmedLine.replace(/^#+\s*/, '');
          return (
            <h3 key={lineIndex} className="text-lg font-bold text-primary mb-3 mt-4 first:mt-0">
              {headingText}
            </h3>
          );
        }
        
        // Handle bullet points
        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
          const bulletText = trimmedLine.replace(/^[•\-*]\s*/, '');
          return (
            <div key={lineIndex} className="flex items-start gap-2 mb-2 ml-4">
              <span className="text-accent font-semibold mt-1">•</span>
              <span className="text-foreground leading-relaxed">{bulletText}</span>
            </div>
          );
        }
        
        // Handle numbered lists
        if (/^\d+\./.test(trimmedLine)) {
          return (
            <div key={lineIndex} className="mb-2 ml-4">
              <span className="text-foreground leading-relaxed font-medium">{trimmedLine}</span>
            </div>
          );
        }
        
        // Handle bold text (text between ** or __ or starting with specific keywords)
        const keywordRegex = /^(Key findings?|Summary|Conclusion|Important|Note|Warning|Recommendation|Result|Analysis|Insight):/i;
        if (keywordRegex.test(trimmedLine) || trimmedLine.includes('**') || trimmedLine.includes('__')) {
          const boldText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/__(.*?)__/g, '<strong>$1</strong>');
          return (
            <p key={lineIndex} className="text-foreground leading-relaxed mb-3 font-semibold" 
               dangerouslySetInnerHTML={{ __html: boldText }} />
          );
        }
        
        // Regular paragraphs
        if (trimmedLine.length > 0) {
          return (
            <p key={lineIndex} className="text-muted-foreground leading-relaxed mb-3 text-justify">
              {trimmedLine}
            </p>
          );
        }
        
        return null;
      }).filter(Boolean);
      
      return (
        <div key={index} className="mb-6">
          {formattedLines}
        </div>
      );
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Detailed Analysis Reports
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
              <Badge variant="outline" className="px-2 py-1">
                Current Policies
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="improvements" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-primary mb-4">Complete Analysis Report</h3>
              <div className="prose prose-sm max-w-none">
                {formatReport(detailedReport)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">Skills Intelligence & Analysis</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatReport(skillsIntelligence)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Current Policies & Regulations</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatReport(currentPolicies)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="improvements" className="space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">AI-Suggested Policy Improvements</h3>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatReport(suggestedImprovements)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DetailedReports;