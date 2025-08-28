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
    const chartSystemPrompt = `You are an expert data visualization assistant. 

CRITICAL INSTRUCTIONS:
1. Read the user's request and create charts that DIRECTLY address their specific topic
2. Generate professional titles that reflect their actual domain/topic
3. Use realistic sample data relevant to their request
4. RETURN ONLY VALID JSON - no markdown, no explanations, no code blocks

JSON FORMAT RULES:
- Use ONLY double quotes for strings
- NO quotes inside string values (replace with spaces or remove)
- NO trailing commas
- NO line breaks in string values
- NO special characters like apostrophes

RESPONSE (JSON only):
{
  "charts": [
    {
      "title": {"text": "Short Professional Title", "subtext": "Brief description"},
      "tooltip": {"trigger": "axis"},
      "legend": {"data": ["Series1", "Series2"]},
      "xAxis": {"type": "category", "data": ["Cat1", "Cat2", "Cat3", "Cat4", "Cat5"]},
      "yAxis": {"type": "value", "name": "Value"},
      "series": [{"name": "Series1", "type": "bar", "data": [100, 200, 150, 80, 120]}]
    }
  ],
  "diagnostics": {
    "chartTypes": ["bar"],
    "dimensions": ["dimension1", "dimension2"],
    "notes": "Brief description",
    "sources": ["data source"]
  }
}

${knowledgeBaseContext ? `Context: ${knowledgeBaseContext.slice(0, 800)}` : ''}`;

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
      
      // More aggressive JSON cleaning to handle quotes and fix common issues
      let cleanContent = responseContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '') // Remove anything before first {
        .replace(/[^}]*$/, ''); // Remove anything after last }
      
      // Super aggressive cleaning for malformed JSON
      cleanContent = cleanContent
        // Fix smart quotes and apostrophes
        .replace(/'/g, '') // Remove all apostrophes
        .replace(/"/g, '"').replace(/"/g, '"') // Normalize smart quotes
        .replace(/'/g, '') // Remove smart single quotes
        
        // Fix broken string values with embedded quotes
        .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1 $2 $3"') // Fix any string with quotes inside
        .replace(/:\s*"([^"]*)"([^"]*)"([^"]*)"([^"]*)"([^"]*)"/g, ': "$1 $2 $3 $4 $5"') // Fix longer strings
        
        // Fix specific known issues from logs
        .replace(/,\s*"/g, ', "') // Space after commas
        .replace(/}\s*{/g, '}, {') // Missing comma between objects
        
        // Clean up structure
        .replace(/(\w+)(\s*):/g, '"$1"$2:') // Quote unquoted keys
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/,\s*,/g, ',') // Remove double commas
        .replace(/"\s*"/g, '""'); // Fix empty strings
      
      console.log('Cleaned content first 300 chars:', cleanContent.substring(0, 300));
      
      // Try parsing with additional error handling
      try {
        parsedChartData = JSON.parse(cleanContent);
      } catch (firstError) {
        console.log('First parse failed, trying manual fixes...');
        
        // Try fixing common specific issues seen in logs
        let manualFix = cleanContent
          .replace(/"text": "([^"]*), "subtext"/g, '"text": "$1", "subtext"') // Fix missing quotes after commas
          .replace(/"([^"]*), "([^"]*)"/g, '"$1 $2"') // Fix strings split by commas
          .replace(/([^,])\s*}/g, '$1}') // Clean up before closing braces
          .replace(/{\s*([^"])/g, '{ "$1'); // Fix objects starting without quotes
        
        console.log('Manual fix attempt:', manualFix.substring(0, 200));
        parsedChartData = JSON.parse(manualFix);
      }
      
      // Validate structure
      if (!parsedChartData.charts || !Array.isArray(parsedChartData.charts) || parsedChartData.charts.length === 0) {
        throw new Error('No valid charts found in response');
      }
      
      console.log('Successfully parsed', parsedChartData.charts.length, 'charts');
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed content:', chartData.choices[0].message.content);
      
      // Fallback: create charts that reflect the user's specific request
      const fallbackCharts = [];
      
      // Extract key terms from user prompt for more relevant fallback titles
      const promptWords = prompt.toLowerCase().split(/\s+/);
      
      // Create titles that better reflect the user's actual query
      const getRelevantTitle = (index) => {
        const prompt_lower = prompt.toLowerCase();
        
        // Extract key domain words to create more relevant titles
        if (prompt_lower.includes('finance') || prompt_lower.includes('financial')) {
          return index === 0 ? 'Financial Performance Analysis' : 
                 index === 1 ? 'Financial Metrics Overview' : 
                 'Financial Trends';
        }
        if (prompt_lower.includes('healthcare') || prompt_lower.includes('medical')) {
          return index === 0 ? 'Healthcare Analytics' : 
                 index === 1 ? 'Medical Data Overview' : 
                 'Health Trends';
        }
        if (prompt_lower.includes('education') || prompt_lower.includes('student')) {
          return index === 0 ? 'Education Analytics' : 
                 index === 1 ? 'Academic Performance' : 
                 'Learning Trends';
        }
        if (prompt_lower.includes('technology') || prompt_lower.includes('tech')) {
          return index === 0 ? 'Technology Analysis' : 
                 index === 1 ? 'Tech Metrics' : 
                 'Technology Trends';
        }
        
        // Look for action/analysis keywords
        if (promptWords.some(word => ['sales', 'revenue', 'profit', 'income', 'financial'].includes(word))) {
          return index === 0 ? 'Revenue Analysis' : 
                 index === 1 ? 'Sales Distribution' : 
                 'Financial Performance';
        }
        if (promptWords.some(word => ['skill', 'talent', 'workforce', 'employee', 'job'].includes(word))) {
          return index === 0 ? 'Talent Analytics' : 
                 index === 1 ? 'Skills Assessment' : 
                 'Workforce Insights';
        }
        if (promptWords.some(word => ['market', 'industry', 'sector', 'business', 'company'].includes(word))) {
          return index === 0 ? 'Market Intelligence' : 
                 index === 1 ? 'Industry Analysis' : 
                 'Business Metrics';
        }
        if (promptWords.some(word => ['performance', 'analysis', 'data', 'report'].includes(word))) {
          return index === 0 ? 'Performance Dashboard' : 
                 index === 1 ? 'Data Analysis' : 
                 'Analytical Report';
        }
        
        // Last resort: use first few words of prompt (cleaned)
        const firstWords = prompt.split(' ').slice(0, 3).join(' ');
        const cleanedTitle = firstWords.replace(/[^\w\s]/g, '').trim();
        
        return index === 0 ? `${cleanedTitle} Analysis` : 
               index === 1 ? `${cleanedTitle} Overview` : 
               `${cleanedTitle} Trends`;
      };
      
      for (let i = 0; i < numberOfCharts; i++) {
        if (i === 0) {
          // First chart - bar chart with relevant data
          fallbackCharts.push({
            title: { 
              text: getRelevantTitle(0), 
              subtext: 'Comprehensive data analysis' 
            },
            tooltip: { trigger: 'axis' },
            legend: { data: ['Primary Data', 'Secondary Data'] },
            xAxis: { type: 'category', data: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5'] },
            yAxis: { type: 'value', name: 'Value' },
            series: [
              { name: 'Primary Data', type: 'bar', data: [120, 200, 150, 80, 70] },
              { name: 'Secondary Data', type: 'bar', data: [80, 140, 120, 160, 90] }
            ]
          });
        } else if (i === 1) {
          // Second chart - pie chart
          fallbackCharts.push({
            title: { 
              text: getRelevantTitle(1), 
              subtext: 'Key component breakdown' 
            },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: { data: ['Segment A', 'Segment B', 'Segment C', 'Segment D'] },
            series: [{
              name: 'Distribution',
              type: 'pie',
              radius: '60%',
              data: [
                { value: 40, name: 'Segment A' },
                { value: 30, name: 'Segment B' },
                { value: 20, name: 'Segment C' },
                { value: 10, name: 'Segment D' }
              ]
            }]
          });
        } else if (i === 2) {
          // Third chart - line chart for trends
          fallbackCharts.push({
            title: { 
              text: getRelevantTitle(2), 
              subtext: 'Performance trends analysis' 
            },
            tooltip: { trigger: 'axis' },
            legend: { data: ['Trend A', 'Trend B'] },
            xAxis: { type: 'category', data: ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5'] },
            yAxis: { type: 'value', name: 'Growth' },
            series: [
              { name: 'Trend A', type: 'line', smooth: true, data: [30, 45, 60, 75, 90] },
              { name: 'Trend B', type: 'line', smooth: true, data: [20, 35, 50, 65, 80] }
            ]
          });
        } else {
          // Additional charts based on user request
          fallbackCharts.push({
            title: { 
              text: `Additional Analysis ${i + 1}`, 
              subtext: 'Supplementary data insights' 
            },
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