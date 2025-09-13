import React, { useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { Dialog, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { downloadChartAsPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';
import MapChart from './MapChart';

interface FullScreenChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartOption: any;
  chartTitle?: string;
}

const FullScreenChartModal: React.FC<FullScreenChartModalProps> = ({
  isOpen,
  onClose,
  chartOption,
  chartTitle = 'Chart'
}) => {
  const chartRef = useRef<any>(null);

  const handleDownloadPDF = async () => {
    try {
      const chartContainer = chartRef.current?.ele;
      if (!chartContainer) {
        toast.error('Chart not ready for download');
        return;
      }

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

  // Check if this is a map chart - only for actual "Map Visualization" charts
  const isMapChart = (
    chartOption?.chartType === 'Map Visualization' ||
    (chartOption?.mapStyle && chartOption?.center && chartOption?.markers) ||
    (chartOption?.title && chartOption.title.text && chartOption.title.text === 'Map Visualization')
  );

  // Enhanced configuration for fullscreen display with professional styling
  const fullscreenConfig = useMemo(() => {
    if (!chartOption) return {};
    
    // Professional color palette for UAE Ministry
    const professionalColors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#2E8B57', '#FF6347', '#4682B4', '#DAA520', '#9932CC'
    ];

    // Heatmap color gradients
    const heatmapColors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
    const treemapColors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896'];

    const config = { ...chartOption };

    // Enhanced series styling
    if (config.series && Array.isArray(config.series)) {
      config.series = config.series.map((series: any, index: number) => {
        const baseColor = professionalColors[index % professionalColors.length];
        
        // Chart type specific enhancements
        switch (series.type) {
          case 'bar':
            return {
              ...series,
              barWidth: '75%',
              barMaxWidth: 50,
              itemStyle: {
                color: baseColor,
                borderRadius: [6, 6, 0, 0],
                ...series.itemStyle
              },
              label: {
                show: true,
                position: 'top',
                fontSize: 13,
                color: '#333',
                fontWeight: 'bold',
                formatter: function(params: any) {
                  if (typeof params.value === 'number') {
                    // For bar charts, show actual values, not percentages
                    if (params.value >= 1000) {
                      return (params.value / 1000).toFixed(1) + 'K';
                    }
                    return params.value.toLocaleString();
                  }
                  return params.value;
                },
                ...series.label
              }
            };
            
          case 'line':
            return {
              ...series,
              lineStyle: {
                color: baseColor,
                width: 4,
                ...series.lineStyle
              },
              itemStyle: {
                color: baseColor,
                borderColor: '#fff',
                borderWidth: 3,
                ...series.itemStyle
              },
              symbol: 'circle',
              symbolSize: 8,
              label: {
                show: false,
                fontSize: 13,
                color: '#333',
                ...series.label
              }
            };
            
          case 'pie':
            return {
              ...series,
              radius: ['35%', '70%'],
              center: ['50%', '50%'],
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 3
              },
              label: {
                show: true,
                formatter: '{b}: {d}%',
                fontSize: 14,
                color: '#333',
                fontWeight: 'bold'
              },
              labelLine: {
                show: true,
                length: 20,
                length2: 10
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
                borderWidth: 2
              },
              label: {
                show: true,
                fontSize: 13,
                color: '#000',
                fontWeight: 'bold',
                formatter: function(params: any) {
                  const value = params.value[2] || params.value;
                  if (typeof value === 'number') {
                    // Show high/medium/low instead of percentages
                    if (value >= 80) return 'High';
                    if (value >= 50) return 'Medium';
                    return 'Low';
                  }
                  return value;
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
                    borderWidth: 3,
                    gapWidth: 3
                  }
                },
                {
                  colorSaturation: [0.3, 0.6],
                  itemStyle: {
                    borderColorSaturation: 0.7,
                    gapWidth: 2,
                    borderWidth: 3
                  }
                }
              ],
              label: {
                show: true,
                fontSize: 13,
                fontWeight: 'bold',
                color: '#000',
                formatter: function(params: any) {
                  const percentage = ((params.value / params.treeAncestors?.[0]?.value || 1) * 100).toFixed(1);
                  return `${params.name}\n${percentage}%\n(${params.value})`;
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
                return Math.max(10, Math.min(30, Math.sqrt((data[2] || 10) * 2)));
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
      animationDuration: 1000,
      animationEasing: 'cubicOut',
      responsive: true,
      
      // Enhanced color configuration
      color: professionalColors,
      
      // Enhanced title styling for fullscreen
      title: config.title ? {
        ...config.title,
        textStyle: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1a1a1a',
          ...config.title.textStyle
        },
        subtextStyle: {
          fontSize: 18,
          color: '#666',
          ...config.title.subtextStyle
        },
        left: 'center',
        top: 20
      } : undefined,
      
      // Professional tooltip styling
      tooltip: {
        trigger: config.tooltip?.trigger || (config.series?.[0]?.type === 'pie' ? 'item' : 'axis'),
        backgroundColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        textStyle: { 
          color: '#333',
          fontSize: 14,
          fontWeight: 400
        },
        formatter: function(params: any) {
          // Special handling for heatmaps - show only the hovered cell
          if (config.series?.[0]?.type === 'heatmap') {
            if (Array.isArray(params)) {
              const param = params[0];
              const value = Array.isArray(param.value) ? param.value[2] : param.value;
              const xAxisData = config.xAxis?.data || [];
              const yAxisData = config.yAxis?.data || [];
              const xIndex = Array.isArray(param.value) ? param.value[0] : param.dataIndex;
              const yIndex = Array.isArray(param.value) ? param.value[1] : param.seriesIndex;
              const xLabel = xAxisData[xIndex] || `Category ${xIndex}`;
              const yLabel = yAxisData[yIndex] || `Series ${yIndex}`;
              return `<strong>${yLabel}</strong><br/><span style="color:${param.color}">●</span> ${xLabel}: <strong>${value}</strong>`;
            } else {
              const value = Array.isArray(params.value) ? params.value[2] : params.value;
              const xAxisData = config.xAxis?.data || [];
              const yAxisData = config.yAxis?.data || [];
              const xIndex = Array.isArray(params.value) ? params.value[0] : params.dataIndex;
              const yIndex = Array.isArray(params.value) ? params.value[1] : params.seriesIndex;
              const xLabel = xAxisData[xIndex] || `Category ${xIndex}`;
              const yLabel = yAxisData[yIndex] || `Series ${yIndex}`;
              return `<strong>${yLabel}</strong><br/><span style="color:${params.color}">●</span> ${xLabel}: <strong>${value}</strong>`;
            }
          }
          
          // Special handling for radar charts - show only the hovered point
          if (config.series?.[0]?.type === 'radar') {
            if (Array.isArray(params)) {
              // For radar charts, show only the first (hovered) point
              const param = params[0];
              const value = typeof param.value === 'number' ? param.value.toLocaleString() : param.value;
              return `<strong>${param.name}</strong><br/><span style="color:${param.color}">●</span> ${param.seriesName}: <strong>${value}</strong>`;
            } else {
              const value = typeof params.value === 'number' ? params.value.toLocaleString() : params.value;
              return `<strong>${params.name}</strong><br/><span style="color:${params.color}">●</span> ${params.seriesName}: <strong>${value}</strong>`;
            }
          }
          
          // Default handling for other chart types
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
        extraCssText: 'box-shadow: 0 6px 16px rgba(0,0,0,0.15); border-radius: 10px;',
        ...config.tooltip
      },
      
      // Enhanced legend styling positioned at bottom right with percentage info
      legend: config.legend !== false ? {
        show: true,
        type: 'scroll',
        orient: 'horizontal',
        right: '3%',
        bottom: '3%',
        itemWidth: 22,
        itemHeight: 18,
        itemGap: 22,
        textStyle: {
          color: '#333',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 18
        },
        formatter: function(name: string) {
          // Enhanced legend with percentage information where available
          if (name.includes('(')) {
            return name;
          }
          // Truncate long names to prevent overlap
          if (name.length > 25) {
            return name.substring(0, 22) + '...';
          }
          return name;
        },
        pageButtonItemGap: 14,
        pageButtonGap: 22,
        pageTextStyle: {
          color: '#666',
          fontSize: 12,
          fontWeight: 500
        },
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 10,
        padding: [12, 16],
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowBlur: 10,
        shadowOffsetY: 3,
        // Ensure legend doesn't overlap with chart content
        width: 'auto',
        height: 'auto',
        ...config.legend
      } : false,
      
      // Responsive grid styling with space for bottom-right legend
      grid: {
        left: '10%',
        right: config.legend !== false && config.legend?.show !== false ? '12%' : '10%',
        bottom: config.series?.[0]?.type === 'heatmap' ? '32%' : (config.legend !== false && config.legend?.show !== false ? '26%' : '18%'),
        top: config.title ? '28%' : '20%',
        containLabel: true,
        ...config.grid
      },
      
      // Enhanced X-axis styling
      xAxis: Array.isArray(config.xAxis) ? config.xAxis.map((axis: any) => ({
        ...axis,
        name: axis.name || (axis.type === 'category' ? 'Categories' : 'X Values'),
        nameLocation: 'start',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333',
          ...axis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...axis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 13,
          fontWeight: 500,
          rotate: axis.axisLabel?.rotate || 0,
          formatter: axis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'string' && value.length > 15) {
              return value.substring(0, 15) + '...';
            }
            return value;
          },
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed', width: 1 },
          ...axis.splitLine
        }
      })) : config.xAxis ? {
        ...config.xAxis,
        name: config.xAxis.name || (config.xAxis.type === 'category' ? 'Categories' : 'X Values'),
        nameLocation: 'start',
        nameGap: 35,
        nameTextStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333',
          ...config.xAxis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...config.xAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...config.xAxis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 13,
          fontWeight: 500,
          rotate: config.xAxis.axisLabel?.rotate || 0,
          formatter: config.xAxis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'string' && value.length > 15) {
              return value.substring(0, 15) + '...';
            }
            return value;
          },
          ...config.xAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed', width: 1 },
          ...config.xAxis.splitLine
        }
      } : undefined,
      
      // Enhanced Y-axis styling
      yAxis: Array.isArray(config.yAxis) ? config.yAxis.map((axis: any) => ({
        ...axis,
        name: axis.name || (axis.type === 'value' ? 'Values' : 'Categories'),
        nameLocation: 'start',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333',
          ...axis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...axis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...axis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 13,
          fontWeight: 500,
          formatter: axis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'number') {
              return value.toFixed(1) + '%';
            }
            return value;
          },
          ...axis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed', width: 1 },
          ...axis.splitLine
        }
      })) : config.yAxis ? {
        ...config.yAxis,
        name: config.yAxis.name || (config.yAxis.type === 'value' ? 'Values' : 'Categories'),
        nameLocation: 'start',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333',
          ...config.yAxis.nameTextStyle
        },
        axisLine: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...config.yAxis.axisLine
        },
        axisTick: { 
          lineStyle: { color: '#ddd', width: 2 },
          ...config.yAxis.axisTick
        },
        axisLabel: { 
          color: '#666',
          fontSize: 13,
          fontWeight: 500,
          formatter: config.yAxis.axisLabel?.formatter || function(value: any) {
            if (typeof value === 'number') {
              return value.toFixed(1) + '%';
            }
            return value;
          },
          ...config.yAxis.axisLabel
        },
        splitLine: {
          lineStyle: { color: '#f5f5f5', type: 'dashed', width: 1 },
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
        bottom: '8%',
        inRange: {
          color: heatmapColors
        },
        textStyle: {
          color: '#333',
          fontSize: 13,
          fontWeight: 500
        },
        ...config.visualMap
      } : config.series?.[0]?.type === 'heatmap' ? {
        type: 'continuous',
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '8%',
        inRange: {
          color: heatmapColors
        },
        textStyle: {
          color: '#333',
          fontSize: 13,
          fontWeight: 500
        }
      } : undefined
    };
  }, [chartOption]);

  // Custom DialogContent without automatic close button
  const CustomDialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  ));
  CustomDialogContent.displayName = "CustomDialogContent";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <CustomDialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{chartTitle}</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-6 pt-4"
          ref={chartRef}
        >
          {isMapChart ? (
            <div className="w-full h-[70vh]">
              <MapChart 
                config={chartOption}
                loading={false}
              />
            </div>
          ) : (
            <ReactECharts
              option={fullscreenConfig}
              style={{ 
                height: '75vh', 
                width: '100%',
                minHeight: '600px'
              }}
              opts={{ 
                renderer: 'canvas',
                devicePixelRatio: window.devicePixelRatio || 2
              }}
            />
          )}
        </motion.div>
      </CustomDialogContent>
    </Dialog>
  );
};

export default FullScreenChartModal;