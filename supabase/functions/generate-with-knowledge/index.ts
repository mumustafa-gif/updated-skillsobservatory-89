import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { prompt, useKnowledgeBase = false } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let contextData = '';
    
    // If knowledge base is enabled, fetch user's files
    if (useKnowledgeBase) {
      console.log('Fetching knowledge base files for user:', user.id);
      
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      });

      const { data: files, error: filesError } = await userSupabase
        .from('knowledge_base_files')
        .select('original_filename, extracted_content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Limit to avoid token limits

      if (filesError) {
        console.error('Error fetching knowledge base files:', filesError);
        return new Response(JSON.stringify({ error: 'Failed to fetch knowledge base files' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (files && files.length > 0) {
        contextData = files
          .filter(file => file.extracted_content)
          .map(file => `File: ${file.original_filename}\nContent: ${file.extracted_content}`)
          .join('\n\n---\n\n');
        
        console.log(`Found ${files.length} knowledge base files, using ${contextData.length} characters of context`);
      }
    }

    // Prepare the system message with context
    const systemMessage = contextData 
      ? `You are a helpful AI assistant. Use the following knowledge base content to provide accurate and relevant responses. If the user's question can be answered using the knowledge base content, prioritize that information. If not, provide general assistance.

Knowledge Base Content:
${contextData}

Instructions:
- Use the knowledge base content when relevant to the user's question
- Cite specific files when referencing information from the knowledge base
- If the knowledge base doesn't contain relevant information, provide general assistance
- Be clear about when you're using knowledge base information vs. general knowledge`
      : 'You are a helpful AI assistant. Provide accurate and helpful responses to user questions.';

    console.log('Sending request to OpenAI with prompt length:', prompt.length, 'and context length:', contextData.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to generate response from OpenAI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Generated response length:', generatedText.length);

    return new Response(JSON.stringify({ 
      generatedText,
      usedKnowledgeBase: useKnowledgeBase,
      knowledgeBaseFilesCount: useKnowledgeBase ? (contextData ? contextData.split('---').length : 0) : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-with-knowledge function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});