import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, BarChart3, Users, Target } from 'lucide-react';

interface DataInsightsProps {
  insights: string[];
  visible: boolean;
  persona?: string;
}

const DataInsights: React.FC<DataInsightsProps> = ({ insights, visible, persona = 'minister' }) => {
  if (!visible || !insights || insights.length === 0) {
    return null;
  }

  // Limit to 5-6 insights for better readability
  const limitedInsights = insights.slice(0, 6);
  
  // Icons for different types of insights
  const insightIcons = [
    TrendingUp, BarChart3, Users, Target, Lightbulb, TrendingUp
  ];

  // Persona-specific styling and content
  const getPersonaStyles = (persona: string) => {
    switch (persona) {
      case 'minister':
        return {
          title: 'Strategic Intelligence & Policy Analysis',
          description: 'Executive-level workforce analytics covering strategic policy implications, national workforce trends, and Vision 2071 alignment for ministerial decision-making',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          cardBorder: 'border-blue-200 dark:border-blue-800',
          cardBg: 'from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10',
          iconBg: 'bg-blue-100 dark:bg-blue-900/50',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleGradient: 'from-blue-600 to-indigo-600',
          priorityBg: 'from-blue-500 to-indigo-500',
          hoverBg: 'from-blue-500/5 to-indigo-500/5'
        };
      case 'chro':
        return {
          title: 'Workforce Intelligence & HR Analytics',
          description: 'Strategic HR analytics covering talent development, workforce optimization, employee engagement, and organizational capability building for HR leadership',
          badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          cardBorder: 'border-green-200 dark:border-green-800',
          cardBg: 'from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10',
          iconBg: 'bg-green-100 dark:bg-green-900/50',
          iconColor: 'text-green-600 dark:text-green-400',
          titleGradient: 'from-green-600 to-emerald-600',
          priorityBg: 'from-green-500 to-emerald-500',
          hoverBg: 'from-green-500/5 to-emerald-500/5'
        };
      case 'educationist':
        return {
          title: 'Learning Intelligence & Educational Analytics',
          description: 'Educational analytics covering learning outcomes, curriculum effectiveness, student performance, and educational ROI for learning strategists and educators',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          cardBorder: 'border-purple-200 dark:border-purple-800',
          cardBg: 'from-purple-50/50 to-violet-50/30 dark:from-purple-950/20 dark:to-violet-950/10',
          iconBg: 'bg-purple-100 dark:bg-purple-900/50',
          iconColor: 'text-purple-600 dark:text-purple-400',
          titleGradient: 'from-purple-600 to-violet-600',
          priorityBg: 'from-purple-500 to-violet-500',
          hoverBg: 'from-purple-500/5 to-violet-500/5'
        };
      default:
        return {
          title: 'Skills Intelligence & Analysis',
          description: 'Comprehensive workforce analytics covering skill gaps, demand trends, regional distribution, and strategic workforce planning recommendations',
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
          cardBorder: 'border-amber-200 dark:border-amber-800',
          cardBg: 'from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10',
          iconBg: 'bg-amber-100 dark:bg-amber-900/50',
          iconColor: 'text-amber-600 dark:text-amber-400',
          titleGradient: 'from-amber-600 to-orange-600',
          priorityBg: 'from-amber-500 to-orange-500',
          hoverBg: 'from-amber-500/5 to-orange-500/5'
        };
    }
  };

  const personaStyles = getPersonaStyles(persona);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className={`border-${personaStyles.cardBorder} bg-gradient-to-br ${personaStyles.cardBg}`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className={`p-2 rounded-lg ${personaStyles.iconBg}`}>
              <Lightbulb className={`h-5 w-5 ${personaStyles.iconColor}`} />
            </div>
            <div className="flex-1">
              <span className={`bg-gradient-to-r ${personaStyles.titleGradient} bg-clip-text text-transparent font-bold`}>
                {personaStyles.title}
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                {personaStyles.description}
              </p>
            </div>
            <Badge variant="secondary" className={personaStyles.badgeColor}>
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
                  <div className="flex items-start gap-4 p-4 bg-card/70 rounded-xl border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-md">
                    {/* Priority indicator */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${personaStyles.priorityBg} text-white text-sm font-bold shadow-sm flex-shrink-0`}>
                      {index + 1}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-foreground break-words">
                        {insight}
                      </p>
                    </div>
                    
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${personaStyles.iconBg} group-hover:opacity-80 transition-colors`}>
                      <IconComponent className={`h-4 w-4 ${personaStyles.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Hover effect gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${personaStyles.hoverBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none`} />
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