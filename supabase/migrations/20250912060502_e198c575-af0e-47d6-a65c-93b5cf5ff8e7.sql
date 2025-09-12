-- Add persona enum type
CREATE TYPE public.persona_type AS ENUM ('minister', 'chro', 'educationist');

-- Add persona column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN selected_persona persona_type DEFAULT 'minister';

-- Create index for better performance
CREATE INDEX idx_profiles_selected_persona ON public.profiles(selected_persona);