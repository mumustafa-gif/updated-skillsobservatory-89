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
    const { prompt, knowledgeBaseFiles = [] } = await req.json();
    
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

    // Get knowledge base content if files are specified
    let knowledgeBaseContext = '';
    if (knowledgeBaseFiles.length > 0) {
      const { data: files } = await supabase
        .from('knowledge_base_files')
        .select('original_filename, extracted_content')
        .in('id', knowledgeBaseFiles)
        .eq('user_id', user.id);
      
      if (files && files.length > 0) {
        knowledgeBaseContext = files.map(file => 
          `File: ${file.original_filename}\nContent: ${file.extracted_content}`
        ).join('\n\n');
      }
    }

    // Check if user is requesting map visualization
    const isMapRequest = prompt.toLowerCase().includes('map') || 
      prompt.toLowerCase().includes('geographic') || 
      prompt.toLowerCase().includes('location') ||
      prompt.toLowerCase().includes('region') ||
      prompt.toLowerCase().includes('spatial');

    // Create the system prompt for chart generation
    const systemPrompt = `You are a chart generation assistant. Generate valid Apache ECharts configuration JSON based on user prompts. 

${isMapRequest ? `
IMPORTANT: For geographic/map requests, return a Mapbox configuration with this exact structure:
{
  "option": {
    "chartType": "Map Visualization",
    "title": {"text": "Title", "subtext": "Subtitle"},
    "mapStyle": "mapbox://styles/mapbox/outdoors-v12",
    "center": [longitude, latitude],
    "zoom": number,
    "markers": [{"coordinates": [lng, lat], "title": "Name", "description": "Details", "color": "#color"}]
  },
  "diagnostics": {
    "chartType": "Map Visualization",
    "dimensions": ["Geographic", "Data Points"],
    "notes": "Generated map visualization with colorful terrain style",
    "sources": ["Geographic data sources"]
  }
}
` : `
IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "option": {
    // Valid ECharts option configuration
  },
  "diagnostics": {
    "chartType": "string",
    "dimensions": ["array of dimensions"],
    "notes": "string with assumptions made",
    "sources": ["array of source files used"]
  }
}

Supported chart types: bar, line, pie, scatter, radar, heatmap, treemap
`}
Always include proper titles, tooltips, legends, and axis labels.
Use appropriate colors and ensure the chart is visually appealing.
Make realistic sample data if no specific data is provided.

${knowledgeBaseContext ? `Knowledge Base Context:\n${knowledgeBaseContext}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate chart' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
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

    // Save to chart history
    const { error: saveError } = await supabase
      .from('chart_history')
      .insert({
        user_id: user.id,
        prompt,
        chart_config: chartData.option,
        diagnostics: chartData.diagnostics,
        chart_type: chartData.diagnostics?.chartType || 'unknown',
        knowledge_base_files: knowledgeBaseFiles
      });

    if (saveError) {
      console.error('Failed to save chart history:', saveError);
    }

    return new Response(JSON.stringify(chartData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-chart function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});