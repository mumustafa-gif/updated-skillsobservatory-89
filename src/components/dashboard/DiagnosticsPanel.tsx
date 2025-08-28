import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BarChart3 } from 'lucide-react';

interface Diagnostics {
  chartTypes?: string[];
  dimensions?: string[];
  notes?: string;
  sources?: string[];
}

interface DiagnosticsPanelProps {
  diagnostics: Diagnostics | null;
  visible: boolean;
}

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ diagnostics, visible }) => {
  if (!visible || !diagnostics) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-sky-50/30 dark:from-blue-950/20 dark:to-sky-950/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-primary font-bold">
              Technical Analysis
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Chart Types</Label>
              <div className="flex flex-wrap gap-1">
                {diagnostics.chartTypes?.map((type: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                    {type}
                  </Badge>
                )) || <span className="text-xs text-muted-foreground">No chart types available</span>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Data Dimensions</Label>
              <div className="flex flex-wrap gap-1">
                {diagnostics.dimensions?.slice(0, 4).map((dimension: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 text-xs">
                    {dimension}
                  </Badge>
                )) || <span className="text-xs text-muted-foreground">No dimensions available</span>}
                {diagnostics.dimensions?.length > 4 && (
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 text-xs">
                    +{diagnostics.dimensions.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">Data Sources</Label>
              <div className="flex flex-wrap gap-1">
                {diagnostics.sources?.slice(0, 2).map((source: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300 text-xs">
                    {source}
                  </Badge>
                )) || (
                  <Badge variant="outline" className="border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300 text-xs">
                    Generated Data
                  </Badge>
                )}
                {diagnostics.sources?.length > 2 && (
                  <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300 text-xs">
                    +{diagnostics.sources.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {diagnostics.notes && (
            <div className="mt-6 p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <Label className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 block">Analysis Notes</Label>
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 leading-relaxed break-words">
                {diagnostics.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DiagnosticsPanel;