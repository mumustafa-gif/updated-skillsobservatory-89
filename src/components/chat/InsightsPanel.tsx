import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

interface ImprovementSuggestion {
  category: string;
  priority: string;
  suggestion: string;
  expected_impact: string;
  implementation_effort: string;
  timeline: string;
}

interface RiskAnalysis {
  risk_type: string;
  severity: string;
  description: string;
  mitigation: string;
  probability: string;
}

interface InsightsPanelProps {
  insights: {
    key_insights: string[];
    improvement_suggestions: ImprovementSuggestion[];
    risk_analysis: RiskAnalysis[];
    performance_metrics: {
      current_state: string;
      benchmark_comparison: string;
      growth_potential: string;
      efficiency_score: string;
    };
    next_steps: string[];
  };
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort.toLowerCase()) {
      case 'low':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'medium':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'high':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI-Generated Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="insights">Key Insights</TabsTrigger>
              <TabsTrigger value="suggestions">Improvements</TabsTrigger>
              <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Key Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              <div className="grid gap-3">
                {insights.key_insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <Star className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 font-medium">
                      {insight.replace('• ', '')}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Next Steps */}
              {insights.next_steps && insights.next_steps.length > 0 && (
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Immediate Next Steps
                  </h4>
                  <div className="space-y-2">
                    {insights.next_steps.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{step.replace('• ', '')}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Improvement Suggestions Tab */}
            <TabsContent value="suggestions" className="space-y-4">
              {insights.improvement_suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority} Priority
                          </Badge>
                          <Badge variant="outline">{suggestion.category}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {getEffortIcon(suggestion.implementation_effort)}
                          <span className="text-xs text-muted-foreground">
                            {suggestion.implementation_effort} effort
                          </span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-sm">{suggestion.suggestion}</h4>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-xs mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Expected Impact
                          </h5>
                          <p className="text-muted-foreground text-xs">
                            {suggestion.expected_impact}
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium text-xs mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Timeline
                          </h5>
                          <p className="text-muted-foreground text-xs">
                            {suggestion.timeline}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Risk Analysis Tab */}
            <TabsContent value="risks" className="space-y-4">
              {insights.risk_analysis.map((risk, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${getSeverityColor(risk.severity)}`} />
                          <Badge variant="outline">{risk.risk_type}</Badge>
                        </div>
                        <Badge className={`${getSeverityColor(risk.severity)} bg-opacity-10`}>
                          {risk.severity} Severity
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div>
                        <h5 className="font-medium text-xs mb-1">Risk Description</h5>
                        <p className="text-sm text-muted-foreground">
                          {risk.description}
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium text-xs mb-1">Mitigation Strategy</h5>
                        <p className="text-sm text-muted-foreground">
                          {risk.mitigation}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Probability: {risk.probability}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            {/* Performance Metrics Tab */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Current State Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {insights.performance_metrics.current_state}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Benchmark Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {insights.performance_metrics.benchmark_comparison}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Growth Potential
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {insights.performance_metrics.growth_potential}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Overall Efficiency Score</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {insights.performance_metrics.efficiency_score}
                    </p>
                    {/* You could add a progress bar here if you parse a score from the text */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InsightsPanel;