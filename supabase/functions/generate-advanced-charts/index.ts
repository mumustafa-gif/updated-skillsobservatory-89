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

    // Generate charts with improved prompt for multiple charts
    const chartSystemPrompt = `You are an expert chart generation assistant for UAE workforce skills analysis.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON with properly quoted property names
2. Do NOT use markdown code blocks or explanations
3. Replace ALL "&" symbols with "and" in text content
4. Use only double quotes for strings
5. Generate exactly ${numberOfCharts} DIFFERENT charts with unique data

Return this exact JSON structure:
{
  "charts": [
    {
      "title": {"text": "UAE Skills Gap Analysis", "subtext": "Demand vs Supply by Sector"},
      "tooltip": {"trigger": "axis"},
      "legend": {"data": ["Demand", "Supply"]},
      "xAxis": {"type": "category", "data": ["Technology", "Healthcare", "Finance", "Tourism"]},
      "yAxis": {"type": "value", "name": "Number of Professionals"},
      "series": [
        {"name": "Demand", "type": "bar", "data": [8500, 6200, 5800, 4200]},
        {"name": "Supply", "type": "bar", "data": [4200, 5100, 4800, 3800]}
      ]
    }${numberOfCharts > 1 ? `,
    {
      "title": {"text": "Skills Distribution by Sector", "subtext": "UAE Workforce 2024"},
      "tooltip": {"trigger": "item", "formatter": "{a} <br/>{b}: {c} ({d}%)"},
      "legend": {"data": ["Technology", "Healthcare", "Finance", "Tourism", "Government"]},
      "series": [{
        "name": "Sector Distribution",
        "type": "pie",
        "radius": "65%",
        "data": [
          {"value": 32, "name": "Technology"},
          {"value": 24, "name": "Healthcare"},
          {"value": 22, "name": "Finance"},
          {"value": 14, "name": "Tourism"},
          {"value": 8, "name": "Government"}
        ]
      }]
    }` : ''}${numberOfCharts > 2 ? `,
    {
      "title": {"text": "Skills Trends 2024-2028", "subtext": "Projected Growth in Key Areas"},
      "tooltip": {"trigger": "axis"},
      "legend": {"data": ["AI and Data Science", "Cybersecurity", "Digital Health"]},
      "xAxis": {"type": "category", "data": ["2024", "2025", "2026", "2027", "2028"]},
      "yAxis": {"type": "value", "name": "Growth Percentage"},
      "series": [
        {"name": "AI and Data Science", "type": "line", "smooth": true, "data": [25, 40, 58, 72, 85]},
        {"name": "Cybersecurity", "type": "line", "smooth": true, "data": [20, 32, 48, 60, 75]},
        {"name": "Digital Health", "type": "line", "smooth": true, "data": [15, 28, 42, 55, 68]}
      ]
    }` : ''}
  ],
  "diagnostics": {
    "chartTypes": ["bar"${numberOfCharts > 1 ? ', "pie"' : ''}${numberOfCharts > 2 ? ', "line"' : ''}],
    "dimensions": ["Skills", "Sectors", "Time"],
    "notes": "Generated ${numberOfCharts} charts for UAE workforce analysis",
    "sources": ["UAE Skills Database", "Labor Market Reports 2024"]
  }
}

MANDATORY REQUIREMENTS:
- Generate exactly ${numberOfCharts} unique charts
- Each chart must show different UAE workforce skills data
- Use realistic data for UAE sectors: Technology, Healthcare, Finance, Tourism
- Replace any "&" symbols with "and" in all text
- NO special characters that break JSON parsing
- Focus on Skills Observatory goals for UAE Vision 2071

${knowledgeBaseContext ? `Use this data context for realistic numbers:\n${knowledgeBaseContext.slice(0, 800)}` : ''}`;

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
            content: `Generate exactly ${numberOfCharts} different charts for UAE workforce skills analysis: ${prompt}. 

IMPORTANT: Create ${numberOfCharts} completely separate and distinct charts, each showing different aspects:
${numberOfCharts >= 1 ? '1. Skills gap analysis (bar chart showing demand vs supply)' : ''}
${numberOfCharts >= 2 ? '2. Skills distribution by sector (pie chart)' : ''}
${numberOfCharts >= 3 ? '3. Skills trends over time (line chart for 2024-2028)' : ''}
${numberOfCharts >= 4 ? '4. Regional skills distribution (area chart)' : ''}

Each chart must have unique data, different chart type, and focus on different UAE skills aspects.` 
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
      
      // Remove any markdown code blocks and find JSON
      let cleanContent = responseContent;
      
      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Find the JSON object by looking for the first { and last }
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
      
      // Fix common JSON issues without being too aggressive
      cleanContent = cleanContent
        .replace(/&/g, 'and') // Replace & with 'and' to avoid JSON issues
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
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
      
      // Fallback: create multiple charts based on numberOfCharts
      const fallbackCharts = [];
      
      for (let i = 0; i < numberOfCharts; i++) {
        if (i === 0) {
          fallbackCharts.push({
            title: { text: 'UAE Skills Gap Analysis', subtext: 'Current Market Demands vs Available Skills' },
            tooltip: { trigger: 'axis' },
            legend: { data: ['Required Skills', 'Available Skills'] },
            xAxis: { type: 'category', data: ['AI/ML', 'Data Science', 'Cybersecurity', 'Digital Marketing', 'Cloud Computing'] },
            yAxis: { type: 'value', name: 'Skill Level (%)' },
            series: [
              { name: 'Required Skills', type: 'bar', data: [85, 78, 92, 65, 73] },
              { name: 'Available Skills', type: 'bar', data: [45, 52, 38, 58, 49] }
            ]
          });
        } else if (i === 1) {
          fallbackCharts.push({
            title: { text: 'Skills Distribution by Sector', subtext: 'UAE Workforce Distribution' },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: { data: ['Technology', 'Healthcare', 'Finance', 'Tourism', 'Manufacturing'] },
            series: [{
              name: 'Sector Distribution',
              type: 'pie',
              radius: '60%',
              data: [
                { value: 35, name: 'Technology' },
                { value: 25, name: 'Healthcare' },
                { value: 20, name: 'Finance' },
                { value: 15, name: 'Tourism' },
                { value: 5, name: 'Manufacturing' }
              ]
            }]
          });
        } else if (i === 2) {
          fallbackCharts.push({
            title: { text: 'Skills Demand Trends (2024-2028)', subtext: 'Projected Growth in Key Skills' },
            tooltip: { trigger: 'axis' },
            legend: { data: ['AI Skills', 'Green Energy', 'Digital Health'] },
            xAxis: { type: 'category', data: ['2024', '2025', '2026', '2027', '2028'] },
            yAxis: { type: 'value', name: 'Demand Growth (%)' },
            series: [
              { name: 'AI Skills', type: 'line', smooth: true, data: [20, 35, 50, 70, 85] },
              { name: 'Green Energy', type: 'line', smooth: true, data: [15, 25, 40, 55, 75] },
              { name: 'Digital Health', type: 'line', smooth: true, data: [10, 20, 35, 50, 65] }
            ]
          });
        } else {
          // Additional charts for higher numbers
          fallbackCharts.push({
            title: { text: `UAE Skills Analysis ${i + 1}`, subtext: 'Regional Skills Distribution' },
            tooltip: { trigger: 'item' },
            legend: { data: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Other Emirates'] },
            series: [{
              name: 'Regional Skills',
              type: 'pie',
              radius: '50%',
              data: [
                { value: 45, name: 'Dubai' },
                { value: 30, name: 'Abu Dhabi' },
                { value: 15, name: 'Sharjah' },
                { value: 10, name: 'Other Emirates' }
              ]
            }]
          });
        }
      }
      
      parsedChartData = {
        charts: fallbackCharts,
        diagnostics: {
          chartTypes: fallbackCharts.map(chart => chart.series[0].type),
          dimensions: ['Skills Category', 'Sector', 'Time', 'Region'],
          notes: `Fallback: Generated ${numberOfCharts} charts due to parsing error`,
          sources: ['UAE Skills Database', 'Market Analysis']
        }
      };
      
      console.log(`Created ${fallbackCharts.length} fallback charts`);
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