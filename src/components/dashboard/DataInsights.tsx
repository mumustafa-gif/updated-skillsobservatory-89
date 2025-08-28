import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, BarChart3, Users, Target } from 'lucide-react';

interface DataInsightsProps {
  insights: string[];
  visible: boolean;
}

const DataInsights: React.FC<DataInsightsProps> = ({ insights, visible }) => {
  if (!visible || !insights || insights.length === 0) {
    return null;
  }

  // Limit to 5-6 insights for better readability
  const limitedInsights = insights.slice(0, 6);
  
  // Icons for different types of insights
  const insightIcons = [
    TrendingUp, BarChart3, Users, Target, Lightbulb, TrendingUp
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent font-bold">
                Skills Intelligence & Analysis
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Key insights from workforce data analysis
              </p>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {limitedInsights.length} Insights
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:gap-3">
            {limitedInsights.map((insight, index) => {
              const IconComponent = insightIcons[index] || TrendingUp;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15, duration: 0.4 }}
                  className="group relative overflow-hidden"
                >
                  <div className="flex items-start gap-4 p-4 bg-white/70 dark:bg-gray-800/50 rounded-xl border border-amber-200/50 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 hover:shadow-md">
                    {/* Priority indicator */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-bold shadow-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 break-words">
                        {insight}
                      </p>
                    </div>
                    
                    {/* Icon */}
                    <div className="flex-shrink-0 p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 group-hover:bg-amber-200/50 dark:group-hover:bg-amber-800/30 transition-colors">
                      <IconComponent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  
                  {/* Hover effect gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
                </motion.div>
              );
            })}
          </div>

          {/* Summary footer */}
          {insights.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30"
            >
              <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
                Showing top 6 insights • {insights.length - 6} additional insights available in detailed report
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DataInsights;