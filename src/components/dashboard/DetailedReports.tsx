import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  FileText, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Users,
  Building
} from 'lucide-react';

interface DetailedReportsProps {
  visible: boolean;
  reportsData: {
    skillsAnalysis?: string;
    currentPolicies?: string;
    policyImprovements?: string;
  } | null;
}

const DetailedReports: React.FC<DetailedReportsProps> = ({ visible, reportsData }) => {
  if (!visible || !reportsData) return null;

  const formatReportContent = (content: string) => {
    // Split content into sections and format it properly
    const sections = content.split('\n\n');
    
    return sections.map((section, index) => {
      const lines = section.split('\n');
      const isHeading = lines[0] && (
        lines[0].includes('#') || 
        lines[0].includes('**') ||
        lines[0].toLowerCase().includes('analysis') ||
        lines[0].toLowerCase().includes('overview') ||
        lines[0].toLowerCase().includes('summary') ||
        lines[0].toLowerCase().includes('findings') ||
        lines[0].toLowerCase().includes('recommendations')
      );

      if (isHeading) {
        const headingText = lines[0].replace(/[#*]/g, '').trim();
        const bodyContent = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="mb-6">
            <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              {headingText}
            </h3>
            {bodyContent && (
              <div className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20">
                {formatBulletPoints(bodyContent)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={index} className="mb-4 text-muted-foreground leading-relaxed">
          {formatBulletPoints(section)}
        </div>
      );
    });
  };

  const formatBulletPoints = (text: string) => {
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        const content = trimmedLine.replace(/^[•\-*]\s*/, '');
        return (
          <div key={lineIndex} className="flex items-start gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
            <span>{content}</span>
          </div>
        );
      }
      
      if (trimmedLine.match(/^\d+\./)) {
        const content = trimmedLine.replace(/^\d+\.\s*/, '');
        const number = trimmedLine.match(/^(\d+)\./)?.[1];
        return (
          <div key={lineIndex} className="flex items-start gap-3 mb-3">
            <Badge variant="outline" className="text-xs font-bold px-2 py-1 min-w-[24px] h-6 flex items-center justify-center">
              {number}
            </Badge>
            <span className="flex-1">{content}</span>
          </div>
        );
      }
      
      if (trimmedLine) {
        return (
          <p key={lineIndex} className="mb-2">
            {trimmedLine}
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="shadow-lg border-primary/10 bg-gradient-to-br from-card via-card to-card/80">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            Detailed Analysis Reports
            <Badge variant="secondary" className="ml-auto">
              Comprehensive Insights
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="skills" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 h-12">
              <TabsTrigger 
                value="skills" 
                className="text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Brain className="h-4 w-4 mr-2" />
                Skills Intelligence
              </TabsTrigger>
              <TabsTrigger 
                value="policies" 
                className="text-sm font-medium data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
              >
                <Building className="h-4 w-4 mr-2" />
                Current Policies
              </TabsTrigger>
              <TabsTrigger 
                value="improvements" 
                className="text-sm font-medium data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Policy Improvements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="skills" className="space-y-6">
              <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-primary text-lg">Skills Intelligence & Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive analysis of workforce skills, gaps, and market demands based on current data trends.
                </p>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {reportsData.skillsAnalysis ? formatReportContent(reportsData.skillsAnalysis) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Skills analysis data not available for this generation.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="policies" className="space-y-6">
              <div className="border-l-4 border-secondary bg-secondary/5 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-secondary" />
                  <h3 className="font-bold text-secondary text-lg">Current Policies & Regulations</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Overview of existing policies, regulations, and frameworks currently in place.
                </p>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {reportsData.currentPolicies ? formatReportContent(reportsData.currentPolicies) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Current policies data not available for this generation.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="improvements" className="space-y-6">
              <div className="border-l-4 border-accent bg-accent/5 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-accent" />
                  <h3 className="font-bold text-accent text-lg">AI-Suggested Policy Improvements</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Data-driven recommendations and strategic improvements for enhanced policy effectiveness.
                </p>
              </div>
              
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {reportsData.policyImprovements ? formatReportContent(reportsData.policyImprovements) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Policy improvements data not available for this generation.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DetailedReports;