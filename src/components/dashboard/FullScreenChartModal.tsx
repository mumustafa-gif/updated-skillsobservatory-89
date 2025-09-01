import React, { useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  // Check if this is a map chart
  const isMapChart = chartOption?.mapStyle || chartOption?.center || chartOption?.markers || 
    (chartOption?.title && chartOption.title.text && chartOption.title.text.toLowerCase().includes('map'));

  // Enhanced configuration for fullscreen display
  const fullscreenConfig = {
    ...chartOption,
    animation: true,
    title: {
      ...chartOption.title,
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        ...chartOption.title?.textStyle
      },
      subtextStyle: {
        fontSize: 16,
        color: '#6b7280',
        ...chartOption.title?.subtextStyle
      },
      left: 'center',
      top: 20
    },
    grid: {
      left: '8%',
      right: '8%',
      top: '15%',
      bottom: '10%',
      containLabel: true,
      ...chartOption.grid
    },
    legend: {
      ...chartOption.legend,
      textStyle: {
        fontSize: 14,
        ...chartOption.legend?.textStyle
      },
      itemWidth: 20,
      itemHeight: 14,
      itemGap: 15
    },
    tooltip: {
      ...chartOption.tooltip,
      textStyle: {
        fontSize: 14,
        ...chartOption.tooltip?.textStyle
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
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
                height: '70vh', 
                width: '100%',
                minHeight: '500px'
              }}
              opts={{ 
                renderer: 'canvas',
                devicePixelRatio: window.devicePixelRatio || 2
              }}
            />
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenChartModal;