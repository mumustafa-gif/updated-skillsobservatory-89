-- Create chart_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chart_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  chart_config JSONB NOT NULL,
  diagnostics JSONB,
  chart_type TEXT NOT NULL DEFAULT 'unknown',
  knowledge_base_files UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chart_history ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_history
CREATE POLICY "Users can view their own chart history" 
ON public.chart_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chart history" 
ON public.chart_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chart history" 
ON public.chart_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart history" 
ON public.chart_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chart_history_updated_at
BEFORE UPDATE ON public.chart_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();