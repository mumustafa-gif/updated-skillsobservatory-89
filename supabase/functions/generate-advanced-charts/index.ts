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
    const { 
      prompt, 
      numberOfCharts = 1, 
      chartTypes = ['auto'], 
      useKnowledgeBase = false, 
      knowledgeBaseFiles = [] 
    } = await req.json();
    
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
    if (useKnowledgeBase && knowledgeBaseFiles.length > 0) {
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

    // Generate charts
    const chartSystemPrompt = `You are an advanced chart generation assistant. Generate multiple charts based on user requirements.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "charts": [
    {
      // Valid ECharts option configuration for chart 1
    },
    {
      // Valid ECharts option configuration for chart 2
    }
    // ... more charts as needed
  ],
  "diagnostics": {
    "chartTypes": ["array of chart types used"],
    "dimensions": ["array of all dimensions across charts"],
    "notes": "string with assumptions made",
    "sources": ["array of source files used"]
  }
}

Requirements:
- Generate exactly ${numberOfCharts} chart${numberOfCharts > 1 ? 's' : ''}
- Chart types requested: ${chartTypes.join(', ')} (use 'auto' to select best type)
- Support: bar, line, pie, scatter, radar, area, gauge, funnel, sankey, treemap
- Include proper titles, tooltips, legends, and axis labels
- Use diverse, appealing color schemes
- Create realistic sample data if no data provided
- Make each chart unique and informative

${knowledgeBaseContext ? `Knowledge Base Context:\n${knowledgeBaseContext}` : ''}`;

    const chartResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: chartSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!chartResponse.ok) {
      console.error('OpenAI API error (charts):', await chartResponse.text());
      throw new Error('Failed to generate charts');
    }

    const chartData = await chartResponse.json();
    let parsedChartData;
    
    try {
      parsedChartData = JSON.parse(chartData.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse chart response:', chartData.choices[0].message.content);
      throw new Error('Invalid chart configuration generated');
    }

    // Generate data insights
    const insightSystemPrompt = `You are a data analysis expert. Based on the chart generation request, provide 5-10 bullet points explaining key insights and data patterns.

Return ONLY a JSON array of strings:
["insight 1", "insight 2", "insight 3", ...]

Focus on:
- Key trends and patterns
- Statistical significance
- Business implications
- Data quality observations
- Actionable recommendations`;

    const insightResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: insightSystemPrompt },
          { role: 'user', content: `Analyze this request: ${prompt}${knowledgeBaseContext ? '\n\nWith data from: ' + knowledgeBaseContext.slice(0, 1000) : ''}` }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    let insights = [];
    if (insightResponse.ok) {
      try {
        const insightData = await insightResponse.json();
        insights = JSON.parse(insightData.choices[0].message.content);
      } catch (error) {
        console.error('Failed to parse insights:', error);
      }
    }

    // Generate policy analysis with web search
    const policySystemPrompt = `You are a policy research expert with access to current regulations and policies. Based on the user's request, research and provide:

1. Current policies and regulations for the specific topic/industry mentioned
2. AI-suggested policy improvements and recommendations

Return ONLY a JSON object:
{
  "currentPolicies": ["policy 1", "policy 2", ...],
  "suggestedImprovements": ["suggestion 1", "suggestion 2", ...],
  "region": "detected region or 'Global'",
  "country": "detected country or 'Multiple'"
}

Use your knowledge of current policies, regulations, and best practices. Focus on actionable, specific policies rather than generic statements.`;

    const policyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: policySystemPrompt },
          { role: 'user', content: `Research policies for: ${prompt}` }
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });

    let policyData = null;
    if (policyResponse.ok) {
      try {
        const policyResponseData = await policyResponse.json();
        policyData = JSON.parse(policyResponseData.choices[0].message.content);
      } catch (error) {
        console.error('Failed to parse policy data:', error);
      }
    }

    // Save to chart history (save first chart for backwards compatibility)
    if (parsedChartData.charts && parsedChartData.charts.length > 0) {
      const { error: saveError } = await supabase
        .from('chart_history')
        .insert({
          user_id: user.id,
          prompt,
          chart_config: parsedChartData.charts[0],
          diagnostics: parsedChartData.diagnostics,
          chart_type: parsedChartData.diagnostics?.chartTypes?.[0] || 'unknown',
          knowledge_base_files: useKnowledgeBase ? knowledgeBaseFiles : []
        });

      if (saveError) {
        console.error('Failed to save chart history:', saveError);
      }
    }

    const result = {
      charts: parsedChartData.charts || [],
      diagnostics: parsedChartData.diagnostics || {},
      insights: insights || [],
      policyData: policyData
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-advanced-charts function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});