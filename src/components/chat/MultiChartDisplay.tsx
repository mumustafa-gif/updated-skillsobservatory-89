import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ReactECharts from 'echarts-for-react';
import { BarChart3, LineChart, PieChart, Maximize2, Download } from 'lucide-react';

interface Chart {
  type: string;
  title: string;
  option: any;
  description: string;
}

interface MultiChartDisplayProps {
  charts: {
    charts: Chart[];
    insights: string[];
    diagnostics: any;
  };
}

const MultiChartDisplay: React.FC<MultiChartDisplayProps> = ({ charts }) => {
  const [selectedChart, setSelectedChart] = useState<number | null>(null);

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getChartTypeColor = (type: string) => {
    switch (type) {
      case 'bar':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'line':
        return 'bg-green-500/10 text-green-700 border-green-200';
      case 'pie':
        return 'bg-purple-500/10 text-purple-700 border-purple-200';
      case 'scatter':
        return 'bg-orange-500/10 text-orange-700 border-orange-200';
      case 'radar':
        return 'bg-pink-500/10 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const exportChart = (chart: Chart, index: number) => {
    // Create a temporary canvas to export the chart
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Here you would implement actual chart export logic
      // For now, we'll just show a toast
      console.log('Exporting chart:', chart.title);
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
            <BarChart3 className="w-5 h-5" />
            Generated Charts ({charts.charts.length})
          </CardTitle>
          {charts.diagnostics && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">
                {charts.diagnostics.totalCharts} charts
              </Badge>
              <Badge variant="outline">
                {charts.diagnostics.chartTypes?.join(', ')}
              </Badge>
              {charts.diagnostics.dataPoints && (
                <Badge variant="outline">
                  {charts.diagnostics.dataPoints} data points
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {charts.charts.map((chart, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getChartTypeColor(chart.type)}>
                          {getChartIcon(chart.type)}
                          <span className="ml-1 capitalize">{chart.type}</span>
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedChart(selectedChart === index ? null : index)}
                        >
                          <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportChart(chart, index)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium text-sm">{chart.title}</h4>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-48 mb-2">
                      <ReactECharts
                        option={chart.option}
                        style={{ height: '100%', width: '100%' }}
                        notMerge={true}
                        lazyUpdate={true}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {chart.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Expanded Chart View */}
          {selectedChart !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <Separator className="mb-4" />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{charts.charts[selectedChart].title}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChart(null)}
                    >
                      Close
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 mb-4">
                    <ReactECharts
                      option={charts.charts[selectedChart].option}
                      style={{ height: '100%', width: '100%' }}
                      notMerge={true}
                      lazyUpdate={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {charts.charts[selectedChart].description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Key Insights */}
          {charts.insights && charts.insights.length > 0 && (
            <div>
              <Separator className="mb-4" />
              <h4 className="font-semibold mb-3 text-sm">Key Insights</h4>
              <div className="space-y-2">
                {charts.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="text-sm text-muted-foreground bg-muted/30 p-2 rounded"
                  >
                    {insight}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostics */}
          {charts.diagnostics?.notes && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2 text-sm">Analysis Notes</h4>
              <p className="text-xs text-muted-foreground">
                {charts.diagnostics.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MultiChartDisplay;