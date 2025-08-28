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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, currentChartConfig, chartIndex } = await req.json();
    
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

    const systemPrompt = `You are an expert ECharts configuration customizer. Based on user's natural language request, modify the provided chart configuration.

CRITICAL: Return ONLY valid JSON with the modified chart configuration. No explanations, no code blocks.

Common customization types:
1. Color changes: "Use red and blue colors" → Update series colors, bar colors, line colors
2. Data removal: "Remove X data" → Filter out specific data points
3. Chart type changes: "Make it a pie chart" → Change chart type
4. Style modifications: "Make bars thicker", "Add grid lines"
5. Legend/title changes: "Change title to X", "Remove legend"

Current chart config: ${JSON.stringify(currentChartConfig)}

Return the modified chart configuration as valid JSON that ECharts can directly use.

Examples of color modifications:
- For bar charts: Update series[].itemStyle.color or use color array
- For line charts: Update series[].lineStyle.color and series[].itemStyle.color
- For pie charts: Update series[].data[].itemStyle.color

Examples of data modifications:
- Filter xAxis.data and corresponding series[].data arrays
- Remove specific items from pie chart data array

IMPORTANT: Maintain the same structure as ECharts expects. Only modify what the user requested.`;

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
          { role: 'user', content: `Modify the chart based on this request: ${prompt}` }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      throw new Error('Failed to process customization request');
    }

    const data = await response.json();
    let modifiedChart;
    
    try {
      const responseContent = data.choices[0].message.content.trim();
      console.log('AI customization response:', responseContent);
      
      // Clean the response
      let cleanContent = responseContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '');
      
      modifiedChart = JSON.parse(cleanContent);
      
      // Validate that it's a valid chart config
      if (!modifiedChart.series) {
        throw new Error('Invalid chart configuration');
      }
      
    } catch (parseError) {
      console.error('Failed to parse customization response:', parseError);
      
      // Return original chart if parsing fails
      modifiedChart = currentChartConfig;
    }

    return new Response(JSON.stringify({ 
      modifiedChart,
      chartIndex,
      message: "Chart customized successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in customize-chart function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});