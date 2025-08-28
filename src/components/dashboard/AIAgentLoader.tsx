import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Brain, Database, BarChart3, Sparkles, Zap, Target, Lightbulb } from 'lucide-react';

interface AIAgentLoaderProps {
  visible: boolean;
}

const AIAgentLoader: React.FC<AIAgentLoaderProps> = ({ visible }) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [currentTask, setCurrentTask] = useState(0);

  const stages = [
    {
      icon: Database,
      title: "Data Analysis Agent",
      description: "Analyzing your data patterns and structures",
      tasks: [
        "Scanning data sources...",
        "Identifying key metrics...",
        "Detecting patterns...",
        "Analyzing correlations..."
      ],
      color: "hsl(var(--ai-primary))",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Brain,
      title: "Intelligence Processing Agent",
      description: "Processing insights and generating recommendations",
      tasks: [
        "Processing neural networks...",
        "Generating insights...",
        "Calculating predictions...",
        "Optimizing results..."
      ],
      color: "hsl(var(--ai-secondary))",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: BarChart3,
      title: "Visualization Agent",
      description: "Creating optimal chart configurations",
      tasks: [
        "Designing chart layouts...",
        "Optimizing visualizations...",
        "Configuring interactions...",
        "Finalizing presentations..."
      ],
      color: "hsl(var(--ai-accent))",
      gradient: "from-pink-500 to-pink-600"
    }
  ];

  useEffect(() => {
    if (!visible) return;

    const taskInterval = setInterval(() => {
      setCurrentTask(prev => {
        const nextTask = prev + 1;
        if (nextTask >= stages[currentStage].tasks.length) {
          setCurrentStage(prevStage => {
            const nextStage = prevStage + 1;
            if (nextStage >= stages.length) {
              return 0; // Reset to beginning
            }
            return nextStage;
          });
          return 0;
        }
        return nextTask;
      });
    }, 1500);

    return () => clearInterval(taskInterval);
  }, [visible, currentStage, stages]);

  if (!visible) return null;

  const currentStageData = stages[currentStage];
  const CurrentIcon = currentStageData.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl p-8 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="p-4 rounded-full bg-gradient-to-r from-primary to-secondary mr-4"
              >
                <Sparkles className="h-8 w-8 text-primary-foreground" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AI Agents Working
                </h2>
                <p className="text-muted-foreground mt-1">
                  Generating intelligent visualizations and insights
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              {stages.map((stage, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: currentStage === index ? 1.2 : currentStage > index ? 1 : 0.8,
                    opacity: currentStage >= index ? 1 : 0.3
                  }}
                  transition={{ duration: 0.3 }}
                  className={`p-3 rounded-full ${currentStage === index ? 'animate-ai-glow' : ''}`}
                  style={{
                    backgroundColor: currentStage >= index ? stage.color : 'hsl(var(--muted))',
                    color: currentStage >= index ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                >
                  <stage.icon className="h-5 w-5" />
                </motion.div>
              ))}
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStage + (currentTask / stages[currentStage].tasks.length)) / stages.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Current Agent */}
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-6 mb-6"
          >
            <div className="flex items-center mb-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 rounded-full mr-4"
                style={{ backgroundColor: currentStageData.color }}
              >
                <CurrentIcon className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-semibold">{currentStageData.title}</h3>
                <p className="text-muted-foreground">{currentStageData.description}</p>
              </div>
            </div>

            {/* Current Task */}
            <motion.div
              key={currentTask}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-3"
              />
              <span className="text-foreground font-medium">
                {currentStageData.tasks[currentTask]}
              </span>
            </motion.div>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="text-center p-4 rounded-lg bg-primary/10">
              <Target className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium">Smart Analytics</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/10">
              <Lightbulb className="h-6 w-6 text-secondary mx-auto mb-2" />
              <p className="text-sm font-medium">AI Insights</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-accent/10">
              <Zap className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-sm font-medium">Real-time Processing</p>
            </div>
          </motion.div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-20 h-20 bg-gradient-to-r from-primary/20 to-transparent rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, 50, 0],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + i * 10}%`
                }}
              />
            ))}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAgentLoader;