import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';
import ChartTypePreview from './ChartTypePreview';

interface ChartControlsProps {
  numberOfCharts: number;
  onNumberOfChartsChange: (value: number) => void;
  chartTypes: string[];
  onChartTypesChange: (types: string[]) => void;
  useKnowledgeBase: boolean;
  onUseKnowledgeBaseChange: (value: boolean) => void;
  knowledgeBaseFilesCount: number;
}

const chartTypeOptions = [
  { value: 'auto', label: 'Auto (Best choice)' },
  // Basic Charts
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  // Advanced Charts
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'treemap', label: 'Treemap' },
  { value: 'sunburst', label: 'Sunburst' },
  { value: 'sankey', label: 'Sankey Diagram' },
  { value: 'graph', label: 'Graph/Network' },
  { value: 'boxplot', label: 'Box Plot' },
  { value: 'candlestick', label: 'Candlestick' },
  { value: 'parallel', label: 'Parallel Coordinates' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'gauge', label: 'Gauge Chart' },
  { value: 'funnel', label: 'Funnel Chart' },
  { value: 'themeriver', label: 'Theme River' },
  { value: 'polar', label: 'Polar Chart' },
];

const ChartControls: React.FC<ChartControlsProps> = ({
  numberOfCharts,
  onNumberOfChartsChange,
  chartTypes,
  onChartTypesChange,
  useKnowledgeBase,
  onUseKnowledgeBaseChange,
  knowledgeBaseFilesCount,
}) => {
  const handleChartTypeChange = (index: number, value: string) => {
    const newTypes = [...chartTypes];
    newTypes[index] = value;
    onChartTypesChange(newTypes);
  };

  const renderChartTypeSelectors = () => {
    return Array.from({ length: numberOfCharts }, (_, index) => (
      <div key={index} className="space-y-2">
        <Label htmlFor={`chart-type-${index}`}>
          Chart {index + 1} Type
        </Label>
        <Select
          value={chartTypes[index] || 'auto'}
          onValueChange={(value) => handleChartTypeChange(index, value)}
        >
          <SelectTrigger id={`chart-type-${index}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {chartTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Number of Charts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-primary">Number of Charts</Label>
        </div>
        <Select
          value={numberOfCharts.toString()}
          onValueChange={(value) => onNumberOfChartsChange(parseInt(value))}
        >
          <SelectTrigger className="h-10 bg-background/50 border-primary/20 hover:border-primary/40 transition-colors">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} Chart{num > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart Type Selectors */}
      {numberOfCharts > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium text-secondary flex items-center gap-2">
            <span className="w-2 h-2 bg-secondary rounded-full"></span>
            Chart Types
          </Label>
            <div className="grid gap-3">
              {Array.from({ length: numberOfCharts }, (_, index) => (
                <div key={index} className="group">
                  <Label htmlFor={`chart-type-${index}`} className="text-xs text-muted-foreground mb-2 block">
                    Chart {index + 1}
                  </Label>
                  <Select
                    value={chartTypes[index] || 'auto'}
                    onValueChange={(value) => handleChartTypeChange(index, value)}
                  >
                    <SelectTrigger 
                      id={`chart-type-${index}`}
                      className="h-9 bg-background/50 border-muted text-sm hover:border-primary/40 transition-colors group-hover:border-primary/30"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {chartTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Show preview for first chart */}
                  {index === 0 && (chartTypes[0] || 'auto') !== 'auto' && (
                    <ChartTypePreview selectedType={chartTypes[0] || 'auto'} />
                  )}
                </div>
              ))}
            </div>
        </div>
      )}

      {/* Knowledge Base Toggle */}
      {knowledgeBaseFilesCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl border border-accent/20 hover:border-accent/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-accent flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                Use Knowledge Base
              </Label>
              <p className="text-xs text-muted-foreground">
                Analyze {knowledgeBaseFilesCount} uploaded file{knowledgeBaseFilesCount > 1 ? 's' : ''} for enhanced insights
              </p>
            </div>
            <Switch
              checked={useKnowledgeBase}
              onCheckedChange={onUseKnowledgeBaseChange}
              className="data-[state=checked]:bg-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartControls;