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
    const titleFontSize = isMobile ? 12 : isTablet ? 14 : 16;
    const legendFontSize = isMobile ? 9 : isTablet ? 10 : 11;

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

    return {
      ...chartOption,
      animation: false, // Disable animation for better performance
      
      // Grid configuration for proper spacing
      grid: {
        left: isMobile ? '12%' : '10%',
        right: isMobile ? '25%' : '22%',
        top: chartOption.title ? (isMobile ? '15%' : '12%') : (isMobile ? '8%' : '6%'),
        bottom: isMobile ? '25%' : '22%',
        containLabel: true,
        ...chartOption.grid
      },

      // Title configuration
      title: {
        ...chartOption.title,
        textStyle: {
          fontSize: titleFontSize,
          fontWeight: 'bold',
          color: '#1f2937',
          overflow: 'truncate',
          width: isMobile ? 200 : 300,
          ...chartOption.title?.textStyle
        },
        subtextStyle: {
          fontSize: baseFontSize,
          color: '#6b7280',
          overflow: 'truncate',
          width: isMobile ? 180 : 280,
          ...chartOption.title?.subtextStyle
        },
        left: 'center',
        top: 8
      },

      // Legend configuration - positioned at bottom right
      legend: {
        ...chartOption.legend,
        type: 'scroll',
        orient: 'vertical',
        right: isMobile ? 8 : 12,
        bottom: isMobile ? 8 : 12,
        itemWidth: isMobile ? 12 : 14,
        itemHeight: isMobile ? 8 : 10,
        itemGap: isMobile ? 6 : 8,
        textStyle: {
          fontSize: legendFontSize,
          color: '#374151',
          overflow: 'truncate',
          width: isMobile ? 60 : 80,
          ...chartOption.legend?.textStyle
        },
        pageIconColor: '#6b7280',
        pageIconInactiveColor: '#d1d5db',
        pageTextStyle: {
          fontSize: legendFontSize - 1,
          color: '#6b7280'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        borderRadius: 4,
        padding: [6, 8],
        shadowColor: 'rgba(0, 0, 0, 0.1)',
        shadowBlur: 4,
        shadowOffsetY: 2
      },

      // Tooltip configuration
      tooltip: {
        ...chartOption.tooltip,
        textStyle: {
          fontSize: baseFontSize,
          ...chartOption.tooltip?.textStyle
        },
        confine: true,
        position: function (point: number[], params: any, dom: any, rect: any, size: any) {
          const x = point[0] < size.viewSize[0] / 2 ? point[0] + 20 : point[0] - dom.offsetWidth - 20;
          const y = point[1] < size.viewSize[1] / 2 ? point[1] + 20 : point[1] - dom.offsetHeight - 20;
          return [Math.max(10, Math.min(x, size.viewSize[0] - dom.offsetWidth - 10)), 
                  Math.max(10, Math.min(y, size.viewSize[1] - dom.offsetHeight - 10))];
        }
      },

      // X-axis configuration
      xAxis: Array.isArray(chartOption.xAxis) 
        ? chartOption.xAxis.map(axis => ({
            ...axis,
            axisLabel: {
              fontSize: baseFontSize,
              rotate: isMobile && axis.data?.length > 4 ? 30 : 0,
              interval: isMobile ? 'auto' : 0,
              margin: 8,
              overflow: 'truncate',
              width: isMobile ? 60 : 80,
              color: '#6b7280',
              ...axis.axisLabel
            },
            nameTextStyle: {
              fontSize: baseFontSize,
              color: '#374151',
              ...axis.nameTextStyle
            },
            axisLine: {
              lineStyle: { color: '#e5e7eb' },
              ...axis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#e5e7eb' },
              ...axis.axisTick
            }
          }))
        : chartOption.xAxis ? {
            ...chartOption.xAxis,
            axisLabel: {
              fontSize: baseFontSize,
              rotate: isMobile && chartOption.xAxis.data?.length > 4 ? 30 : 0,
              interval: isMobile ? 'auto' : 0,
              margin: 8,
              overflow: 'truncate',
              width: isMobile ? 60 : 80,
              color: '#6b7280',
              ...chartOption.xAxis.axisLabel
            },
            nameTextStyle: {
              fontSize: baseFontSize,
              color: '#374151',
              ...chartOption.xAxis.nameTextStyle
            },
            axisLine: {
              lineStyle: { color: '#e5e7eb' },
              ...chartOption.xAxis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#e5e7eb' },
              ...chartOption.xAxis.axisTick
            }
          } : undefined,

      // Y-axis configuration
      yAxis: Array.isArray(chartOption.yAxis)
        ? chartOption.yAxis.map(axis => ({
            ...axis,
            axisLabel: {
              fontSize: baseFontSize,
              margin: 8,
              color: '#6b7280',
              ...axis.axisLabel
            },
            nameTextStyle: {
              fontSize: baseFontSize,
              color: '#374151',
              ...axis.nameTextStyle
            },
            axisLine: {
              lineStyle: { color: '#e5e7eb' },
              ...axis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#e5e7eb' },
              ...axis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f3f4f6' },
              ...axis.splitLine
            }
          }))
        : chartOption.yAxis ? {
            ...chartOption.yAxis,
            axisLabel: {
              fontSize: baseFontSize,
              margin: 8,
              color: '#6b7280',
              ...chartOption.yAxis.axisLabel
            },
            nameTextStyle: {
              fontSize: baseFontSize,
              color: '#374151',
              ...chartOption.yAxis.nameTextStyle
            },
            axisLine: {
              lineStyle: { color: '#e5e7eb' },
              ...chartOption.yAxis.axisLine
            },
            axisTick: {
              lineStyle: { color: '#e5e7eb' },
              ...chartOption.yAxis.axisTick
            },
            splitLine: {
              lineStyle: { color: '#f3f4f6' },
              ...chartOption.yAxis.splitLine
            }
          } : undefined,

      // Series label configuration
      series: Array.isArray(chartOption.series) 
        ? chartOption.series.map((serie: any) => ({
            ...serie,
            label: {
              fontSize: baseFontSize - 1,
              color: '#374151',
              ...serie.label
            },
            labelLine: {
              lineStyle: { color: '#d1d5db' },
              ...serie.labelLine
            }
          }))
        : chartOption.series ? [{
            ...chartOption.series,
            label: {
              fontSize: baseFontSize - 1,
              color: '#374151',
              ...chartOption.series.label
            }
          }] : []
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
        // Check if this is a map chart
        const isMapChart = chartOption.type === 'map' || chartOption.mapStyle || chartOption.markers;
        
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
