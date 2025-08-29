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
    
    // Enhanced markdown-style formatting to HTML with better styling
    return report
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-primary mb-3 mt-6 first:mt-0">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-primary mb-4 mt-8 first:mt-0">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-primary mb-5 mt-10 first:mt-0">$1</h1>')
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
      // Lists with better styling
      .replace(/^• (.*$)/gim, '<li class="ml-6 mb-2 text-foreground leading-relaxed relative"><span class="absolute -left-4 text-primary">•</span>$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 text-foreground leading-relaxed relative"><span class="absolute -left-4 text-primary">•</span>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 text-foreground leading-relaxed list-decimal">$1</li>')
      // Paragraphs with better spacing
      .replace(/\n\n/g, '</p><p class="mb-4 text-foreground leading-relaxed">')
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
          className="prose prose-lg max-w-none text-foreground"
          dangerouslySetInnerHTML={{ 
            __html: `<div class="space-y-4"><p class="mb-4 text-foreground leading-relaxed first:mb-0">${formatReport(content)}</p></div>` 
          }}
        />
      </motion.div>
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
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Detailed Reports & Analysis
              </span>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20 sm:ml-auto">
              <BarChart3 className="h-3 w-3 mr-1" />
              AI-Generated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="skills" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted/50 p-1 h-12">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-secondary/10 data-[state=active]:text-primary font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="skills" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-secondary/10 data-[state=active]:to-accent/10 data-[state=active]:text-secondary font-medium"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Skills Intelligence</span>
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

            <TabsContent value="skills" className="mt-6">
              <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Brain className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <span className="text-secondary font-bold">Skills Intelligence & Analysis</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        AI-powered workforce skills supply and demand insights
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  {/* Skills Intelligence Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-xl p-4 border border-secondary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-medium text-secondary">Demand Analysis</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Skills gap identification and trend analysis</p>
                    </div>
                    <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium text-accent">Supply Mapping</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Current workforce capabilities assessment</p>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Strategic Insights</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Future workforce planning recommendations</p>
                    </div>
                  </div>
                  
                  <ReportContent 
                    content={generationResult.skillsIntelligence}
                    defaultMessage="Skills intelligence and workforce analysis will appear here after chart generation. This section will provide comprehensive insights into skills supply and demand patterns."
                    icon={Brain}
                    colorClass="text-secondary"
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
                  
                  <ReportContent 
                    content={generationResult.currentPoliciesReport}
                    defaultMessage="Current policies and regulatory analysis will appear here after chart generation. This section will provide detailed coverage of existing workforce development policies."
                    icon={Shield}
                    colorClass="text-accent"
                  />
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
                  <ReportContent 
                    content={generationResult.suggestedImprovementsReport}
                    defaultMessage="AI-generated policy improvement suggestions will appear here after chart generation. This section will provide strategic recommendations for enhancing workforce development policies."
                    icon={Lightbulb}
                    colorClass="text-emerald-600"
                  />
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