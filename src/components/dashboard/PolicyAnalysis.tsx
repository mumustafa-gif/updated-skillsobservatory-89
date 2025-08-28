import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Sparkles, AlertTriangle } from 'lucide-react';

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

const PolicyAnalysis: React.FC<PolicyAnalysisProps> = ({ policyData, visible }) => {
  if (!visible || !policyData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Current Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Current Policies & Regulations
            {policyData.region && (
              <Badge variant="outline" className="ml-2">
                {policyData.region}, {policyData.country}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {policyData.currentPolicies.length > 0 ? (
            <div className="grid gap-3">
              {policyData.currentPolicies.map((policy, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
                  <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">{policy}</p>
                </motion.div>
              ))}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI-Suggested Policy Improvements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {policyData.suggestedImprovements.length > 0 ? (
            <div className="grid gap-3">
              {policyData.suggestedImprovements.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-sm font-medium mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-purple-900 dark:text-purple-100">{suggestion}</p>
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