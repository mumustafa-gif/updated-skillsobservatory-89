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
          file.extracted_content
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
    const systemPrompt = `You are an AI assistant specializing in UAE workforce development, labor market analysis, and policy research. You have access to current analysis results and official UAE government documents.

**CRITICAL FORMATTING REQUIREMENTS:**
- Always use clear headings (## Main Heading) and subheadings (### Sub Heading)
- Keep responses SHORT and CONCISE (3-5 bullet points maximum per section)
- Use bullet points (•) for all key information
- Structure every response with these sections when relevant:
  ## Key Insights
  ## Recommendations  
  ## Current Status
  ## Next Steps

**Response Style Guidelines:**
- Maximum 150 words total
- Use bullet points for ALL content
- Each bullet point should be 1-2 lines maximum
- Include specific numbers/percentages when available
- End with 1-2 actionable next steps

**Example Format:**
## Key Insights
• UAE workforce shows 65% skill gap in technology sectors
• Current policies focus on Emiratization targets of 10% by 2026

## Recommendations
• Implement targeted reskilling programs for emerging technologies
• Strengthen partnerships between education and industry

## Next Steps
• Review existing training curricula
• Establish industry-specific skill assessments

Available Context:
${analysisContext}

${knowledgeBaseContext ? `Knowledge Base Content:\n${knowledgeBaseContext}` : ''}`;

    // Make the OpenAI API call with streaming
    console.log('Making OpenAI API request...');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    const requestBody = {
      model: 'gpt-5-2025-08-07',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      max_completion_tokens: 1500,
      stream: true,
    };

    console.log('Request payload:', { 
      model: requestBody.model, 
      messageCount: requestBody.messages.length,
      systemPromptLength: systemPrompt.length,
      questionLength: question.length 
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('OpenAI API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('OpenAI API error response:', errorText);
      } catch (e) {
        console.error('Failed to read error response:', e);
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    // Return streaming response with proper headers to prevent buffering
    const readable = new ReadableStream({
      async start(controller) {
        let isClosed = false;
        const encoder = new TextEncoder();
        let contentReceived = false;
        
        // Send heartbeat to prevent proxy buffering
        const heartbeat = () => {
          if (!isClosed) {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        };
        
        const heartbeatInterval = setInterval(heartbeat, 30000); // Every 30 seconds
        
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            console.error('No response reader available');
            clearInterval(heartbeatInterval);
            if (!isClosed) {
              controller.error(new Error('No response reader'));
            }
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';
          console.log('Starting to read streaming response...');

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream completed. Content received:', contentReceived);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  console.log('Received [DONE] signal');
                  clearInterval(heartbeatInterval);
                  if (!isClosed) {
                    isClosed = true;
                    controller.close();
                  }
                  return;
                }

                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content && !isClosed) {
                      contentReceived = true;
                      const responseData = `data: ${JSON.stringify({ content })}\n\n`;
                      controller.enqueue(encoder.encode(responseData));
                    }
                  } catch (parseError) {
                    console.log('Parse error for line:', line, 'Error:', parseError);
                    // Skip invalid JSON - this is normal for SSE streams
                  }
                }
              }
            }
          }
          
          console.log('Stream processing completed normally');
          clearInterval(heartbeatInterval);
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        } catch (streamError) {
          clearInterval(heartbeatInterval);
          console.error('Stream processing error:', streamError);
          if (!isClosed) {
            isClosed = true;
            controller.error(streamError);
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
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