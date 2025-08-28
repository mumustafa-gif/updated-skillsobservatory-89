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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageId, context } = await req.json();
    
    // Use static test user for prototyping
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Get knowledge base context
    const { data: files } = await supabase
      .from('knowledge_base_files')
      .select('original_filename, extracted_content')
      .eq('user_id', testUserId);
    
    const knowledgeBaseContext = files && files.length > 0 
      ? files.map(file => `File: ${file.original_filename}\nContent: ${file.extracted_content}`).join('\n\n')
      : '';

    const systemPrompt = `You are a chart generation specialist. Based on the conversation context, generate multiple relevant chart types that best represent the data.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "charts": [
    {
      "type": "bar",
      "title": "Chart Title",
      "option": {
        // Valid ECharts configuration
      },
      "description": "Brief explanation of what this chart shows"
    },
    {
      "type": "line",
      "title": "Chart Title", 
      "option": {
        // Valid ECharts configuration
      },
      "description": "Brief explanation of what this chart shows"
    }
  ],
  "insights": [
    "• Key insight 1",
    "• Key insight 2", 
    "• Key insight 3",
    "• Key insight 4",
    "• Key insight 5"
  ],
  "diagnostics": {
    "totalCharts": 3,
    "chartTypes": ["bar", "line", "pie"],
    "dataPoints": 100,
    "notes": "Assumptions and methodology"
  }
}

Generate 2-4 different chart types (bar, line, pie, scatter, radar) that best visualize the data.
Include realistic sample data if specific data isn't provided.
Ensure all charts are visually appealing with proper colors, titles, and legends.

${knowledgeBaseContext ? `Available Data:\n${knowledgeBaseContext}\n` : ''}

Context: ${JSON.stringify(context)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate multiple charts based on this context: ${JSON.stringify(context)}` }
        ],
        max_completion_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate charts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    let chartData;
    try {
      chartData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedContent);
      return new Response(JSON.stringify({ error: 'Invalid chart configuration generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save generated charts
    const { error: saveError } = await supabase
      .from('generated_content')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        content_type: 'charts',
        content: chartData,
        region_context: context.region || null
      });

    if (saveError) {
      console.error('Failed to save charts:', saveError);
    }

    return new Response(JSON.stringify(chartData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-multiple-charts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});