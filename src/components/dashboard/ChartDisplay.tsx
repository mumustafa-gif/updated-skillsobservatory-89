import React from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapChart from './MapChart';

interface ChartDisplayProps {
  chartOption: any;
  loading: boolean;
}

const ChartDisplay: React.FC<ChartDisplayProps> = ({ chartOption, loading }) => {
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

  // Check if this is a map chart
  if (chartOption.type === 'map' || chartOption.mapStyle) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <MapChart config={chartOption} loading={loading} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Generated Chart</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ReactECharts
            option={chartOption}
            style={{ height: '500px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ChartDisplay;