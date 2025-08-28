import React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MultiChartDisplayProps {
  chartOptions: any[];
  loading: boolean;
}

const MultiChartDisplay: React.FC<MultiChartDisplayProps> = ({ chartOptions, loading }) => {
  if (loading) {
    return null; // Don't show anything while loading - AIAgentLoader handles this
  }

  if (!chartOptions || chartOptions.length === 0) {
    return null; // Don't show empty state until user generates first chart
  }

  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 lg:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`grid ${getGridCols(chartOptions.length)} gap-4 sm:gap-6 w-full`}
    >
      {chartOptions.map((chartOption, index) => (
        <Card key={index} className="w-full overflow-hidden">
          <CardHeader className="pb-3 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg font-semibold truncate">
              {chartOption.title?.text || `Skills Analysis Chart ${index + 1}`}
            </CardTitle>
            {chartOption.title?.subtext && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                {chartOption.title.subtext}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6">
            <div className="w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] relative">
              <ReactECharts
                option={{
                  ...chartOption,
                  // Ensure responsive behavior
                  grid: {
                    left: '8%',
                    right: '8%',
                    top: '15%',
                    bottom: '15%',
                    containLabel: true,
                    ...chartOption.grid
                  },
                  // Responsive text sizing
                  title: {
                    ...chartOption.title,
                    textStyle: {
                      fontSize: 14,
                      fontWeight: 'bold',
                      ...chartOption.title?.textStyle
                    },
                    subtextStyle: {
                      fontSize: 12,
                      ...chartOption.title?.subtextStyle
                    }
                  },
                  // Responsive legend
                  legend: {
                    ...chartOption.legend,
                    textStyle: {
                      fontSize: 11,
                      ...chartOption.legend?.textStyle
                    },
                    orient: chartOptions.length > 2 ? 'horizontal' : (chartOption.legend?.orient || 'horizontal'),
                    bottom: chartOptions.length > 2 ? 0 : (chartOption.legend?.bottom || 'auto'),
                    left: chartOptions.length > 2 ? 'center' : (chartOption.legend?.left || 'auto')
                  },
                  // Responsive tooltip
                  tooltip: {
                    ...chartOption.tooltip,
                    textStyle: {
                      fontSize: 11,
                      ...chartOption.tooltip?.textStyle
                    },
                    confine: true,
                    appendToBody: true
                  },
                  // Responsive axis labels
                  xAxis: Array.isArray(chartOption.xAxis) 
                    ? chartOption.xAxis.map(axis => ({
                        ...axis,
                        axisLabel: {
                          fontSize: 10,
                          rotate: chartOptions.length > 2 ? 45 : 0,
                          interval: 'auto',
                          ...axis.axisLabel
                        },
                        nameTextStyle: {
                          fontSize: 11,
                          ...axis.nameTextStyle
                        }
                      }))
                    : chartOption.xAxis ? {
                        ...chartOption.xAxis,
                        axisLabel: {
                          fontSize: 10,
                          rotate: chartOptions.length > 2 ? 45 : 0,
                          interval: 'auto',
                          ...chartOption.xAxis.axisLabel
                        },
                        nameTextStyle: {
                          fontSize: 11,
                          ...chartOption.xAxis.nameTextStyle
                        }
                      } : undefined,
                  yAxis: Array.isArray(chartOption.yAxis)
                    ? chartOption.yAxis.map(axis => ({
                        ...axis,
                        axisLabel: {
                          fontSize: 10,
                          ...axis.axisLabel
                        },
                        nameTextStyle: {
                          fontSize: 11,
                          ...axis.nameTextStyle
                        }
                      }))
                    : chartOption.yAxis ? {
                        ...chartOption.yAxis,
                        axisLabel: {
                          fontSize: 10,
                          ...chartOption.yAxis.axisLabel
                        },
                        nameTextStyle: {
                          fontSize: 11,
                          ...chartOption.yAxis.nameTextStyle
                        }
                      } : undefined
                }}
                style={{ 
                  height: '100%', 
                  width: '100%',
                  minHeight: '300px'
                }}
                opts={{ 
                  renderer: 'canvas',
                  locale: 'en'
                }}
                onEvents={{
                  'finished': () => {
                    // Ensure chart is properly resized after rendering
                    setTimeout(() => {
                      window.dispatchEvent(new Event('resize'));
                    }, 100);
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default MultiChartDisplay;