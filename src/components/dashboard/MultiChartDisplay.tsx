import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MultiChartDisplayProps {
  chartOptions: any[];
  loading: boolean;
}

const MultiChartDisplay: React.FC<MultiChartDisplayProps> = ({ chartOptions, loading }) => {
  const chartRefs = useRef<any[]>([]);

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
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 xl:grid-cols-2';
    if (count === 3) return 'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3';
    return 'grid-cols-1 lg:grid-cols-2';
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

    return {
      ...chartOption,
      animation: false, // Disable animation for better performance
      
      // Grid configuration for proper spacing (adjusted for bottom-right legend)
      grid: {
        left: isMobile ? '12%' : '10%',
        right: isMobile ? '25%' : '22%', // More space for bottom-right legend
        top: chartOption.title ? (isMobile ? '15%' : '12%') : (isMobile ? '8%' : '6%'), // Less top space since legend moved
        bottom: isMobile ? '25%' : '22%', // More bottom space for legend
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
          // Smart positioning to avoid overflow
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
      {chartOptions.map((chartOption, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="w-full"
        >
          <Card className="w-full h-auto overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4">
              <CardTitle className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                {chartOption.title?.text || `Skills Analysis Chart ${index + 1}`}
              </CardTitle>
              {chartOption.title?.subtext && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-tight">
                  {chartOption.title.subtext}
                </p>
              )}
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
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MultiChartDisplay;