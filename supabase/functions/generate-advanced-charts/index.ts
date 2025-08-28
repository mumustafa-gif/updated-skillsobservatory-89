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

    // Generate charts with improved prompt
    const chartSystemPrompt = `You are an expert chart generation assistant for UAE workforce skills analysis.

CRITICAL: You must return ONLY valid JSON with properly quoted property names. No code blocks, no explanations.

Return this exact JSON structure:
{
  "charts": [
    {
      "title": {"text": "Chart Title", "subtext": "Optional subtitle"},
      "tooltip": {"trigger": "item"},
      "legend": {"data": ["Series1", "Series2"], "orient": "horizontal"},
      "xAxis": {"type": "category", "data": ["Item1", "Item2", "Item3"]},
      "yAxis": {"type": "value", "name": "Value"},
      "series": [{"name": "Series1", "type": "bar", "data": [10, 20, 30]}]
    }
  ],
  "diagnostics": {
    "chartTypes": ["bar"],
    "dimensions": ["Skills", "Value"],
    "notes": "Analysis notes here",
    "sources": ["UAE Skills Data"]
  }
}

RULES:
- ALL property names must be in double quotes
- Generate exactly ${numberOfCharts} chart${numberOfCharts > 1 ? 's' : ''}
- Use realistic UAE workforce data (AI, healthcare, finance, tourism sectors)
- Chart types: bar, line, pie, area only
- Include proper UAE skills categories and employment sectors
- Make data relevant to Skills Observatory goals

${knowledgeBaseContext ? `Use this data context:\n${knowledgeBaseContext.slice(0, 800)}` : ''}`;

    const chartResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: chartSystemPrompt 
          },
          { 
            role: 'user', 
            content: `Generate ${numberOfCharts} workforce skills analysis chart${numberOfCharts > 1 ? 's' : ''} for: ${prompt}. Focus on UAE market data, skills mapping, and employment trends.` 
          }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!chartResponse.ok) {
      console.error('OpenAI API error (charts):', await chartResponse.text());
      throw new Error('Failed to generate charts');
    }

    const chartData = await chartResponse.json();
    let parsedChartData;
    
    try {
      const responseContent = chartData.choices[0].message.content.trim();
      console.log('Raw AI response length:', responseContent.length);
      console.log('First 200 chars:', responseContent.substring(0, 200));
      
      // Remove any markdown code blocks
      let cleanContent = responseContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '') // Remove anything before first {
        .replace(/[^}]*$/, ''); // Remove anything after last }
      
      // Fix common JSON issues
      cleanContent = cleanContent
        .replace(/(\w+)(\s*):/g, '"$1"$2:') // Quote unquoted keys
        .replace(/'/g, '"') // Replace single quotes
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' '); // Normalize spaces
      
      console.log('Cleaned content first 300 chars:', cleanContent.substring(0, 300));
      
      parsedChartData = JSON.parse(cleanContent);
      
      // Validate structure
      if (!parsedChartData.charts || !Array.isArray(parsedChartData.charts) || parsedChartData.charts.length === 0) {
        throw new Error('No valid charts found in response');
      }
      
      console.log('Successfully parsed', parsedChartData.charts.length, 'charts');
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed content:', chartData.choices[0].message.content);
      
      // Fallback: create a simple chart
      parsedChartData = {
        charts: [{
          title: { text: 'UAE Skills Analysis', subtext: 'Sample Data' },
          tooltip: { trigger: 'item' },
          legend: { data: ['Technical Skills', 'Soft Skills', 'Digital Skills'] },
          series: [{
            name: 'Skills Distribution',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 45, name: 'Technical Skills' },
              { value: 30, name: 'Soft Skills' },
              { value: 25, name: 'Digital Skills' }
            ]
          }]
        }],
        diagnostics: {
          chartTypes: ['pie'],
          dimensions: ['Skills Category'],
          notes: 'Fallback chart due to parsing error',
          sources: ['Generated']
        }
      };
    }

    // Generate data insights focused on skills and workforce
    const insightSystemPrompt = `You are a UAE workforce analytics expert. Based on the skills analysis request, provide exactly 5-6 bullet points explaining key insights and patterns.

Return ONLY a JSON array of strings:
["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"]

Focus on UAE-specific workforce insights:
- Skills gap analysis and market demand
- Employment trends in key sectors (tech, finance, healthcare, tourism)
- Education-to-employment pipeline effectiveness
- Emerging skills requirements for UAE Vision 2071
- Regional workforce development opportunities
- Strategic recommendations for policy makers`;

    const insightResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: insightSystemPrompt },
          { role: 'user', content: `Analyze UAE workforce skills for: ${prompt}${knowledgeBaseContext ? '\n\nWith data from: ' + knowledgeBaseContext.slice(0, 1000) : ''}` }
        ],
        max_completion_tokens: 1000,
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

    // Generate UAE-specific policy analysis
    const policySystemPrompt = `You are a UAE policy research expert specializing in workforce development and skills policies. Based on the user's request, provide UAE-specific analysis:

Return ONLY a JSON object:
{
  "currentPolicies": ["UAE policy 1", "UAE policy 2", "UAE policy 3", "UAE policy 4"],
  "suggestedImprovements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4"],
  "region": "UAE",
  "country": "United Arab Emirates"
}

Focus on actual UAE policies and initiatives such as:
- UAE Vision 2071 and workforce development goals
- Emirates Skills Framework initiatives
- National Skills Strategy implementation
- UAE Strategy for the Fourth Industrial Revolution
- Federal Authority for Government Human Resources policies
- Mohammed bin Rashid Centre for Leadership Development programs

Provide specific, actionable policy recommendations aligned with UAE's strategic vision.`;

    const policyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: policySystemPrompt },
          { role: 'user', content: `Research UAE workforce and skills policies for: ${prompt}` }
        ],
        max_completion_tokens: 1500,
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

    // Save to chart history with proper user context
    if (parsedChartData.charts && parsedChartData.charts.length > 0) {
      try {
        // Create authenticated client for database operations
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        });

        const { error: saveError } = await userSupabase
          .from('chart_history')
          .insert({
            user_id: user.id,
            prompt: prompt,
            chart_config: parsedChartData.charts[0],
            diagnostics: parsedChartData.diagnostics || {},
            chart_type: parsedChartData.diagnostics?.chartTypes?.[0] || 'unknown',
            knowledge_base_files: useKnowledgeBase ? knowledgeBaseFiles : []
          });

        if (saveError) {
          console.error('Failed to save chart history:', saveError);
          // Don't fail the request, just log the error
        } else {
          console.log('Successfully saved chart history');
        }
      } catch (historyError) {
        console.error('Error saving to history:', historyError);
        // Continue with response even if history save fails
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