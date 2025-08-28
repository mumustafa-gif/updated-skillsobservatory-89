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
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="h-[400px]">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
              />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!chartOptions || chartOptions.length === 0) {
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
            <p className="text-lg font-medium text-muted-foreground mb-2">No Charts Generated</p>
            <p className="text-sm text-muted-foreground">
              Configure your charts and click generate to create visualizations
            </p>
          </div>
        </CardContent>
      </Card>
    );
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