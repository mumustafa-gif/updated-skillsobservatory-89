import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Brain, Shield, Lightbulb, TrendingUp, BarChart3, Users, Target, AlertCircle, CheckCircle2, Link, MessageSquare } from 'lucide-react';
import AskAIChat from './AskAIChat';

interface DetailedReportsProps {
  generationResult: {
    detailedReport?: {
      report: string;
      overview?: string;
      currentPolicies?: string;
      aiSuggestions?: string;
      dataSources?: string;
    };
  } | null;
  knowledgeFileIds?: string[];
}

const DetailedReports: React.FC<DetailedReportsProps> = ({ generationResult, knowledgeFileIds = [] }) => {
  const formatReport = (report: string | any) => {
    if (!report) return '';
    
    // Ensure report is a string - handle different data types
    let reportString: string;
    if (typeof report === 'string') {
      reportString = report;
    } else if (typeof report === 'object' && report.report) {
      reportString = typeof report.report === 'string' ? report.report : JSON.stringify(report.report);
    } else {
      reportString = String(report);
    }
    
    // Enhanced professional formatting with proper structure
    let formattedReport = reportString
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
    
    // Enhanced policy report formatting with comprehensive structure
    let formattedReport = report
      // Main headers (H1) - Large primary headers for major policy sections
      .replace(/^# (.*$)/gim, '<div class="mb-8 mt-10 first:mt-0"><h1 class="text-2xl font-bold text-primary mb-4 pb-3 border-b-2 border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-t-lg">$1</h1></div>')
      
      // Section headers (H2) - Medium primary headers with background
      .replace(/^## (.*$)/gim, '<div class="mb-6 mt-8 first:mt-0"><h2 class="text-xl font-bold text-primary mb-3 p-4 bg-gradient-to-r from-primary/15 to-primary/8 rounded-lg border-l-4 border-primary shadow-sm">$1</h2></div>')
      
      // Subsection headers (H3) - Smaller primary headers
      .replace(/^### (.*$)/gim, '<div class="mb-5 mt-6 first:mt-0"><h3 class="text-lg font-bold text-primary mb-3 pl-4 border-l-3 border-primary/60 bg-primary/10 py-2 rounded-r-md">$1</h3></div>')
      
      // Sub-subsection headers (H4) - Minor primary headers
      .replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-primary mb-2 mt-4 pl-2 border-l-2 border-primary/40">$1</h4>')
      
      // Policy entries with reference links - Enhanced with better styling
      .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]\s*\(([^)]+)\)/gim, 
        '<div class="mb-5 p-4 border-l-4 border-primary bg-gradient-to-r from-primary/8 to-background rounded-r-lg shadow-sm hover:shadow-md transition-shadow">' +
        '<div class="flex items-start gap-3">' +
        '<span class="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>' +
        '<div class="flex-1">' +
        '<p class="text-sm text-foreground font-medium mb-3 leading-relaxed">$1</p>' +
        '<a href="$3" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium underline decoration-2 underline-offset-2 transition-colors bg-primary/10 hover:bg-primary/15 px-3 py-2 rounded-md border border-primary/20">' +
        '<span class="text-sm">🔗</span>' +
        '<span>View Source</span>' +
        '<span class="text-xs opacity-75">↗</span>' +
        '</a>' +
        '</div></div></div>')
      
      // Policy entries with references but no links
      .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]/gim, 
        '<div class="mb-5 p-4 border-l-4 border-blue-400 bg-gradient-to-r from-blue-50/60 to-white rounded-r-lg">' +
        '<div class="flex items-start gap-3">' +
        '<span class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>' +
        '<div class="flex-1">' +
        '<p class="text-sm text-gray-800 font-medium mb-3 leading-relaxed">$1</p>' +
        '<span class="inline-flex items-center gap-2 text-xs text-blue-700 bg-blue-100/80 px-3 py-2 rounded-md border border-blue-200/60 font-medium">' +
        '<span>📖</span>' +
        '<span>Reference: $2</span>' +
        '</span>' +
        '</div></div></div>')
      
      // Numbered lists with enhanced styling and blue accents
      .replace(/^(\d+)\.\s+(.+)$/gim, 
        '<div class="mb-4 flex items-start gap-3">' +
        '<span class="inline-flex items-center justify-center w-7 h-7 text-xs font-bold text-white bg-blue-600 rounded-full mr-2 flex-shrink-0">$1</span>' +
        '<div class="flex-1 bg-blue-50/30 p-3 rounded-lg border-l-2 border-blue-300">' +
        '<p class="text-sm text-gray-800 leading-relaxed font-medium">$2</p>' +
        '</div></div>')
      
      // Primary bullet points with enhanced blue styling
      .replace(/^[•\-\*]\s+(.+)$/gim, 
        '<div class="mb-4 flex items-start gap-3">' +
        '<span class="w-3 h-3 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>' +
        '<div class="flex-1 bg-blue-50/40 p-3 rounded-lg border-l-2 border-blue-400">' +
        '<p class="text-sm text-gray-800 leading-relaxed font-medium">$1</p>' +
        '</div></div>')
      
      // Sub-bullet points (indented) with lighter blue styling
      .replace(/^\s{2,}[•\-\*]\s+(.+)$/gim, 
        '<div class="mb-3 ml-6 flex items-start gap-2">' +
        '<span class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>' +
        '<div class="flex-1 bg-blue-50/20 p-2 rounded border-l border-blue-300">' +
        '<p class="text-xs text-gray-700 leading-relaxed">$1</p>' +
        '</div></div>')
      
      // Bold text with blue color emphasis
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-700 font-bold bg-blue-100/40 px-1 rounded">$1</strong>')
      
      // Italic text with blue tint
      .replace(/\*(.*?)\*/g, '<em class="text-blue-600 italic font-medium">$1</em>')
      
      // Code or technical terms with blue accent
      .replace(/`([^`]+)`/g, '<code class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-mono font-semibold border border-blue-200">$1</code>')
      
      // UAE Vision references with special highlighting
      .replace(/(UAE Vision 2071|Vision 2071|National Strategy|Emirates Strategy)/gi, 
        '<span class="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 rounded-md text-xs font-bold">' +
        '<span>🇦🇪</span>' +
        '<span>$1</span>' +
        '</span>')
      
      // Ministry and government body references
      .replace(/(Ministry of [^,.\n]+|MOHRE|MOEI|MOE|Federal Authority[^,.\n]+)/gi, 
        '<span class="bg-blue-200/60 text-blue-800 px-2 py-1 rounded text-xs font-semibold border border-blue-300">$1</span>');

    // Process paragraphs with enhanced spacing
    const paragraphs = formattedReport.split('\n\n').map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';
      
      // Skip already formatted elements
      if (paragraph.startsWith('<div') || paragraph.startsWith('<h') || paragraph.startsWith('<span')) {
        return paragraph;
      }
      
      // Regular paragraphs with blue-tinted background
      if (paragraph && !paragraph.match(/^<[^>]+>/)) {
        return `<div class="mb-4 p-3 bg-blue-50/20 rounded-lg border-l-2 border-blue-200"><p class="text-sm text-gray-800 leading-relaxed">${paragraph}</p></div>`;
      }
      
      return paragraph;
    }).filter(p => p.trim()).join('\n');

    return paragraphs.replace(/\n/g, '');
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

  const PolicyReportContent = ({ content, defaultMessage, icon: Icon, colorClass = "text-accent" }: { 
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
            __html: formatPolicyReport(content) 
          }}
        />
      </motion.div>
    );
  };

  const DataSourcesContent = ({ content, defaultMessage, icon: Icon, colorClass = "text-emerald-700" }: { 
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
            <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center`}>
              <Icon className={`h-8 w-8 ${colorClass}`} />
            </div>
          )}
          <p className="text-muted-foreground text-base">{defaultMessage}</p>
        </motion.div>
      );
    }

    // Format data sources with enhanced styling for links
    const formatDataSources = (sources: string) => {
      if (!sources) return '';
      
      // Remove knowledge base file references and specific unwanted references before formatting
      let cleanedSources = sources
        // Remove lines that contain knowledge base file references
        .replace(/\*\*[^*]+\.pdf\*\*\s*-\s*Uploaded Knowledge Base File\s*/gi, '')
        .replace(/\*\*[^*]+\.docx?\*\*\s*-\s*Uploaded Knowledge Base File\s*/gi, '')
        .replace(/\*\*[^*]+\.txt\*\*\s*-\s*Uploaded Knowledge Base File\s*/gi, '')
        // Remove any other knowledge base file patterns
        .replace(/.*-\s*Uploaded Knowledge Base File.*\n?/gi, '')
        // Remove specific unwanted references
        .replace(/.*Mawaheb Blueprint Discussion Document.*\n?/gi, '')
        .replace(/.*Workforce Planning in Al Ain Region Reports.*\n?/gi, '')
        // Clean up extra line breaks
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
      
      let formattedSources = cleanedSources
        // Format source entries with clickable links
        .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]\s*\(([^)]+)\)/gim, 
          '<div class="mb-6 p-5 border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">' +
          '<div class="flex items-start gap-4">' +
          '<div class="w-4 h-4 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></div>' +
          '<div class="flex-1">' +
          '<h4 class="text-sm font-bold text-emerald-800 mb-3 leading-relaxed">$1</h4>' +
          '<div class="flex flex-col sm:flex-row sm:items-center gap-3">' +
          '<span class="text-xs text-emerald-700 bg-emerald-100/80 px-3 py-2 rounded-lg border border-emerald-200 font-medium">$2</span>' +
          '<a href="$3" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-3 text-sm text-emerald-700 hover:text-emerald-900 font-semibold underline decoration-2 underline-offset-3 transition-all duration-200 bg-white hover:bg-emerald-50 px-4 py-3 rounded-lg border border-emerald-300 hover:border-emerald-400 shadow-sm hover:shadow-md">' +
          '<span class="text-lg">🔗</span>' +
          '<span>Access Official Source</span>' +
          '<span class="text-sm opacity-75 bg-emerald-100 px-2 py-1 rounded">↗</span>' +
          '</a>' +
          '</div></div></div></div>')
        
        // Format sources with references but no links
        .replace(/(.+?)\s*\[Ref:\s*([^\]]+)\]/gim, 
          '<div class="mb-5 p-4 border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-white rounded-lg">' +
          '<div class="flex items-start gap-3">' +
          '<div class="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>' +
          '<div class="flex-1">' +
          '<p class="text-sm text-emerald-800 font-semibold mb-3 leading-relaxed">$1</p>' +
          '<span class="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100/80 px-3 py-2 rounded-md border border-emerald-200 font-medium">' +
          '<span>📚</span>' +
          '<span>Source: $2</span>' +
          '</span>' +
          '</div></div></div>')
        
        // Headers for organization - convert ## to styled h3
        .replace(/^##\s+(.*$)/gim, '<h3 class="text-lg font-semibold text-emerald-700 mb-3 mt-5 pl-3 border-l-4 border-emerald-400">$1</h3>')
        // Convert # to styled h2
        .replace(/^#\s+(.*$)/gim, '<h2 class="text-xl font-bold text-emerald-800 mb-4 mt-6 first:mt-0 pb-2 border-b-2 border-emerald-200">$1</h2>')
        
        // Convert bold text (**text**) to HTML
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-800">$1</strong>')
        
        // Bullet points for source categories
        .replace(/^[•\-\*]\s+(.+)$/gim, 
          '<div class="mb-3 flex items-start gap-3">' +
          '<span class="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>' +
          '<p class="text-sm text-emerald-800 leading-relaxed font-medium">$1</p>' +
          '</div>')
        
        // Convert line breaks to HTML
        .replace(/\n/g, '<br />');

      // Process paragraphs for content that wasn't already formatted
      const paragraphs = formattedSources.split('<br /><br />').map(paragraph => {
        paragraph = paragraph.trim();
        if (!paragraph) return '';
        
        // Skip already formatted elements
        if (paragraph.startsWith('<div') || paragraph.startsWith('<h') || paragraph.startsWith('<span') || paragraph.startsWith('<strong')) {
          return paragraph;
        }
        
        // Regular paragraphs that don't have HTML formatting yet
        if (paragraph && !paragraph.match(/^<[^>]+>/)) {
          return `<div class="mb-4 p-3 bg-emerald-50/30 rounded-lg border-l-2 border-emerald-300"><p class="text-sm text-emerald-800 leading-relaxed">${paragraph}</p></div>`;
        }
        
        return paragraph;
      }).filter(p => p.trim()).join('<br />');

      return paragraphs;
    };

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
            __html: formatDataSources(content) 
          }}
        />
      </motion.div>
    );
  };

  const hasAnyReport = generationResult?.detailedReport;

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
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-muted/50 p-1 h-12">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 font-medium"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="policies" 
                className="flex items-center gap-2 font-medium"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Current Policies</span>
              </TabsTrigger>
              <TabsTrigger 
                value="suggestions" 
                className="flex items-center gap-2 font-medium"
              >
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">AI Suggestions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sources" 
                className="flex items-center gap-2 font-medium"
              >
                <Link className="h-4 w-4" />
                <span className="hidden sm:inline">Data Sources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ask-ai" 
                className="flex items-center gap-2 font-medium"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Ask AI Agent</span>
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
                      <span className="text-primary font-bold">UAE Workforce Skills Analysis</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        AI-generated comprehensive analysis and strategic insights
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  <ReportContent 
                    content={generationResult?.detailedReport?.overview || generationResult?.detailedReport?.report}
                    defaultMessage="Comprehensive workforce skills analysis will appear here after chart generation."
                    icon={FileText}
                    colorClass="text-primary"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies" className="mt-6">
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Shield className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <span className="text-accent font-bold">Current Policy Landscape</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Existing policies and regulatory framework analysis
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  <PolicyReportContent 
                    content={generationResult?.detailedReport?.currentPolicies}
                    defaultMessage="Current policy analysis will appear here when available from knowledge base or AI generation."
                    icon={Shield}
                    colorClass="text-accent"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-6">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="text-primary font-bold">AI-Powered Recommendations</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Strategic suggestions for workforce development and policy improvements
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  <ReportContent 
                    content={generationResult?.detailedReport?.aiSuggestions}
                    defaultMessage="AI-generated policy suggestions and strategic recommendations will appear here."
                    icon={Lightbulb}
                    colorClass="text-primary"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="mt-6">
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Link className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <span className="text-accent font-bold">Official Data Sources</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Verified government sources and authentic reference links used for analysis
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <Separator className="mb-6" />
                <CardContent className="pt-0">
                  <DataSourcesContent 
                    content={generationResult?.detailedReport?.dataSources}
                    defaultMessage="Official data sources and reference links will appear here after AI analysis is complete."
                    icon={Link}
                    colorClass="text-accent"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ask-ai" className="mt-6">
              <AskAIChat 
                generationResult={generationResult}
                knowledgeFileIds={knowledgeFileIds}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DetailedReports;