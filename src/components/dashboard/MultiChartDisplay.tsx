import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadChartAsPDF } from '@/utils/pdfGenerator';
import FullScreenChartModal from './FullScreenChartModal';
import MapChart from './MapChart';

interface MultiChartDisplayProps {
  chartOptions: any[];
  loading: boolean;
}

const MultiChartDisplay: React.FC<MultiChartDisplayProps> = ({ chartOptions, loading }) => {
  const chartRefs = useRef<any[]>([]);
  const [fullscreenChart, setFullscreenChart] = useState<{ isOpen: boolean; chartOption: any; title: string }>({
    isOpen: false,
    chartOption: null,
    title: ''
  });

  const handleDownloadPDF = async (index: number) => {
    try {
      const chartContainer = chartRefs.current[index]?.ele;
      if (!chartContainer) {
        toast.error('Chart not ready for download');
        return;
      }

      const chartTitle = chartOptions[index]?.title?.text || `Skills Analysis Chart ${index + 1}`;
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

  const handleFullscreen = (index: number) => {
    const chartOption = chartOptions[index];
    const title = chartOption?.title?.text || `Skills Analysis Chart ${index + 1}`;
    setFullscreenChart({
      isOpen: true,
      chartOption,
      title
    });
  };

  useEffect(() => {
    // Force resize after mount and on window resize
    const handleResize = () => {
      chartRefs.current.forEach(ref => {
        if (ref && ref.getEchartsInstance) {
          const instance = ref.getEchartsInstance();
          if (instance) {
            setTimeout(() => instance.resize(), 100);
          }
        }
      });
    };

    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 500); // Initial resize after mount

    return () => window.removeEventListener('resize', handleResize);
  }, [chartOptions]);

  if (loading) {
    return null;
  }

  if (!chartOptions || chartOptions.length === 0) {
    return null;
  }

  const getGridCols = (count: number) => {
    // Always use single column layout
    return 'grid-cols-1';
  };

  const getChartHeight = (screenSize: string) => {
    const heights = {
      mobile: '280px',
      tablet: '320px',
      desktop: '380px',
      large: '420px'
    };
    return heights[screenSize as keyof typeof heights] || heights.desktop;
  };

  const getResponsiveConfig = (chartOption: any, index: number) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024;
    const isLarge = typeof window !== 'undefined' && window.innerWidth > 1440;

    const baseFontSize = isMobile ? 10 : isTablet ? 11 : 12;
    const titleFontSize = isMobile ? 14 : isTablet ? 16 : 18;
    const legendFontSize = isMobile ? 10 : isTablet ? 11 : 12;

    // Professional color palette
    const professionalColors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#2E8B57', '#FF6347', '#4682B4', '#DAA520', '#9932CC'
    ];

    // Heatmap and treemap color palettes
    const heatmapColors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
    const treemapColors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896'];

    // Validate and fix treemap data structure before applying responsive config
    if (chartOption.series && chartOption.series.some((s: any) => s.type === 'treemap')) {
      chartOption.series = chartOption.series.map((series: any) => {
        if (series.type === 'treemap' && series.data) {
          series.data = series.data.map((item: any) => {
            if (typeof item === 'number') {
              return { name: `Item ${item}`, value: item };
            }
            if (typeof item === 'object' && item !== null) {
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

    // Enhanced series with professional styling
    const enhancedSeries = Array.isArray(chartOption.series) 
      ? chartOption.series.map((series: any, seriesIndex: number) => {
          const baseColor = professionalColors[seriesIndex % professionalColors.length];
          
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
                  fontSize: baseFontSize - 1,
                  color: '#333',
                  formatter: function(params: any) {
                    const value = typeof params.value === 'number' 
                      ? params.value.toFixed(1) + '%' 
                      : params.value;
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
                symbolSize: isMobile ? 4 : 6,
                label: {
                  show: false,
                  fontSize: baseFontSize - 1,
                  color: '#333',
                  ...series.label
                }
              };
              
            case 'pie':
              return {
                ...series,
                radius: isMobile ? ['30%', '60%'] : ['40%', '70%'],
                center: ['50%', '60%'],
                itemStyle: {
                  borderRadius: isMobile ? 4 : 6,
                  borderColor: '#fff',
                  borderWidth: 2
                },
                label: {
                  show: true,
                  formatter: '{b}: {d}%',
                  fontSize: baseFontSize,
                  color: '#333',
                  fontWeight: 'bold'
                },
                labelLine: {
                  show: true,
                  length: isMobile ? 10 : 15,
                  length2: isMobile ? 5 : 8
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
                  show: !isMobile,
                  fontSize: baseFontSize - 1,
                  color: '#000',
                  fontWeight: 'bold',
                  formatter: function(params: any) {
                    const value = params.value[2] || params.value;
                    return typeof value === 'number' ? value.toFixed(1) + '%' : value;
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
                  fontSize: isMobile ? 9 : baseFontSize - 1,
                  fontWeight: 'bold',
                  color: '#000',
                  formatter: function(params: any) {
                    const percentage = ((params.value / params.treeAncestors?.[0]?.value || 1) * 100).toFixed(1);
                    return isMobile ? `${percentage}%` : `${params.name}\n${percentage}%\n(${params.value})`;
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
                  const baseSize = isMobile ? 6 : 8;
                  return Math.max(baseSize, Math.min(isMobile ? 15 : 20, Math.sqrt((data[2] || 10) * 2)));
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
                },
                label: {
                  fontSize: baseFontSize - 1,
                  color: '#333',
                  ...series.label
                }
              };
          }
        })
      : chartOption.series ? [chartOption.series] : [];

    return {
      ...chartOption,
      animation: false, // Disable animation for better performance
      
      // Enhanced color configuration
      color: professionalColors,
      
      // Grid configuration for proper spacing with bottom legend
      grid: {
        left: isMobile ? '12%' : '10%',
        right: isMobile ? '8%' : '8%',
        top: chartOption.title ? (isMobile ? '18%' : '15%') : (isMobile ? '10%' : '8%'),
        bottom: isMobile ? '25%' : '20%',
        containLabel: true,
        ...chartOption.grid
      },

      // Enhanced title configuration
      title: chartOption.title ? {
        ...chartOption.title,
        textStyle: {
          fontSize: titleFontSize,
          fontWeight: 'bold',
          color: '#1a1a1a',
          ...chartOption.title?.textStyle
        },
        subtextStyle: {
          fontSize: baseFontSize + 1,
          color: '#666',
          ...chartOption.title?.subtextStyle
        },
        left: 'center',
        top: 10
      } : undefined,

      // Enhanced legend configuration - horizontal at bottom right
      legend: chartOption.legend !== false ? {
        show: true,
        type: 'scroll',
        orient: 'horizontal',
        right: '2%',
        bottom: '2%',
        itemWidth: isMobile ? 14 : 16,
        itemHeight: isMobile ? 10 : 12,
        itemGap: isMobile ? 10 : 15,
        textStyle: {
          fontSize: legendFontSize,
          color: '#333',
          fontWeight: 500
        },
        formatter: function(name: string) {
          // Enhanced legend with percentage information where available
          return name.includes('(') ? name : `${name}`;
        },
        pageButtonItemGap: isMobile ? 5 : 8,
        pageButtonGap: isMobile ? 8 : 12,
        pageTextStyle: {
          fontSize: legendFontSize - 1,
          color: '#666'
        },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        borderRadius: 4,
        padding: [4, 8],
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowBlur: 4,
        shadowOffsetY: 1,
        ...chartOption.legend
      } : false,

      // Enhanced tooltip configuration
      tooltip: {
        trigger: chartOption.tooltip?.trigger || (chartOption.series?.[0]?.type === 'pie' ? 'item' : 'axis'),
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: {
          fontSize: baseFontSize,
          color: '#333'
        },
        formatter: function(params: any) {
          if (Array.isArray(params)) {
            let result = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach((param: any) => {
              const value = typeof param.value === 'number' 
                ? param.value.toFixed(1) + '%' 
                : param.value;
              result += `<span style="color:${param.color}">●</span> ${param.seriesName}: <strong>${value}</strong><br/>`;
            });
            return result;
          } else {
            const value = typeof params.value === 'number' 
              ? params.value.toFixed(1) + '%' 
              : params.value;
            if (params.percent !== undefined) {
              return `<strong>${params.name}</strong><br/><span style="color:${params.color}">●</span> ${params.seriesName}: <strong>${params.percent.toFixed(1)}%</strong>`;
            }
            return `<strong>${params.name}</strong><br/><span style="color:${params.color}">●</span> ${params.seriesName}: <strong>${value}</strong>`;
          }
        },
        confine: true,
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 6px;',
        position: function (point: number[], params: any, dom: any, rect: any, size: any) {
          const x = point[0] < size.viewSize[0] / 2 ? point[0] + 20 : point[0] - dom.offsetWidth - 20;
          const y = point[1] < size.viewSize[1] / 2 ? point[1] + 20 : point[1] - dom.offsetHeight - 20;
          return [Math.max(10, Math.min(x, size.viewSize[0] - dom.offsetWidth - 10)), 
                  Math.max(10, Math.min(y, size.viewSize[1] - dom.offsetHeight - 10))];
        },
        ...chartOption.tooltip
      },

      // Enhanced X-axis configuration with dynamic labels
      xAxis: Array.isArray(chartOption.xAxis) 
        ? chartOption.xAxis.map(axis => ({
            ...axis,
            name: axis.name || (axis.type === 'category' ? 'Categories' : 'X Values'),
            nameLocation: 'middle',
            nameGap: isMobile ? 25 : 30,
            nameTextStyle: {
              fontSize: baseFontSize + 1,
              fontWeight: 'bold',
              color: '#333',
              ...axis.nameTextStyle
            },
            axisLabel: {
              fontSize: baseFontSize,
              rotate: isMobile && axis.data?.length > 4 ? 30 : 0,
              interval: isMobile ? 'auto' : 0,
              margin: 8,
              color: '#666',
              formatter: axis.axisLabel?.formatter || function(value: any) {
                if (typeof value === 'string' && value.length > (isMobile ? 8 : 12)) {
                  return value.substring(0, isMobile ? 8 : 12) + '...';
                }
                return value;
              },
              ...axis.axisLabel
            },
            axisLine: {
              lineStyle: { color: '#ddd' },
              ...axis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#ddd' },
              ...axis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f5f5f5', type: 'dashed' },
              ...axis.splitLine
            }
          }))
        : chartOption.xAxis ? {
            ...chartOption.xAxis,
            name: chartOption.xAxis.name || (chartOption.xAxis.type === 'category' ? 'Categories' : 'X Values'),
            nameLocation: 'middle',
            nameGap: isMobile ? 25 : 30,
            nameTextStyle: {
              fontSize: baseFontSize + 1,
              fontWeight: 'bold',
              color: '#333',
              ...chartOption.xAxis.nameTextStyle
            },
            axisLabel: {
              fontSize: baseFontSize,
              rotate: isMobile && chartOption.xAxis.data?.length > 4 ? 30 : 0,
              interval: isMobile ? 'auto' : 0,
              margin: 8,
              color: '#666',
              formatter: chartOption.xAxis.axisLabel?.formatter || function(value: any) {
                if (typeof value === 'string' && value.length > (isMobile ? 8 : 12)) {
                  return value.substring(0, isMobile ? 8 : 12) + '...';
                }
                return value;
              },
              ...chartOption.xAxis.axisLabel
            },
            axisLine: {
              lineStyle: { color: '#ddd' },
              ...chartOption.xAxis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#ddd' },
              ...chartOption.xAxis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f5f5f5', type: 'dashed' },
              ...chartOption.xAxis.splitLine
            }
          } : undefined,

      // Enhanced Y-axis configuration with dynamic labels
      yAxis: Array.isArray(chartOption.yAxis)
        ? chartOption.yAxis.map(axis => ({
            ...axis,
            name: axis.name || (axis.type === 'value' ? 'Values' : 'Categories'),
            nameLocation: 'middle',
            nameGap: isMobile ? 40 : 50,
            nameTextStyle: {
              fontSize: baseFontSize + 1,
              fontWeight: 'bold',
              color: '#333',
              ...axis.nameTextStyle
            },
            axisLabel: {
              fontSize: baseFontSize,
              margin: 8,
              color: '#666',
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
            axisLine: {
              lineStyle: { color: '#ddd' },
              ...axis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#ddd' },
              ...axis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f5f5f5', type: 'dashed' },
              ...axis.splitLine
            }
          }))
        : chartOption.yAxis ? {
            ...chartOption.yAxis,
            name: chartOption.yAxis.name || (chartOption.yAxis.type === 'value' ? 'Values' : 'Categories'),
            nameLocation: 'middle',
            nameGap: isMobile ? 40 : 50,
            nameTextStyle: {
              fontSize: baseFontSize + 1,
              fontWeight: 'bold',
              color: '#333',
              ...chartOption.yAxis.nameTextStyle
            },
            axisLabel: {
              fontSize: baseFontSize,
              margin: 8,
              color: '#666',
              formatter: chartOption.yAxis.axisLabel?.formatter || function(value: any) {
                if (typeof value === 'number') {
                  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                  return value.toLocaleString();
                }
                return value;
              },
              ...chartOption.yAxis.axisLabel
            },
            axisLine: {
              lineStyle: { color: '#ddd' },
              ...chartOption.yAxis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#ddd' },
              ...chartOption.yAxis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f5f5f5', type: 'dashed' },
              ...chartOption.yAxis.splitLine
            }
          } : undefined,

      // Enhanced series configuration
      series: enhancedSeries,

      // Enhanced visualMap for heatmaps
      visualMap: chartOption.visualMap ? {
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
          fontSize: baseFontSize
        },
        ...chartOption.visualMap
      } : chartOption.series?.[0]?.type === 'heatmap' ? {
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
          fontSize: baseFontSize
        }
      } : undefined
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`grid ${getGridCols(chartOptions.length)} gap-3 sm:gap-4 lg:gap-6 w-full`}
    >
      {chartOptions.map((chartOption, index) => {
        // Check if chart type is "Map Visualization" - use Mapbox only for this type  
        const isMapChart = (
          chartOption?.chartType === 'Map Visualization' ||
          (chartOption?.mapStyle && chartOption?.center && chartOption?.markers) ||
          (chartOption?.title && chartOption.title.text === 'Map Visualization')
        );
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="w-full"
          >
            {isMapChart ? (
              <MapChart config={chartOption} />
            ) : (
              <Card className="w-full h-auto overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                        {chartOption.title?.text || `Skills Analysis Chart ${index + 1}`}
                      </h3>
                      {chartOption.title?.subtext && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-tight">
                          {chartOption.title.subtext}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        onClick={() => handleDownloadPDF(index)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Download as PDF"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleFullscreen(index)}
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 w-full">
                  <div 
                    className="w-full relative"
                    style={{ 
                      height: 'clamp(280px, 20vw + 200px, 420px)', // Dynamic height based on viewport
                      minHeight: '280px',
                      maxHeight: '420px'
                    }}
                  >
                    <ReactECharts
                      ref={(ref) => { chartRefs.current[index] = ref; }}
                      option={getResponsiveConfig(chartOption, index)}
                      style={{ 
                        height: '100%', 
                        width: '100%',
                        minHeight: '280px'
                      }}
                      opts={{ 
                        renderer: 'canvas',
                        locale: 'en',
                        devicePixelRatio: window.devicePixelRatio || 1
                      }}
                      onEvents={{
                        'finished': () => {
                          // Ensure proper sizing after chart finishes rendering
                          setTimeout(() => {
                            if (chartRefs.current[index]) {
                              const instance = chartRefs.current[index].getEchartsInstance();
                              if (instance) {
                                instance.resize();
                              }
                            }
                          }, 50);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        );
      })}
      
      <FullScreenChartModal
        isOpen={fullscreenChart.isOpen}
        onClose={() => setFullscreenChart({ isOpen: false, chartOption: null, title: '' })}
        chartOption={fullscreenChart.chartOption}
        chartTitle={fullscreenChart.title}
      />
    </motion.div>
  );
};

export default MultiChartDisplay;
