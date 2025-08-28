import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';

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
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'pie', label: 'Pie Chart' },
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'area', label: 'Area Chart' },
  { value: 'radar', label: 'Radar Chart' },
  { value: 'gauge', label: 'Gauge Chart' },
  { value: 'funnel', label: 'Funnel Chart' },
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Chart Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Number of Charts */}
        <div className="space-y-2">
          <Label htmlFor="number-of-charts">Number of Charts</Label>
          <Select
            value={numberOfCharts.toString()}
            onValueChange={(value) => onNumberOfChartsChange(parseInt(value))}
          >
            <SelectTrigger id="number-of-charts">
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
            <Label className="text-base">Chart Types</Label>
            {renderChartTypeSelectors()}
          </div>
        )}

        {/* Knowledge Base Toggle */}
        {knowledgeBaseFilesCount > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Use Knowledge Base</Label>
              <p className="text-xs text-muted-foreground">
                Analyze {knowledgeBaseFilesCount} uploaded file{knowledgeBaseFilesCount > 1 ? 's' : ''}
              </p>
            </div>
            <Switch
              checked={useKnowledgeBase}
              onCheckedChange={onUseKnowledgeBaseChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartControls;