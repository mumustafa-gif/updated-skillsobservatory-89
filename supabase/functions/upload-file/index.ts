import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple text extraction for different file types
function extractTextFromFile(filename: string, content: Uint8Array): string {
  const textContent = new TextDecoder().decode(content);
  
  // For now, we'll do simple text extraction
  // In a production app, you'd use proper parsers for PDF, DOCX, etc.
  
  if (filename.toLowerCase().endsWith('.csv')) {
    return `CSV Data:\n${textContent}`;
  } else if (filename.toLowerCase().endsWith('.txt')) {
    return textContent;
  } else {
    // For other file types, we'll just return the raw text content
    // In production, you'd integrate proper parsers
    return `File content (${filename}):\n${textContent.substring(0, 5000)}...`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    
    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    
    console.log('Attempting to upload file:', {
      fileName,
      userId: user.id,
      bucketId: 'knowledge-base',
      fileSize: file.size,
      contentType: file.type
    });
    
    // Create a new supabase client with the user's token for proper RLS
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: uploadData, error: uploadError } = await userSupabase.storage
      .from('knowledge-base')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      console.error('Full error details:', JSON.stringify(uploadError, null, 2));
      return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract text content
    const content = new Uint8Array(fileBuffer);
    const extractedContent = extractTextFromFile(file.name, content);

    // Save file metadata to database
    const { data: fileData, error: dbError } = await supabase
      .from('knowledge_base_files')
      .insert({
        user_id: user.id,
        filename: fileName,
        original_filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        extracted_content: extractedContent,
        storage_path: uploadData.path
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('knowledge-base').remove([fileName]);
      return new Response(JSON.stringify({ error: 'Failed to save file metadata' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      file: fileData,
      message: 'File uploaded successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in upload-file function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});