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

  const startTime = Date.now();
  
  try {
    const { prompt, numberOfCharts = 1, chartTypes = ['bar'], useKnowledgeBase = false, knowledgeBaseFiles = [] } = await req.json();

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token using service role client
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await serviceSupabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing request for user: ${user.id}, prompt: "${prompt.slice(0, 100)}..."`);

    // Fetch knowledge base content if requested (limit to prevent token overflow)
    let knowledgeBaseContent = '';
    if (useKnowledgeBase && knowledgeBaseFiles.length > 0) {
      const { data: kbFiles, error: kbError } = await supabase
        .from('knowledge_base_files')
        .select('original_filename, extracted_content')
        .in('id', knowledgeBaseFiles)
        .eq('user_id', user.id);

      if (!kbError && kbFiles && kbFiles.length > 0) {
        knowledgeBaseContent = kbFiles.map(file => 
          `${file.original_filename}: ${file.extracted_content.slice(0, 2000)}`
        ).join('\n').slice(0, 6000);
      }
    }

    // OPTIMIZED: Single API call for charts with concise prompt
    const chartPrompt = `Create ${numberOfCharts} ${chartTypes.join('/')} chart(s) for: "${prompt}"

${knowledgeBaseContent ? `Data context: ${knowledgeBaseContent}\n` : ''}

Return JSON:
{
  "charts": [{
    "title": {"text": "Chart Title", "left": "center"},
    "tooltip": {"trigger": "axis"},
    "legend": {"data": ["Series1"]},
    "xAxis": {"type": "category", "data": ["Jan","Feb","Mar"]},
    "yAxis": {"type": "value"},
    "series": [{"name": "Series1", "type": "${chartTypes[0]}", "data": [120, 200, 150]}],
    "color": ["#2f74c0", "#ff7f50"]
  }]
}`;

    // Generate charts with reduced token limit
    const chartResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are a data visualization expert. Create ECharts configurations. Return only valid JSON.' },
          { role: 'user', content: chartPrompt }
        ],
        max_completion_tokens: 800,
        response_format: { type: "json_object" }
      }),
    });

    let parsedChartData;
    if (!chartResponse.ok) {
      console.error('Chart API error:', chartResponse.status, await chartResponse.text());
      throw new Error(`Chart generation failed: ${chartResponse.status}`);
    }

    try {
      const chartData = await chartResponse.json();
      const responseContent = chartData.choices?.[0]?.message?.content;
      
      if (!responseContent || responseContent.trim() === '') {
        throw new Error('Empty chart response');
      }
      
      parsedChartData = JSON.parse(responseContent.trim());
      
      // Validate and enhance chart structure
      if (parsedChartData.charts && Array.isArray(parsedChartData.charts)) {
        parsedChartData.charts = parsedChartData.charts.map((chart: any, index: number) => ({
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
        }));
        
        console.log('Successfully generated', parsedChartData.charts.length, 'charts');
      }
      
    } catch (parseError) {
      console.error('Chart JSON parse error:', parseError);
      
      // Smart fallback based on prompt
      const promptLower = prompt.toLowerCase();
      let fallbackChart;
      
      if (promptLower.includes('skill') || promptLower.includes('talent')) {
        fallbackChart = {
          title: { text: 'Skills Analysis', subtext: 'Based on current market trends' },
          xAxis: { type: 'category', data: ['AI/ML', 'Cloud', 'Data Science', 'Cybersecurity', 'DevOps'] },
          yAxis: { type: 'value', name: 'Demand Level' },
          series: [{ name: 'Skill Demand', type: 'bar', data: [95, 88, 82, 78, 75] }],
          color: ['#2f74c0', '#ff7f50']
        };
      } else if (promptLower.includes('finance') || promptLower.includes('revenue')) {
        fallbackChart = {
          title: { text: 'Financial Performance', subtext: 'Quarterly analysis' },
          xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
          yAxis: { type: 'value', name: 'Revenue (M)' },
          series: [{ name: 'Revenue', type: 'line', data: [120, 145, 160, 180] }],
          color: ['#2f74c0', '#ff7f50']
        };
      } else {
        fallbackChart = {
          title: { text: 'Data Analysis', subtext: 'Generated visualization' },
          xAxis: { type: 'category', data: ['Category A', 'Category B', 'Category C', 'Category D'] },
          yAxis: { type: 'value', name: 'Value' },
          series: [{ name: 'Data', type: 'bar', data: [120, 200, 150, 80] }],
          color: ['#2f74c0', '#ff7f50']
        };
      }
      
      parsedChartData = { charts: [fallbackChart] };
    }

    // OPTIMIZED: Single API call for all reports with reduced token limit
    const reportsPrompt = `Analyze: "${prompt}"

Generate concise analysis in JSON format:
{
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "currentPolicies": ["policy1", "policy2", "policy3"],
  "suggestedImprovements": ["improvement1", "improvement2", "improvement3"],
  "skillsAnalysis": "Brief analysis summary",
  "currentPoliciesReport": "Brief policy overview", 
  "policyImprovementsReport": "Brief improvement recommendations"
}

Focus on actionable insights relevant to the query.`;

    const reportsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: 'You are an expert analyst. Generate concise, actionable insights in JSON format.' },
          { role: 'user', content: reportsPrompt }
        ],
        max_completion_tokens: 600,
        response_format: { type: "json_object" }
      }),
    });

    // Default fallback values
    let insights = [`Analysis for "${prompt.slice(0, 50)}..." shows significant optimization opportunities in key performance areas.`];
    let policyData = {
      currentPolicies: [`Current frameworks provide baseline structure for ${prompt.slice(0, 30)}... analysis.`],
      suggestedImprovements: [`Enhanced data-driven policies could improve outcomes for ${prompt.slice(0, 30)}... initiatives.`],
      region: "Global",
      country: "International"
    };
    let detailedReports = {
      skillsAnalysis: `**Skills Analysis Summary**\n\nBased on "${prompt}", analysis indicates opportunities for strategic workforce development and capability enhancement.`,
      currentPolicies: `**Current Policies Overview**\n\nExisting policy frameworks for "${prompt}" provide foundation for regulatory compliance and operational standards.`,
      policyImprovements: `**Policy Improvement Recommendations**\n\nStrategic enhancements for "${prompt}" could optimize regulatory effectiveness and outcome delivery.`
    };

    if (reportsResponse.ok) {
      try {
        const reportsData = await reportsResponse.json();
        const content = reportsData.choices?.[0]?.message?.content;
        
        if (content && content.trim() !== '') {
          const parsed = JSON.parse(content.trim());
          
          if (parsed.insights && Array.isArray(parsed.insights)) {
            insights = parsed.insights;
          }
          
          if (parsed.currentPolicies || parsed.suggestedImprovements) {
            policyData = {
              currentPolicies: parsed.currentPolicies || policyData.currentPolicies,
              suggestedImprovements: parsed.suggestedImprovements || policyData.suggestedImprovements,
              region: parsed.region || "Global",
              country: parsed.country || "International"
            };
          }
          
          if (parsed.skillsAnalysis || parsed.currentPoliciesReport || parsed.policyImprovementsReport) {
            detailedReports = {
              skillsAnalysis: parsed.skillsAnalysis || detailedReports.skillsAnalysis,
              currentPolicies: parsed.currentPoliciesReport || detailedReports.currentPolicies,
              policyImprovements: parsed.policyImprovementsReport || detailedReports.policyImprovements
            };
          }
        }
      } catch (error) {
        console.error('Reports parsing error:', error);
        // Fallback values already set above
      }
    } else {
      console.error('Reports API error:', reportsResponse.status);
    }

    // Save to chart history
    if (parsedChartData.charts && parsedChartData.charts.length > 0) {
      try {
        const { error: saveError } = await supabase
          .from('chart_history')
          .insert({
            user_id: user.id,
            prompt: prompt,
            chart_config: parsedChartData.charts[0],
            diagnostics: {
              chartTypes: [parsedChartData.charts[0].series?.[0]?.type || 'bar'],
              dimensions: ['Category', 'Value'],
              notes: `Generated for: ${prompt.slice(0, 100)}`,
              sources: ['AI Generated']
            },
            chart_type: parsedChartData.charts[0].series?.[0]?.type || 'bar',
            knowledge_base_files: useKnowledgeBase ? knowledgeBaseFiles : []
          });

        if (saveError) {
          console.error('Failed to save chart history:', saveError);
        } else {
          console.log('Successfully saved chart history');
        }
      } catch (error) {
        console.error('Chart history save error:', error);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`Request completed in ${executionTime}ms`);

    // Return comprehensive response
    return new Response(JSON.stringify({
      charts: parsedChartData.charts || [],
      diagnostics: {
        chartTypes: parsedChartData.charts?.map((chart: any) => chart.series?.[0]?.type || 'bar') || ['bar'],
        dimensions: ['Category', 'Value', 'Time'],
        notes: `Generated ${parsedChartData.charts?.length || 0} charts for: ${prompt.slice(0, 100)}`,
        sources: ['AI Generated Data'],
        executionTime: `${executionTime}ms`
      },
      insights: insights,
      policyData: policyData,
      detailedReports: detailedReports
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    const executionTime = Date.now() - startTime;
    
    return new Response(JSON.stringify({ 
      error: 'Chart generation failed',
      details: error.message,
      executionTime: `${executionTime}ms`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});