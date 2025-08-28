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

    // Generate charts with completely dynamic prompt based on user request
    const chartSystemPrompt = `You are an expert data visualization assistant. Create charts based EXACTLY on what the user requests.

CRITICAL JSON RULES:
- Return ONLY valid JSON, no markdown, no explanations, no code blocks
- Use double quotes for ALL strings and property names  
- NEVER use quotes inside string values (use single quotes or avoid them)
- Example: "title": {"text": "Skills Analysis for Technology Sector"}

Generate exactly ${numberOfCharts} completely different charts based on the user request.

Required JSON structure:
{
  "charts": [
    {
      "title": {"text": "Dynamic title based on user request", "subtext": "Relevant subtitle"},
      "tooltip": {"trigger": "axis"},
      "legend": {"data": ["Series names from user context"]},
      "xAxis": {"type": "category", "data": ["Categories from user request"]},
      "yAxis": {"type": "value", "name": "Metric name"},
      "series": [{"name": "Data series", "type": "bar", "data": [realistic_numbers]}]
    }
  ],
  "diagnostics": {
    "chartTypes": ["chart_types_used"],
    "dimensions": ["data_dimensions"],
    "notes": "Description of what was generated",
    "sources": ["data_sources"]
  }
}

Chart type options: bar, line, pie, area, scatter, radar
Choose types that best fit the user's specific request.

${knowledgeBaseContext ? `Available data context:\n${knowledgeBaseContext.slice(0, 1000)}` : ''}`;

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
            content: `Create ${numberOfCharts} different charts based on this request: "${prompt}"

${knowledgeBaseContext ? `Using the following data context: ${knowledgeBaseContext.slice(0, 1500)}` : ''}

Please generate charts that directly address the user's specific request. Each chart should focus on different aspects of what they asked for.` 
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
      
      // Advanced JSON cleaning to handle quotes and fix common issues
      let cleanContent = responseContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '') // Remove anything before first {
        .replace(/[^}]*$/, ''); // Remove anything after last }
      
      // Fix quotes inside strings first - find strings and escape quotes within them
      cleanContent = cleanContent.replace(/"([^"]*)"(\s*:\s*")([^"]*)"([^"]*)"([^"]*)"([^"]*)"/g, (match, key, colon, start, middle, end, rest) => {
        // If this looks like a key-value pair with quotes inside the value
        return `"${key}"${colon}${start} ${middle} ${end}${rest}"`;
      });
      
      // More aggressive quote fixing - replace problematic quote patterns
      cleanContent = cleanContent.replace(/"([^"]*)"([^"]*)"([^"]*)"(\s*[,}\]])/g, '"$1 $2 $3"$4');
      
      // Fix common JSON issues
      cleanContent = cleanContent
        .replace(/(\w+)(\s*):/g, '"$1"$2:') // Quote unquoted keys
        .replace(/'/g, '"') // Replace single quotes
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/"\s*"/g, '""'); // Fix empty strings
      
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
      
      // Fallback: create generic charts based on prompt keywords
      const fallbackCharts = [];
      
      // Create simple fallback charts that try to match the user's request
      const promptLower = prompt.toLowerCase();
      
      for (let i = 0; i < numberOfCharts; i++) {
        if (i === 0) {
          // First chart - bar chart with relevant data
          fallbackCharts.push({
            title: { text: `Analysis for ${prompt.slice(0, 50)}...`, subtext: 'Data Overview' },
            tooltip: { trigger: 'axis' },
            legend: { data: ['Category A', 'Category B'] },
            xAxis: { type: 'category', data: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'] },
            yAxis: { type: 'value', name: 'Value' },
            series: [
              { name: 'Category A', type: 'bar', data: [120, 200, 150, 80, 70] },
              { name: 'Category B', type: 'bar', data: [80, 140, 120, 160, 90] }
            ]
          });
        } else if (i === 1) {
          // Second chart - pie chart
          fallbackCharts.push({
            title: { text: 'Distribution Analysis', subtext: 'Breakdown of Key Components' },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: { data: ['Component 1', 'Component 2', 'Component 3', 'Component 4'] },
            series: [{
              name: 'Distribution',
              type: 'pie',
              radius: '60%',
              data: [
                { value: 40, name: 'Component 1' },
                { value: 30, name: 'Component 2' },
                { value: 20, name: 'Component 3' },
                { value: 10, name: 'Component 4' }
              ]
            }]
          });
        } else if (i === 2) {
          // Third chart - line chart for trends
          fallbackCharts.push({
            title: { text: 'Trend Analysis', subtext: 'Changes Over Time' },
            tooltip: { trigger: 'axis' },
            legend: { data: ['Metric 1', 'Metric 2'] },
            xAxis: { type: 'category', data: ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5'] },
            yAxis: { type: 'value', name: 'Growth' },
            series: [
              { name: 'Metric 1', type: 'line', smooth: true, data: [30, 45, 60, 75, 90] },
              { name: 'Metric 2', type: 'line', smooth: true, data: [20, 35, 50, 65, 80] }
            ]
          });
        } else {
          // Additional generic charts
          fallbackCharts.push({
            title: { text: `Analysis ${i + 1}`, subtext: 'Additional Data View' },
            tooltip: { trigger: 'item' },
            legend: { data: ['Group A', 'Group B', 'Group C'] },
            series: [{
              name: 'Data Groups',
              type: 'pie',
              radius: '50%',
              data: [
                { value: 50, name: 'Group A' },
                { value: 30, name: 'Group B' },
                { value: 20, name: 'Group C' }
              ]
            }]
          });
        }
      }
      
      parsedChartData = {
        charts: fallbackCharts,
        diagnostics: {
          chartTypes: fallbackCharts.map(chart => chart.series[0].type),
          dimensions: ['Category', 'Value', 'Time'],
          notes: `Fallback: Generated ${numberOfCharts} generic charts due to parsing error for request: ${prompt.slice(0, 100)}`,
          sources: ['Fallback Data Generator']
        }
      };
      
      console.log(`Created ${fallbackCharts.length} fallback charts`);
    }

    // Generate data insights based on user request
    const insightSystemPrompt = `You are a data analysis expert. Based on the user's specific request, provide exactly 5-6 bullet points explaining key insights and patterns from their data.

Return ONLY a JSON array of strings:
["insight 1", "insight 2", "insight 3", "insight 4", "insight 5", "insight 6"]

Focus on insights that directly relate to what the user requested. Provide actionable, specific analysis based on their prompt.`;

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
          { role: 'user', content: `Analyze the data and provide insights for: ${prompt}${knowledgeBaseContext ? '\n\nWith data from: ' + knowledgeBaseContext.slice(0, 1000) : ''}` }
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

    // Generate policy analysis based on user request
    const policySystemPrompt = `You are a policy research expert. Based on the user's specific request, provide relevant policy analysis:

Return ONLY a JSON object:
{
  "currentPolicies": ["relevant policy 1", "relevant policy 2", "relevant policy 3", "relevant policy 4"],
  "suggestedImprovements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4"],
  "region": "determined from context",
  "country": "determined from context"
}

Provide specific, actionable policy recommendations based on what the user is asking to analyze.`;

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
          { role: 'user', content: `Research relevant policies and provide analysis for: ${prompt}` }
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