
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

  // Enhanced chart configuration with professional styling
  const enhancedConfig = useMemo(() => {
    if (!chartOption) return {};
    
    // Validate and fix chart configuration
    const config = { ...chartOption };
    
    // Professional color palette for UAE Ministry
    const professionalColors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#2E8B57', '#FF6347', '#4682B4', '#DAA520', '#9932CC'
    ];

    // Heatmap color gradients
    const heatmapColors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
    const treemapColors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896'];

    // Ensure proper structure for different chart types
    if (config.series && Array.isArray(config.series)) {
      config.series = config.series.map((series: any, index: number) => {
        const baseColor = professionalColors[index % professionalColors.length];
        
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

        // Chart type specific enhancements
        switch (series.type) {
          case 'bar':
            return {
              ...series,
              itemStyle: {
                color: baseColor,
                borderRadius: [4, 4, 0, 0],
                ...series.itemStyle
              },
              label: {
                show: true,
                position: 'top',
                fontSize: 11,
                color: '#333',
                formatter: function(params: any) {
                  const value = typeof params.value === 'number' ? params.value.toLocaleString() : params.value;
                  return value;
                },
                ...series.label
              }
            };
            
          case 'line':
            return {
              ...series,
              lineStyle: {
                color: baseColor,
                width: 3,
                ...series.lineStyle
              },
              itemStyle: {
                color: baseColor,
                borderColor: '#fff',
                borderWidth: 2,
                ...series.itemStyle
              },
              symbol: 'circle',
              symbolSize: 6,
              label: {
                show: false,
                fontSize: 11,
                color: '#333',
                ...series.label
              }
            };
            
          case 'pie':
            return {
              ...series,
              radius: ['40%', '70%'],
              center: ['50%', '60%'],
              itemStyle: {
                borderRadius: 8,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: true,
                formatter: '{b}: {c} ({d}%)',
                fontSize: 12,
                color: '#333',
                fontWeight: 'bold'
              },
              labelLine: {
                show: true,
                length: 15,
                length2: 8
              },
              data: series.data?.map((item: any, idx: number) => ({
                ...item,
                itemStyle: {
                  color: professionalColors[idx % professionalColors.length]
                }
              }))
            };
            
          case 'heatmap':
            return {
              ...series,
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 1
              },
              label: {
                show: true,
                fontSize: 11,
                color: '#000',
                fontWeight: 'bold',
                formatter: function(params: any) {
                  return params.value[2] || params.value;
                }
              }
            };
            
          case 'treemap':
            return {
              ...series,
              levels: [
                {
                  itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 2,
                    gapWidth: 2
                  }
                },
                {
                  colorSaturation: [0.3, 0.6],
                  itemStyle: {
                    borderColorSaturation: 0.7,
                    gapWidth: 1,
                    borderWidth: 2
                  }
                }
              ],
              label: {
                show: true,
                fontSize: 11,
                fontWeight: 'bold',
                color: '#000',
                formatter: function(params: any) {
                  return `${params.name}\n${params.value}`;
                }
              },
              data: series.data?.map((item: any, idx: number) => ({
                ...item,
                itemStyle: {
                  color: treemapColors[idx % treemapColors.length]
                }
              }))
            };
            
          case 'scatter':
            return {
              ...series,
              symbolSize: function(data: any) {
                return Math.max(8, Math.min(25, Math.sqrt((data[2] || 10) * 2)));
              },
              itemStyle: {
                color: baseColor,
                opacity: 0.8,
                ...series.itemStyle
              }
            };
            
          default:
            return {
              ...series,
              itemStyle: {
                color: baseColor,
                ...series.itemStyle
              }
            };
        }
      });
    }

    return {
      ...config,
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      responsive: true,
      maintainAspectRatio: false,
      
      // Enhanced color configuration
      color: professionalColors,
      
      // Enhanced title styling
      title: config.title ? {
        ...config.title,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#1a1a1a',
          ...config.title.textStyle
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666',
          ...config.title.subtextStyle
        },
        left: 'center',
        top: 10
      } : undefined,
      
      // Professional tooltip styling with better formatting
      tooltip: {
        trigger: config.tooltip?.trigger || (config.series?.[0]?.type === 'pie' ? 'item' : 'axis'),
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: { 
          color: '#333',
          fontSize: 12,
          fontWeight: 400
        },
        formatter: function(params: any) {
          if (Array.isArray(params)) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param: any) => {
              const value = typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
              result += `<span style="color:${param.color}">●</span> ${param.seriesName}: <strong>${value}</strong><br/>`;
            });
            return result;
          } else {
            const value = typeof params.value === 'number' ? params.value.toLocaleString() : params.value;
            if (params.percent !== undefined) {
              return `<strong>${params.name}</strong><br/><span style="color:${params.color}">●</span> ${params.seriesName}: <strong>${value} (${params.percent}%)</strong>`;
            }
            return `<strong>${params.name}</strong><br/><span style="color:${params.color}">●</span> ${params.seriesName}: <strong>${value}</strong>`;
          }
        },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;',
        ...config.tooltip
      },
      
      // Enhanced legend styling positioned at bottom right
      legend: config.legend !== false ? {
        show: true,
        type: 'scroll',
        orient: 'vertical',
        right: '2%',
        bottom: '5%',
        itemWidth: 18,
        itemHeight: 12,
        itemGap: 15,
        textStyle: {
          color: '#333',
          fontSize: 12,
          fontWeight: 500
        },
        pageButtonItemGap: 10,
        pageButtonGap: 15,
        pageTextStyle: {
          color: '#666',
          fontSize: 11
        },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 6,
        padding: [8, 12],
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowBlur: 8,
        shadowOffsetY: 2,
        ...config.legend
      } : false,
      
      // Responsive grid styling
      grid: {
        left: '10%',
        right: config.legend !== false && config.legend?.show !== false ? '22%' : '8%',
        bottom: '15%',
        top: config.title ? '18%' : '10%',
        containLabel: true,
        ...config.grid
      },
      
      // Enhanced X-axis styling with dynamic labels
      xAxis: Array.isArray(config.xAxis) ? config.xAxis.map((axis: any) => ({
        ...axis,
        name: axis.name || (axis.type === 'category' ? 'Categories' : 'X Values'),
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          color: '#333',
          ...axis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd' },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd' },
          ...axis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 11,
          rotate: axis.axisLabel?.rotate || 0,
          formatter: axis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'string' && value.length > 12) {
              return value.substring(0, 12) + '...';
            }
            return value;
          },
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed' },
          ...axis.splitLine
        }
      })) : config.xAxis ? {
        ...config.xAxis,
        name: config.xAxis.name || (config.xAxis.type === 'category' ? 'Categories' : 'X Values'),
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          color: '#333',
          ...config.xAxis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd' },
          ...config.xAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd' },
          ...config.xAxis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 11,
          rotate: config.xAxis.axisLabel?.rotate || 0,
          formatter: config.xAxis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'string' && value.length > 12) {
              return value.substring(0, 12) + '...';
            }
            return value;
          },
          ...config.xAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed' },
          ...config.xAxis.splitLine
        }
      } : undefined,
      
      // Enhanced Y-axis styling with dynamic labels
      yAxis: Array.isArray(config.yAxis) ? config.yAxis.map((axis: any) => ({
        ...axis,
        name: axis.name || (axis.type === 'value' ? 'Values' : 'Categories'),
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          color: '#333',
          ...axis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd' },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd' },
          ...axis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 11,
          formatter: axis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'number') {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
              return value.toLocaleString();
            }
            return value;
          },
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed' },
          ...axis.splitLine
        }
      })) : config.yAxis ? {
        ...config.yAxis,
        name: config.yAxis.name || (config.yAxis.type === 'value' ? 'Values' : 'Categories'),
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 13,
          fontWeight: 'bold',
          color: '#333',
          ...config.yAxis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd' },
          ...config.yAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd' },
          ...config.yAxis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 11,
          formatter: config.yAxis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'number') {
              if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
              if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
              return value.toLocaleString();
            }
            return value;
          },
          ...config.yAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed' },
          ...config.yAxis.splitLine
        }
      } : undefined,
      
      // Enhanced visualMap for heatmaps
      visualMap: config.visualMap ? {
        type: 'continuous',
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: heatmapColors
        },
        textStyle: {
          color: '#333',
          fontSize: 11
        },
        ...config.visualMap
      } : config.series?.[0]?.type === 'heatmap' ? {
        type: 'continuous',
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '5%',
        inRange: {
          color: heatmapColors
        },
        textStyle: {
          color: '#333',
          fontSize: 11
        }
      } : undefined
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
