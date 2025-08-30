import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Brain, Shield, Lightbulb, TrendingUp, BarChart3, Users, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    
    // Enhanced professional formatting with proper structure
    let formattedReport = report
      // Main headers (H1) - Large, prominent styling
      .replace(/^# (.*$)/gim, '<div class="mb-6 mt-8 first:mt-0"><h1 class="text-2xl font-bold text-primary mb-2 pb-2 border-b-2 border-primary/20">$1</h1></div>')
      
      // Section headers (H2) - Medium styling with background
      .replace(/^## (.*$)/gim, '<div class="mb-5 mt-6 first:mt-0"><h2 class="text-xl font-bold text-primary mb-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-l-4 border-primary">$1</h2></div>')
      
      // Subsection headers (H3) - Smaller but distinct
      .replace(/^### (.*$)/gim, '<div class="mb-4 mt-5 first:mt-0"><h3 class="text-lg font-semibold text-primary mb-2 pl-4 border-l-2 border-primary/40">$1</h3></div>')
      
      // Sub-subsection headers (H4) - Minimal styling
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-medium text-primary/80 mb-2 mt-3">$1</h4>')
      
      // Numbered lists with proper formatting
      .replace(/^(\d+\.\s+)(.+)$/gim, '<div class="mb-3 flex items-start"><span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full mr-3 mt-0.5 flex-shrink-0">$1</span><p class="text-sm text-foreground leading-relaxed flex-1">$2</p></div>')
      
      // Bullet points with enhanced styling
      .replace(/^[•\-\*]\s+(.+)$/gim, '<div class="mb-3 flex items-start"><span class="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></span><p class="text-sm text-foreground leading-relaxed">$1</p></div>')
      
      // Sub-bullet points (indented)
      .replace(/^\s{2,}[•\-\*]\s+(.+)$/gim, '<div class="mb-2 ml-5 flex items-start"><span class="w-1.5 h-1.5 bg-primary/60 rounded-full mr-2 mt-2.5 flex-shrink-0"></span><p class="text-xs text-foreground/80 leading-relaxed">$1</p></div>')
      
      // Bold text with primary color
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      
      // Italic text
      .replace(/\*(.*?)\*/g, '<em class="text-foreground/80 italic">$1</em>')
      
      // Code or technical terms
      .replace(/`([^`]+)`/g, '<code class="px-2 py-1 text-xs bg-muted rounded font-mono text-primary">$1</code>');

    // Process paragraphs and add proper spacing
    const paragraphs = formattedReport.split('\n\n').map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Skip already formatted elements
      if (paragraph.startsWith('<div') || paragraph.startsWith('<h') || paragraph.startsWith('<ul') || paragraph.startsWith('<ol')) {
        return paragraph;
      }
      
      // Regular paragraphs
      if (paragraph && !paragraph.match(/^<[^>]+>/)) {
        return `<p class="mb-4 text-sm text-foreground leading-relaxed text-justify">${paragraph}</p>`;
      }
      
      return paragraph;
    }).filter(p => p.trim()).join('\n');

    return paragraphs.replace(/\n/g, '');
  };

  const formatPolicyReport = (report: string) => {
    if (!report) return '';
    
    // Enhanced format policy reports with better reference link handling
    return report
      // Convert policy entries with references and links - improved pattern matching
      .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]\s*\(([^)]+)\)/gim, '<div class="mb-4 p-3 border-l-4 border-accent bg-accent/5 rounded-r-lg"><div class="flex items-start"><span class="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span><div class="flex-1"><p class="text-sm text-foreground font-medium mb-2">$1</p><a href="$3" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs text-accent hover:text-accent/80 underline transition-colors bg-accent/10 px-2 py-1 rounded-md hover:bg-accent/20"><span class="mr-1">🔗</span>$2</a></div></div></div>')
      // Convert policy entries with references but no links
      .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]/gim, '<div class="mb-4 p-3 border-l-4 border-accent bg-accent/5 rounded-r-lg"><div class="flex items-start"><span class="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span><div class="flex-1"><p class="text-sm text-foreground font-medium mb-2">$1</p><span class="text-xs text-muted-foreground italic bg-muted/50 px-2 py-1 rounded-md">📖 Reference: $2</span></div></div></div>')
      // Handle basic bullet points
      .replace(/^• (.+)$/gim, '<div class="mb-3 flex items-start"><span class="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span><p class="text-sm text-foreground">$1</p></div>')
      .replace(/^- (.+)$/gim, '<div class="mb-3 flex items-start"><span class="w-2 h-2 bg-accent rounded-full mt-2 mr-3 flex-shrink-0"></span><p class="text-sm text-foreground">$1</p></div>')
      // Headers with solid colors
      .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-accent mb-3 mt-6 first:mt-0">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-accent mb-4 mt-8 first:mt-0">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-accent mb-5 mt-10 first:mt-0">$1</h1>')
      // Clean line breaks
      .replace(/\n\n/g, '<br/>')
      .replace(/\n/g, '<br/>');
  };

  const ReportContent = ({ content, defaultMessage, icon: Icon, colorClass = "text-primary" }: { 
    content?: string; 
    defaultMessage: string;
    icon?: React.ComponentType<{ className?: string }>;
    colorClass?: string;
  }) => {
    if (!content) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-12 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-muted-foreground/10"
        >
          {Icon && (
            <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-${colorClass.split('-')[1]}/10 to-${colorClass.split('-')[1]}/20 flex items-center justify-center`}>
              <Icon className={`h-8 w-8 ${colorClass}`} />
            </div>
          )}
          <p className="text-muted-foreground text-base">{defaultMessage}</p>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4"
      >
        <div 
          className="text-foreground space-y-3"
          dangerouslySetInnerHTML={{ 
            __html: formatReport(content) 
          }}
        />
      </motion.div>
    );
  };

  const hasAnyReport = generationResult.detailedReport || 
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="mt-6 bg-gradient-to-br from-card to-card/50 border-primary/20 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-primary">
                Technical Report
              </span>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 sm:ml-auto">
              <BarChart3 className="h-3 w-3 mr-1" />
              AI-Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 h-12">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-secondary/10 data-[state=active]:text-primary font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="policies" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent/10 data-[state=active]:to-primary/10 data-[state=active]:text-accent font-medium"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Current Policies</span>
              </TabsTrigger>
              <TabsTrigger 
                value="improvements" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/10 data-[state=active]:to-green-500/10 data-[state=active]:text-emerald-600 font-medium"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">AI Suggestions</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-primary font-bold">Complete Detailed Report</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Comprehensive workforce and skills analysis
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  <ReportContent 
                    content={generationResult.detailedReport}
                    defaultMessage="Complete detailed report will appear here after chart generation."
                    icon={FileText}
                    colorClass="text-primary"
                  />
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="policies" className="mt-6">
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Shield className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <span className="text-accent font-bold">Current Policies & Regulations</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Active workforce development policies and regulatory framework
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  {/* Policy Status Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Active Policies</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Currently implemented workforce policies</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Policy Gaps</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Areas requiring policy attention</p>
                    </div>
                  </div>
                  
                  {/* Policy Content with Custom Formatting */}
                  {generationResult.currentPoliciesReport ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <div 
                        className="space-y-3"
                        dangerouslySetInnerHTML={{ 
                          __html: formatPolicyReport(generationResult.currentPoliciesReport) 
                        }}
                      />
                    </motion.div>
                  ) : (
                    <ReportContent 
                      content={undefined}
                      defaultMessage="Current policies and regulatory analysis will appear here after chart generation. Each policy will be presented as concise bullet points with proper references."
                      icon={Shield}
                      colorClass="text-accent"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="improvements" className="mt-6">
              <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Lightbulb className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-emerald-600 font-bold">AI-Suggested Policy Improvements</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Strategic recommendations for workforce development enhancement
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  {generationResult.suggestedImprovementsReport ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-4"
                    >
                      <div 
                        className="space-y-3"
                        dangerouslySetInnerHTML={{ 
                          __html: generationResult.suggestedImprovementsReport
                            .split('\n\n')
                            .map(paragraph => {
                              if (paragraph.trim() && !paragraph.startsWith('#')) {
                                return `<div class="mb-4 p-3 border-l-4 border-emerald-600 bg-emerald-50 rounded-r-lg"><div class="flex items-start"><span class="w-2 h-2 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span><p class="text-sm text-foreground">${paragraph.trim()}</p></div></div>`;
                              }
                              return paragraph;
                            })
                            .join('')
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-600 font-semibold">$1</strong>')
                            .replace(/\n/g, '<br/>')
                        }}
                      />
                    </motion.div>
                  ) : (
                    <ReportContent 
                      content={undefined}
                      defaultMessage="AI-generated policy improvement suggestions will appear here after chart generation. This section will provide strategic recommendations for enhancing workforce development policies."
                      icon={Lightbulb}
                      colorClass="text-emerald-600"
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DetailedReports;