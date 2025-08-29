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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Empty request body');
      }
      
      requestData = JSON.parse(bodyText);
      console.log('Parsed request data:', requestData);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      prompt, 
      numberOfCharts = 1, 
      chartTypes = ['auto'], 
      useKnowledgeBase = false, 
      knowledgeBaseFiles = [] 
    } = requestData;
    
    // Get user from auth header using service role key
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received, length:', token.length);
    
    // Create supabase client with service role key for authentication
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    console.log('User data:', user);
    
    if (authError) {
      console.error('Auth verification failed:', authError.message);
      return new Response(JSON.stringify({ 
        error: 'Invalid token or user not found', 
        details: authError.message 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!user) {
      console.error('No user found from token');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('User authenticated successfully:', user.email);

    // Get knowledge base content if files are specified
    let knowledgeBaseContext = '';
    if (useKnowledgeBase && knowledgeBaseFiles.length > 0) {
      try {
        const { data: files, error: filesError } = await supabaseAdmin
          .from('knowledge_base_files')
          .select('original_filename, extracted_content')
          .in('id', knowledgeBaseFiles)
          .eq('user_id', user.id);
        
        if (filesError) {
          console.error('Error fetching knowledge base files:', filesError);
        } else if (files && files.length > 0) {
          knowledgeBaseContext = files.map(file => 
            `File: ${file.original_filename}\nContent: ${file.extracted_content}`
          ).join('\n\n');
          console.log('Loaded knowledge base context from', files.length, 'files');
        }
      } catch (error) {
        console.error('Failed to load knowledge base files:', error);
      }
    }

    console.log('Starting chart generation for:', prompt);

    // Generate charts with completely dynamic prompt based on user request
    const chartResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert data visualization assistant. Create ECharts configurations based on user requests.

CRITICAL: Generate realistic data relevant to the user's specific request. Use proper ECharts format.

Return ONLY valid JSON without any markdown or explanations.` 
          },
          { 
            role: 'user', 
            content: `Create ${numberOfCharts} ECharts configuration(s) for: "${prompt}"

${knowledgeBaseContext ? `Context: ${knowledgeBaseContext.slice(0, 1000)}` : ''}

Generate realistic sample data relevant to the request. Each chart should have:
- Meaningful titles related to the topic
- Realistic category names and data values
- Proper ECharts series configuration

Return JSON format:
{
  "charts": [array of echarts configs],
  "diagnostics": {"chartTypes": [], "dimensions": [], "notes": "", "sources": []}
}` 
          }
        ],
        max_completion_tokens: 4000,
        response_format: { 
          type: "json_object"
        }
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
      console.log('GPT-5 JSON Response:', responseContent);
      
      // Parse the structured JSON response directly
      parsedChartData = JSON.parse(responseContent);
      
      // Validate and enhance chart structure
      if (parsedChartData.charts && Array.isArray(parsedChartData.charts)) {
        parsedChartData.charts = parsedChartData.charts.map((chart: any, index: number) => {
          // Ensure proper ECharts structure
          const enhancedChart = {
            ...chart,
            title: {
              text: chart.title?.text || `Analysis Chart ${index + 1}`,
              subtext: chart.title?.subtext || 'Data visualization',
              ...chart.title
            },
            tooltip: {
              trigger: chart.series?.[0]?.type === 'pie' ? 'item' : 'axis',
              ...chart.tooltip
            },
            legend: {
              data: chart.legend?.data || [],
              ...chart.legend
            }
          };

          // Ensure series is properly formatted
          if (chart.series && Array.isArray(chart.series)) {
            enhancedChart.series = chart.series.map((serie: any) => ({
              ...serie,
              name: serie.name || 'Data',
              type: serie.type || 'bar',
              data: Array.isArray(serie.data) ? serie.data : []
            }));
          }

          return enhancedChart;
        });
        
        console.log('Successfully parsed and enhanced', parsedChartData.charts.length, 'charts');
      }
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed content:', chartData.choices[0].message.content);
      
      // Enhanced fallback with more relevant data
      const fallbackCharts = [];
      const promptLower = prompt.toLowerCase();
      
      // Generate domain-specific fallback data
      const getFallbackData = (chartIndex: number) => {
        if (promptLower.includes('skill') || promptLower.includes('talent') || promptLower.includes('job')) {
          if (chartIndex === 0) {
            return {
              title: { text: 'Top Skills in Demand', subtext: 'Market analysis based on current trends' },
              xAxis: { type: 'category', data: ['AI/ML', 'Cloud Computing', 'Data Science', 'Cybersecurity', 'DevOps'] },
              yAxis: { type: 'value', name: 'Demand Level' },
              series: [{ name: 'Skill Demand', type: 'bar', data: [95, 88, 82, 78, 75] }],
              legend: { data: ['Skill Demand'] }
            };
          }
        }
        
        if (promptLower.includes('finance') || promptLower.includes('revenue') || promptLower.includes('sales')) {
          if (chartIndex === 0) {
            return {
              title: { text: 'Financial Performance', subtext: 'Quarterly revenue analysis' },
              xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
              yAxis: { type: 'value', name: 'Revenue (M)' },
              series: [{ name: 'Revenue', type: 'line', data: [120, 145, 160, 180] }],
              legend: { data: ['Revenue'] }
            };
          }
        }
        
        if (promptLower.includes('market') || promptLower.includes('industry')) {
          if (chartIndex === 0) {
            return {
              title: { text: 'Market Share Analysis', subtext: 'Industry distribution' },
              series: [{
                name: 'Market Share',
                type: 'pie',
                radius: '60%',
                data: [
                  { value: 35, name: 'Technology' },
                  { value: 25, name: 'Healthcare' },
                  { value: 20, name: 'Finance' },
                  { value: 20, name: 'Others' }
                ]
              }],
              legend: { data: ['Technology', 'Healthcare', 'Finance', 'Others'] }
            };
          }
        }
        
        // Default fallback
        return {
          title: { text: 'Data Analysis', subtext: 'Generated from user query' },
          xAxis: { type: 'category', data: ['Category A', 'Category B', 'Category C', 'Category D'] },
          yAxis: { type: 'value', name: 'Value' },
          series: [{ name: 'Data', type: 'bar', data: [120, 200, 150, 80] }],
          legend: { data: ['Data'] }
        };
      };
      
      for (let i = 0; i < numberOfCharts; i++) {
        const chartData = getFallbackData(i);
        fallbackCharts.push({
          ...chartData,
          tooltip: {
            trigger: chartData.series?.[0]?.type === 'pie' ? 'item' : 'axis',
            ...chartData.tooltip
          }
        });
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

    // Generate insights
    const insightResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `Generate 6-8 specific Skills Intelligence & Analysis insights based on the user query and chart data. Make insights directly relevant to the query with quantitative analysis when possible.

Return JSON format: {"insights": ["insight_1", "insight_2", ...]}`
          },
          { 
            role: 'user', 
            content: `Query: "${prompt}"
Chart Data: ${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 800)}

Generate specific insights that directly address this query with actionable recommendations.`
          }
        ],
        max_completion_tokens: 1200,
        response_format: { type: "json_object" }
      }),
    });

    let insights = [];
    if (insightResponse.ok) {
      try {
        const insightData = await insightResponse.json();
        const parsedInsights = JSON.parse(insightData.choices[0].message.content);
        insights = parsedInsights.insights || [];
        console.log('Generated insights:', insights.length);
      } catch (error) {
        console.error('Failed to parse insights:', error);
        insights = [
          `Analysis of "${prompt.slice(0, 50)}..." reveals significant trends requiring strategic attention`,
          'Data shows 20-30% optimization opportunities across key performance indicators',
          'Market positioning analysis indicates competitive advantages in high-growth segments',
          'Performance benchmarking suggests 15-25% improvement potential through targeted strategies',
          'Trend forecasting projects continued growth in top-performing areas with strategic focus',
          'Resource allocation patterns demonstrate opportunities for enhanced efficiency and impact'
        ];
      }
    }

    const result = {
      charts: parsedChartData.charts || [],
      diagnostics: parsedChartData.diagnostics || {},
      insights: insights || [],
      policyData: null
    };

    console.log('Successfully generated response with', result.charts.length, 'charts and', result.insights.length, 'insights');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-advanced-charts function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate charts',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});