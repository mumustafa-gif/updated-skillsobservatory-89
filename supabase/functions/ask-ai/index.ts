import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, generationResult, knowledgeFileIds = [] } = await req.json();
    
    console.log('Ask AI request:', { question, hasGenerationResult: !!generationResult, knowledgeFileIds });
    
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
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get knowledge base content if files are specified
    let knowledgeBaseContext = '';
    if (knowledgeFileIds.length > 0) {
      console.log('Fetching knowledge base files:', knowledgeFileIds);
      const { data: files } = await supabase
        .from('knowledge_base_files')
        .select('original_filename, extracted_content')
        .in('id', knowledgeFileIds)
        .eq('user_id', user.id);

      if (files && files.length > 0) {
        knowledgeBaseContext = files.map(file => 
          `**${file.original_filename}:**\n${file.extracted_content}`
        ).join('\n\n');
        console.log('Knowledge base context length:', knowledgeBaseContext.length);
      }
    }

    // Prepare context from generation result
    let analysisContext = '';
    if (generationResult) {
      const { detailedReport, charts, insights } = generationResult;
      
      if (detailedReport) {
        analysisContext += `**Analysis Report:**\n`;
        if (detailedReport.overview) analysisContext += `Overview: ${detailedReport.overview}\n\n`;
        if (detailedReport.report) analysisContext += `Main Report: ${detailedReport.report}\n\n`;
        if (detailedReport.currentPolicies) analysisContext += `Current Policies: ${detailedReport.currentPolicies}\n\n`;
        if (detailedReport.aiSuggestions) analysisContext += `AI Suggestions: ${detailedReport.aiSuggestions}\n\n`;
        if (detailedReport.dataSources) analysisContext += `Data Sources: ${detailedReport.dataSources}\n\n`;
      }
      
      if (charts && charts.length > 0) {
        analysisContext += `**Generated Charts:**\n`;
        charts.forEach((chart: any, index: number) => {
          analysisContext += `Chart ${index + 1}: ${chart.title || 'Untitled'}\n`;
          if (chart.diagnostics?.notes) {
            analysisContext += `Notes: ${chart.diagnostics.notes}\n`;
          }
        });
        analysisContext += '\n';
      }
      
      if (insights) {
        analysisContext += `**Key Insights:**\n${JSON.stringify(insights, null, 2)}\n\n`;
      }
    }

    console.log('Analysis context length:', analysisContext.length);

    // Build the system prompt
    const systemPrompt = `You are an AI assistant specializing in UAE workforce development, labor market analysis, and policy research. You have access to:

1. **Current Analysis Results**: Recent data analysis and insights about UAE workforce, labor market trends, skills gaps, and policy recommendations.

2. **Knowledge Base**: Official UAE government documents, policies, and reports related to workforce development, labor laws, and strategic initiatives.

**Your Role:**
- Provide accurate, well-informed answers based on the available context
- Reference specific data points, insights, or policy documents when relevant
- Offer actionable recommendations aligned with UAE's strategic vision
- Maintain a professional, analytical tone
- When uncertain, clearly state limitations rather than speculating

**Guidelines:**
- Always ground your responses in the provided context
- Cite specific sources or data points when available
- Be concise but comprehensive
- Focus on UAE-specific insights and recommendations
- If the question cannot be answered from the available context, say so clearly

Available Context:
${analysisContext}

${knowledgeBaseContext ? `Knowledge Base Content:\n${knowledgeBaseContext}` : ''}`;

    // Make the OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_completion_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const answer = data.choices[0]?.message?.content || 'I apologize, but I could not generate a response to your question.';

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-ai function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});