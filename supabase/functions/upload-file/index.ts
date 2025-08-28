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
  try {
    const textContent = new TextDecoder('utf-8', { fatal: false }).decode(content);
    
    // Remove null bytes and other problematic characters for PostgreSQL
    const sanitizedContent = textContent
      .replace(/\u0000/g, '') // Remove null bytes
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
      .trim();
    
    if (filename.toLowerCase().endsWith('.csv')) {
      return `CSV Data:\n${sanitizedContent}`;
    } else if (filename.toLowerCase().endsWith('.txt')) {
      return sanitizedContent;
    } else if (filename.toLowerCase().endsWith('.pdf')) {
      // For PDF files, provide basic metadata since we can't properly parse them
      return `PDF File: ${filename}\nSize: ${content.length} bytes\nUploaded for processing.`;
    } else {
      // For other file types, provide basic info and truncated content
      const truncatedContent = sanitizedContent.substring(0, 1000);
      return `File: ${filename}\nContent preview:\n${truncatedContent}${sanitizedContent.length > 1000 ? '...' : ''}`;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return `File: ${filename}\nSize: ${content.length} bytes\nContent extraction failed - file uploaded successfully.`;
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
          Authorization: authHeader
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
      return new Response(JSON.stringify({ 
        error: 'Failed to upload file',
        details: uploadError.message || 'Unknown storage error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('File uploaded successfully to storage:', uploadData);

    // Extract text content
    const content = new Uint8Array(fileBuffer);
    const extractedContent = extractTextFromFile(file.name, content);

    console.log('Extracted content length:', extractedContent.length);

    // Save file metadata to database using authenticated client
    const { data: fileData, error: dbError } = await userSupabase
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
      console.error('Full database error details:', JSON.stringify(dbError, null, 2));
      // Clean up uploaded file if database insert fails
      await userSupabase.storage.from('knowledge-base').remove([fileName]);
      return new Response(JSON.stringify({ 
        error: 'Failed to save file metadata',
        details: dbError.message || 'Unknown database error'
      }), {
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