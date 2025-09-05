
import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadChartAsPDF } from '@/utils/pdfGenerator';
import FullScreenChartModal from './FullScreenChartModal';
import MapChart from './MapChart';

interface ChartDisplayProps {
  chartOption: any;
  loading: boolean;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartOption, loading }) => {
  const chartRef = useRef<any>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  // Enhanced chart configuration with better error handling and validation
  const enhancedConfig = useMemo(() => {
    if (!chartOption) return {};
    
    // Validate and fix chart configuration
    const config = { ...chartOption };
    
    // Ensure proper structure for different chart types
    if (config.series && Array.isArray(config.series)) {
      config.series = config.series.map((series: any) => {
        // Fix treemap data structure if needed
        if (series.type === 'treemap' && series.data) {
          series.data = series.data.map((item: any) => {
            if (item.children && !item.value && item.children.length > 0) {
              // Calculate parent value from children if missing
              item.value = item.children.reduce((sum: number, child: any) => sum + (child.value || 0), 0);
            }
            return item;
          });
        }
        return series;
      });
    }

    // Professional color palette from theme
    const themeColors = [
      'hsl(220, 85%, 25%)', // Navy blue (primary)
      'hsl(15, 85%, 60%)',  // Orange (accent)
      'hsl(200, 70%, 45%)', // Blue
      'hsl(35, 80%, 55%)',  // Golden
      'hsl(240, 60%, 50%)', // Purple
      'hsl(220, 70%, 35%)', // Dark navy
      'hsl(15, 75%, 50%)',  // Dark orange
      'hsl(200, 80%, 40%)', // Dark blue
    ];

    return {
      ...config,
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      responsive: true,
      maintainAspectRatio: false,
      
      // Enhanced color configuration
      color: themeColors,
      
      // Professional tooltip styling
      tooltip: {
        trigger: config.tooltip?.trigger || 'item',
        backgroundColor: 'hsl(220, 50%, 8%)',
        borderColor: 'hsl(220, 85%, 25%)',
        borderWidth: 1,
        textStyle: { 
          color: 'hsl(220, 15%, 95%)',
          fontSize: 12,
          fontWeight: 400
        },
        extraCssText: 'box-shadow: 0 8px 32px hsla(220, 85%, 25%, 0.3); border-radius: 8px;',
        ...config.tooltip
      },
      
      // Professional grid styling
      grid: {
        left: '5%',
        right: '5%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
        ...config.grid
      },
      
      // Enhanced legend styling
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: '2%',
        left: 'center',
        itemWidth: 18,
        itemHeight: 12,
        itemGap: 20,
        textStyle: {
          color: 'hsl(220, 20%, 50%)',
          fontSize: 11,
          fontWeight: 500
        },
        pageIconColor: 'hsl(220, 85%, 25%)',
        pageIconInactiveColor: 'hsl(220, 20%, 70%)',
        pageTextStyle: {
          color: 'hsl(220, 20%, 50%)',
          fontSize: 10
        },
        ...config.legend
      },
      
      // Enhanced axis styling
      xAxis: Array.isArray(config.xAxis) ? config.xAxis.map((axis: any) => ({
        ...axis,
        axisLine: { 
          lineStyle: { color: 'hsl(220, 15%, 90%)' },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: 'hsl(220, 15%, 85%)' },
          ...axis.axisTick
        },
        axisLabel: { 
          color: 'hsl(220, 20%, 50%)',
          fontSize: 11,
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 15%, 95%)', type: 'dashed' },
          ...axis.splitLine
        }
      })) : config.xAxis ? {
        ...config.xAxis,
        axisLine: { 
          lineStyle: { color: 'hsl(220, 15%, 90%)' },
          ...config.xAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: 'hsl(220, 15%, 85%)' },
          ...config.xAxis.axisTick
        },
        axisLabel: { 
          color: 'hsl(220, 20%, 50%)',
          fontSize: 11,
          ...config.xAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 15%, 95%)', type: 'dashed' },
          ...config.xAxis.splitLine
        }
      } : undefined,
      
      yAxis: Array.isArray(config.yAxis) ? config.yAxis.map((axis: any) => ({
        ...axis,
        axisLine: { 
          lineStyle: { color: 'hsl(220, 15%, 90%)' },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: 'hsl(220, 15%, 85%)' },
          ...axis.axisTick
        },
        axisLabel: { 
          color: 'hsl(220, 20%, 50%)',
          fontSize: 11,
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 15%, 95%)', type: 'dashed' },
          ...axis.splitLine
        }
      })) : config.yAxis ? {
        ...config.yAxis,
        axisLine: { 
          lineStyle: { color: 'hsl(220, 15%, 90%)' },
          ...config.yAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: 'hsl(220, 15%, 85%)' },
          ...config.yAxis.axisTick
        },
        axisLabel: { 
          color: 'hsl(220, 20%, 50%)',
          fontSize: 11,
          ...config.yAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: 'hsl(220, 15%, 95%)', type: 'dashed' },
          ...config.yAxis.splitLine
        }
      } : undefined,
      
      // Preserve visualMap for heatmaps and other chart types that need it
      ...(config.visualMap && { visualMap: config.visualMap })
    };
  }, [chartOption]);

  const handleDownloadPDF = async () => {
    try {
      const chartContainer = chartRef.current?.ele;
      if (!chartContainer) {
        toast.error('Chart not ready for download');
        return;
      }

      const chartTitle = enhancedConfig.title?.text || 'Generated Chart';
      toast.loading('Generating PDF...');
      await downloadChartAsPDF(chartContainer, chartTitle);
      toast.dismiss();
      toast.success('Chart downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download chart. Please try again.');
      console.error('Download error:', error);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreenOpen(true);
  };
  if (loading) {
    return (
      <Card className="h-[500px]">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </CardContent>
      </Card>
    );
  }

  if (!chartOption) {
    return (
      <Card className="h-[500px]">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">No Chart Generated</p>
            <p className="text-sm text-muted-foreground">
              Enter a prompt and click generate to create your first chart
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if chart type is "Map Visualization" - use Mapbox only for this type
  const isMapChart = (
    chartOption?.chartType === 'Map Visualization' ||
    (chartOption?.mapStyle && chartOption?.center && chartOption?.markers) ||
    (chartOption?.title && chartOption.title.text === 'Map Visualization')
  );

  if (isMapChart) {
    return (
      <MapChart 
        config={chartOption}
        loading={loading}
      />
    );
  }

  // Validate and fix treemap data structure
  if (chartOption?.series && chartOption.series.some((s: any) => s.type === 'treemap')) {
    chartOption.series = chartOption.series.map((series: any) => {
      if (series.type === 'treemap' && series.data) {
        // Ensure data is properly structured for treemap
        series.data = series.data.map((item: any) => {
          if (typeof item === 'number') {
            // Convert plain numbers to proper treemap format
            return { name: `Item ${item}`, value: item };
          }
          if (typeof item === 'object' && item !== null) {
            // Ensure required properties exist
            return {
              name: item.name || 'Unknown',
              value: typeof item.value === 'number' ? item.value : 0,
              ...item
            };
          }
          return { name: 'Unknown', value: 0 };
        });
      }
      return series;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {enhancedConfig.title?.text || 'Generated Chart'}
              </h3>
              {enhancedConfig.title?.subtext && (
                <p className="text-sm text-muted-foreground mt-1">{enhancedConfig.title.subtext}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="gap-2"
                title="Download as PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                onClick={handleFullscreen}
                variant="outline"
                size="sm"
                className="gap-2"
                title="View Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ReactECharts
            ref={chartRef}
            option={enhancedConfig}
            style={{ height: '500px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </CardContent>
        
        <FullScreenChartModal
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          chartOption={chartOption}
          chartTitle={enhancedConfig.title?.text || 'Generated Chart'}
        />
      </Card>
    </motion.div>
  );
};

export default ChartDisplay;
