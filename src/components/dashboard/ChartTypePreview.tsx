import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, BarChart3, PieChart, TrendingUp, Grid3X3, TreeDeciduous, Sun, Share2, Gauge, Zap, Activity, Target, Radar, CircleDot, Filter, Map } from 'lucide-react';

interface ChartTypePreviewProps {
  selectedType: string;
}

const chartTypeInfo = {
  auto: { icon: Sparkles, name: 'Auto Selection', category: 'Smart', description: 'AI chooses the best chart type for your data' },
  
  // Geospatial Charts
  map: { icon: Map, name: 'Map Visualization', category: 'Geospatial', description: 'Interactive geographic data visualization with Mapbox' },
  
  // Basic Charts
  bar: { icon: BarChart3, name: 'Bar Chart', category: 'Basic', description: 'Compare values across categories' },
  line: { icon: TrendingUp, name: 'Line Chart', category: 'Basic', description: 'Show trends over time' },
  pie: { icon: PieChart, name: 'Pie Chart', category: 'Basic', description: 'Display proportions and percentages' },
  area: { icon: Activity, name: 'Area Chart', category: 'Basic', description: 'Filled line chart showing volume' },
  scatter: { icon: CircleDot, name: 'Scatter Plot', category: 'Basic', description: 'Show correlation between variables' },

  // Advanced Charts
  heatmap: { icon: Grid3X3, name: 'Heatmap', category: 'Advanced', description: 'Visualize data density with color intensity' },
  treemap: { icon: TreeDeciduous, name: 'Treemap', category: 'Advanced', description: 'Hierarchical data as nested rectangles' },
  sunburst: { icon: Sun, name: 'Sunburst', category: 'Advanced', description: 'Multi-level hierarchical data in radial layout' },
  sankey: { icon: Share2, name: 'Sankey Diagram', category: 'Advanced', description: 'Flow and relationship visualization' },
  graph: { icon: Share2, name: 'Network Graph', category: 'Advanced', description: 'Node and edge relationship mapping' },
  boxplot: { icon: Target, name: 'Box Plot', category: 'Advanced', description: 'Statistical distribution analysis' },
  candlestick: { icon: BarChart3, name: 'Candlestick', category: 'Advanced', description: 'Financial data with OHLC values' },
  parallel: { icon: Activity, name: 'Parallel Coordinates', category: 'Advanced', description: 'Multi-dimensional data comparison' },
  radar: { icon: Radar, name: 'Radar Chart', category: 'Specialized', description: 'Multi-axis circular comparison' },
  gauge: { icon: Gauge, name: 'Gauge Chart', category: 'Specialized', description: 'Performance meters and KPI displays' },
  funnel: { icon: Filter, name: 'Funnel Chart', category: 'Specialized', description: 'Process flow and conversion rates' },
  themeriver: { icon: Activity, name: 'Theme River', category: 'Advanced', description: 'Flowing time-series data visualization' },
  polar: { icon: Target, name: 'Polar Chart', category: 'Specialized', description: 'Circular coordinate system charts' },
};

const ChartTypePreview: React.FC<ChartTypePreviewProps> = ({ selectedType }) => {
  const chartInfo = chartTypeInfo[selectedType as keyof typeof chartTypeInfo];

  if (!chartInfo) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Smart': return 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200';
      case 'Geospatial': return 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 border-indigo-200';
      case 'Basic': return 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-700 border-blue-200';
      case 'Advanced': return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 border-emerald-200';
      case 'Specialized': return 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 border-orange-200';
      default: return 'bg-muted/50 text-muted-foreground border-muted';
    }
  };

  const Icon = chartInfo.icon;

  return (
    <Card className="mt-3 bg-gradient-to-br from-card to-card/50 border-primary/10 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{chartInfo.name}</span>
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0.5 ${getCategoryColor(chartInfo.category)}`}
              >
                {chartInfo.category}
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {chartInfo.description}
        </p>
        
        {chartInfo.category === 'Advanced' && (
          <div className="mt-3 p-2 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-lg border border-emerald-200/50">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">Advanced ECharts Integration</span>
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Powered by Apache ECharts with enhanced interactivity and customization
            </p>
          </div>
        )}
        
        {chartInfo.category === 'Geospatial' && (
          <div className="mt-3 p-2 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-lg border border-indigo-200/50">
            <div className="flex items-center gap-2">
              <Map className="h-3 w-3 text-indigo-600" />
              <span className="text-xs text-indigo-700 font-medium">Mapbox Integration</span>
            </div>
            <p className="text-xs text-indigo-600 mt-1">
              Interactive maps powered by Mapbox with geographic data visualization
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartTypePreview;