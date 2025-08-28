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
    if (count === 3) return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3';
    return 'grid-cols-1 lg:grid-cols-2';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`grid ${getGridCols(chartOptions.length)} gap-6`}
    >
      {chartOptions.map((chartOption, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Chart {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ReactECharts
              option={chartOption}
              style={{ height: '400px', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

export default MultiChartDisplay;