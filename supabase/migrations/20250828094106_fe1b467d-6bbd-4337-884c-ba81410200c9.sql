-- Create tables for the chart generation application

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create knowledge_base_files table for uploaded files
CREATE TABLE public.knowledge_base_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  extracted_content TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on knowledge_base_files
ALTER TABLE public.knowledge_base_files ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_base_files
CREATE POLICY "Users can view their own files" 
ON public.knowledge_base_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own files" 
ON public.knowledge_base_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" 
ON public.knowledge_base_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" 
ON public.knowledge_base_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create chart_history table for storing generated charts
CREATE TABLE public.chart_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  chart_config JSONB NOT NULL,
  diagnostics JSONB,
  chart_type TEXT,
  knowledge_base_files UUID[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on chart_history
ALTER TABLE public.chart_history ENABLE ROW LEVEL SECURITY;

-- Create policies for chart_history
CREATE POLICY "Users can view their own chart history" 
ON public.chart_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chart history" 
ON public.chart_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chart history" 
ON public.chart_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-base', 'knowledge-base', false);

-- Create storage policies for knowledge base files
CREATE POLICY "Users can view their own knowledge base files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own knowledge base files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own knowledge base files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own knowledge base files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'knowledge-base' AND auth.uid()::text = (storage.foldername(name))[1]);