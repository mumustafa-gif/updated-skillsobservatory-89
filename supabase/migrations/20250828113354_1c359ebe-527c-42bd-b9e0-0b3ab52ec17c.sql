-- Create storage policies for knowledge-base bucket file uploads

-- Create policy for users to upload their own files
CREATE POLICY "Users can upload their own files to knowledge-base" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to view their own files
CREATE POLICY "Users can view their own files in knowledge-base" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to update their own files
CREATE POLICY "Users can update their own files in knowledge-base" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy for users to delete their own files
CREATE POLICY "Users can delete their own files in knowledge-base" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'knowledge-base' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);