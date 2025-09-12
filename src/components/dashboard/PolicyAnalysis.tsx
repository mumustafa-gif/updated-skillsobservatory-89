import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Sparkles, AlertTriangle, ExternalLink, Globe, BookOpen } from 'lucide-react';

interface PolicyData {
  currentPolicies: string[];
  suggestedImprovements: string[];
  region: string;
  country: string;
}

interface PolicyAnalysisProps {
  policyData: PolicyData | null;
  visible: boolean;
}

// Sample reference links for UAE policies
const getPolicyReference = (index: number) => {
  const references = [
    { title: "UAE Vision 2071", url: "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/federal-governments-strategies-and-plans/uae-vision-2071" },
    { title: "UAE Strategy for the Fourth Industrial Revolution", url: "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/federal-governments-strategies-and-plans/uae-strategy-for-the-fourth-industrial-revolution-2031" },
    { title: "National Skills Strategy", url: "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/federal-governments-strategies-and-plans" },
    { title: "UAE Centennial 2071", url: "https://u.ae/en/about-the-uae/strategies-initiatives-and-awards/federal-governments-strategies-and-plans/uae-centennial-2071" },
    { title: "Mohammed bin Rashid Centre for Leadership Development", url: "https://www.mbrcld.gov.ae/" },
    { title: "Federal Authority for Government Human Resources", url: "https://www.fahr.gov.ae/" }
  ];
  
  return references[index % references.length];
};

const PolicyAnalysis: React.FC<PolicyAnalysisProps> = ({ policyData, visible }) => {
  if (!visible || !policyData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 w-full"
    >
      {/* Current Policies */}
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-sky-50/30 dark:from-blue-950/20 dark:to-sky-950/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-primary font-bold text-lg">
                  Current Policies & Regulations
                </span>
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  Active workforce development policies
                </p>
              </div>
            </div>
            {policyData.region && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700 whitespace-nowrap">
                <Globe className="h-3 w-3 mr-1" />
                {policyData.region}, {policyData.country}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {policyData.currentPolicies.length > 0 ? (
            <div className="grid gap-4">
              {policyData.currentPolicies.map((policy, index) => {
                const reference = getPolicyReference(index);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="group relative overflow-hidden"
                  >
                    <div className="p-4 bg-card/70 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-3">
                          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100 break-words">
                            {policy}
                          </p>
                          
                          {/* Reference Link */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-blue-200/30 dark:border-blue-700/30">
                            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                              <BookOpen className="h-3 w-3" />
                              <span className="font-medium">Reference:</span>
                            </div>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
                              onClick={() => window.open(reference.url, '_blank')}
                            >
                              {reference.title}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No specific policies found for this region and topic.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Suggested Improvements */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/30 dark:from-purple-950/20 dark:to-indigo-950/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent font-bold text-lg">
                AI-Suggested Policy Improvements
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Strategic recommendations for workforce development
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {policyData.suggestedImprovements.length} Suggestions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {policyData.suggestedImprovements.length > 0 ? (
            <div className="grid gap-4">
              {policyData.suggestedImprovements.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="group relative overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4 bg-card/70 rounded-xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary text-accent-foreground text-sm font-bold shadow-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-purple-900 dark:text-purple-100 break-words">
                        {suggestion}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No policy suggestions available at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PolicyAnalysis;