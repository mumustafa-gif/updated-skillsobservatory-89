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
    const { conversationId, messageId, context, chartData } = await req.json();
    
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

    const systemPrompt = `You are a business intelligence expert specializing in data analysis and strategic insights.

Generate comprehensive insights and improvement suggestions based on the data context and charts provided.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "key_insights": [
    "• Significant finding or trend from the data",
    "• Important pattern or correlation discovered", 
    "• Notable outlier or anomaly identified",
    "• Performance indicator or benchmark comparison",
    "• Seasonal or temporal trend observation"
  ],
  "improvement_suggestions": [
    {
      "category": "Operational Efficiency",
      "priority": "High",
      "suggestion": "Specific actionable recommendation",
      "expected_impact": "Quantified benefit expected",
      "implementation_effort": "Low/Medium/High",
      "timeline": "timeframe for implementation"
    },
    {
      "category": "Strategic Planning",
      "priority": "Medium", 
      "suggestion": "Strategic recommendation",
      "expected_impact": "Long-term benefit description",
      "implementation_effort": "Medium/High",
      "timeline": "timeframe for implementation"
    }
  ],
  "risk_analysis": [
    {
      "risk_type": "Market Risk",
      "severity": "High/Medium/Low",
      "description": "Detailed risk description",
      "mitigation": "How to mitigate this risk",
      "probability": "likelihood of occurrence"
    }
  ],
  "performance_metrics": {
    "current_state": "Assessment of current performance",
    "benchmark_comparison": "How does this compare to industry standards",
    "growth_potential": "Areas with highest growth potential",
    "efficiency_score": "Overall efficiency rating and explanation"
  },
  "next_steps": [
    "• Immediate action item 1",
    "• Short-term action item 2",
    "• Medium-term strategic action 3",
    "• Long-term vision item 4"
  ]
}

Focus on:
1. Actionable insights that drive business value
2. Data-driven recommendations with clear ROI
3. Risk identification and mitigation strategies
4. Performance optimization opportunities
5. Strategic growth recommendations

Data Context: ${JSON.stringify(context)}
Chart Data: ${JSON.stringify(chartData)}`;

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
          { role: 'user', content: `Generate insights and suggestions based on this data analysis` }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate insights' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    let insightData;
    try {
      insightData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedContent);
      return new Response(JSON.stringify({ error: 'Invalid insight data generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save generated insights
    const { error: saveError } = await supabase
      .from('generated_content')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        content_type: 'insights',
        content: insightData,
        region_context: context.region || null
      });

    if (saveError) {
      console.error('Failed to save insights:', saveError);
    }

    return new Response(JSON.stringify(insightData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-insights function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});