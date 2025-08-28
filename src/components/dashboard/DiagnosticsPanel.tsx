import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface Diagnostics {
  chartType?: string;
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
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Chart Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart Type */}
          {diagnostics.chartType && (
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Chart Type</p>
                <Badge variant="secondary" className="mt-1">
                  {diagnostics.chartType}
                </Badge>
              </div>
            </div>
          )}

          {/* Dimensions */}
          {diagnostics.dimensions && diagnostics.dimensions.length > 0 && (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Dimensions Used</p>
                <div className="flex flex-wrap gap-1">
                  {diagnostics.dimensions.map((dimension, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {dimension}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {diagnostics.notes && (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Notes & Assumptions</p>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  {diagnostics.notes}
                </p>
              </div>
            </div>
          )}

          {/* Sources */}
          {diagnostics.sources && diagnostics.sources.length > 0 && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Data Sources</p>
                <div className="space-y-1">
                  {diagnostics.sources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <p className="text-sm text-muted-foreground">{source}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DiagnosticsPanel;