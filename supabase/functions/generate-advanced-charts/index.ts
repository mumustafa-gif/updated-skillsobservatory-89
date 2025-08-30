import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Helper function to create proper fallback charts
function createFallbackChart(chartType: string, index: number) {
  const chartNumber = index + 1;
  
  if (chartType === 'map') {
    return {
      title: {
        text: 'UAE Skills Distribution Map',
        subtext: 'Regional skill demand analysis'
      },
      mapStyle: 'mapbox://styles/mapbox/light-v11',
      center: [54.3773, 24.4539], // UAE coordinates
      zoom: 6,
      markers: [
        {
          coordinates: [55.2708, 25.2048], // Dubai
          title: 'Dubai',
          description: 'AI/ML and FinTech Hub - High demand for AI/ML, Cloud Computing, and Data Science skills',
          color: '#3b82f6'
        },
        {
          coordinates: [54.3773, 24.4539], // Abu Dhabi
          title: 'Abu Dhabi',
          description: 'Government and Energy Sector - Strong demand for Cybersecurity and DevOps skills',
          color: '#10b981'
        },
        {
          coordinates: [55.9185, 25.3385], // Sharjah
          title: 'Sharjah',
          description: 'Manufacturing and Education - Growing need for Data Science and Cloud Computing',
          color: '#f59e0b'
        },
        {
          coordinates: [56.3269, 25.2867], // Ajman
          title: 'Ajman',
          description: 'SME and Logistics - Emerging demand for DevOps and Cybersecurity',
          color: '#ef4444'
        }
      ]
    };
  }
  
  if (chartType === 'treemap') {
    return {
      title: {
        text: 'UAE Skills Market Analysis',
        subtext: 'Hierarchical view of skill demand and growth'
      },
      series: [{
        name: 'Skills',
        type: 'treemap',
        data: [
          {
            name: 'Technology Skills',
            value: 450,
            children: [
              { name: 'AI/ML', value: 120 },
              { name: 'Cloud Computing', value: 100 },
              { name: 'Data Science', value: 90 },
              { name: 'Cybersecurity', value: 80 },
              { name: 'DevOps', value: 60 }
            ]
          },
          {
            name: 'Business Skills',
            value: 200,
            children: [
              { name: 'Digital Marketing', value: 60 },
              { name: 'Project Management', value: 50 },
              { name: 'Business Analysis', value: 45 },
              { name: 'Financial Analysis', value: 45 }
            ]
          },
          {
            name: 'Emerging Skills',
            value: 150,
            children: [
              { name: 'Blockchain', value: 40 },
              { name: 'IoT', value: 35 },
              { name: 'AR/VR', value: 30 },
              { name: 'Quantum Computing', value: 25 },
              { name: 'Robotics', value: 20 }
            ]
          }
        ]
      }],
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          return `${params.name}<br/>Demand Score: ${params.value}`;
        }
      }
    };
  }
  
  // Default fallback for other chart types
  return {
    title: {
      text: `Skills Analysis Chart ${chartNumber}`,
      subtext: 'Market trends and demand analysis'
    },
    xAxis: {
      type: 'category',
      data: ['AI/ML', 'Cloud Computing', 'Data Science', 'Cybersecurity', 'DevOps']
    },
    yAxis: {
      type: 'value',
      name: 'Demand Score'
    },
    series: [{
      name: 'Skill Demand',
      type: chartType === 'bar' ? 'bar' : 'line',
      data: [95, 88, 82, 78, 75],
      smooth: chartType === 'line'
    }],
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Skill Demand']
    }
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Get user from JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No auth header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, numberOfCharts = 1, chartTypes = [], useKnowledgeBase = false, knowledgeBaseFiles = [], generateDetailedReports = true } = await req.json();

    console.log(`📊 Processing request: ${prompt.slice(0, 100)}...`);
    
    let knowledgeBaseContent = '';
    if (useKnowledgeBase && knowledgeBaseFiles.length > 0) {
      try {
        // Get knowledge base content from database instead of storage
        const { data: kbFiles, error } = await supabaseClient
          .from('knowledge_base_files')
          .select('original_filename, extracted_content')
          .in('id', knowledgeBaseFiles)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching knowledge base files:', error);
        } else if (kbFiles && kbFiles.length > 0) {
          knowledgeBaseContent = kbFiles.map(file => 
            `File: ${file.original_filename}\nContent: ${file.extracted_content}`
          ).join('\n\n');
          console.log(`📚 Knowledge base content loaded from ${kbFiles.length} files`);
        }
      } catch (error) {
        console.error('Error loading knowledge base content:', error);
      }
    }

    let charts: any[] = [];
    let diagnostics: any = {
      chartTypes: chartTypes,
      dimensions: ["Category", "Value", "Time"],
      notes: "",
      sources: []
    };

    // Run chart generation and insights in parallel for better performance
    const [chartsResult, insightsResult] = await Promise.allSettled([
      generateCharts(prompt, numberOfCharts, chartTypes, knowledgeBaseContent),
      generateDetailedReports ? generateInsights(prompt, numberOfCharts) : Promise.resolve([])
    ]);

    let charts: any[] = [];
    let diagnostics: any = {
      chartTypes: chartTypes,
      dimensions: ["Category", "Value", "Time"],
      notes: "",
      sources: []
    };

    // Handle charts result
    if (chartsResult.status === 'fulfilled' && chartsResult.value.success) {
      charts = chartsResult.value.charts;
      diagnostics.sources = chartsResult.value.sources;
      diagnostics.notes = chartsResult.value.notes;
    } else {
      console.error('Chart generation failed:', chartsResult.status === 'rejected' ? chartsResult.reason : 'Unknown error');
      // Create fallback charts
      charts = [];
      for (let i = 0; i < numberOfCharts; i++) {
        const chartType = chartTypes[i] || 'bar';
        console.log(`Fallback Chart ${i + 1}: User selected "${chartType}", using "${chartType}"`);
        charts.push(createFallbackChart(chartType, i));
      }
      diagnostics.sources = ["Fallback Data Generator"];
      diagnostics.notes = `Fallback: Generated ${charts.length} generic charts due to AI generation error`;
    }

    // Handle insights result
    let insights: any[] = [];
    if (insightsResult.status === 'fulfilled') {
      insights = insightsResult.value;
    } else if (generateDetailedReports) {
      console.error('Insights generation failed:', insightsResult.reason);
      insights = [`Analysis completed with ${charts.length} charts showing UAE workforce skill trends`];
    }

    // Generate detailed report if requested (can run independently)
    let detailedReport = null;
    if (generateDetailedReports) {
      try {
        detailedReport = await generateDetailedReport(charts, insights);
        if (detailedReport) {
          diagnostics.sources.push("OpenAI GPT-4o-mini Report Generator");
          diagnostics.notes += ', Generated detailed report using AI';
        }
      } catch (error) {
        console.error('Detailed report generation failed:', error);
        detailedReport = { report: `Detailed analysis available for ${charts.length} charts showing UAE workforce trends and skills demand patterns` };
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Complete! Generated ${charts.length} charts, ${insights.length} insights in ${totalTime}ms total`);

    return new Response(JSON.stringify({
      charts,
      diagnostics,
      insights,
      detailedReport
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-advanced-charts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      charts: [],
      insights: [],
      diagnostics: { error: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for better organization and parallel processing
async function generateCharts(prompt: string, numberOfCharts: number, chartTypes: string[], knowledgeBaseContent: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const chartPrompt = `Create ${numberOfCharts} interactive chart configuration(s) for Apache ECharts based on this request: "${prompt}"

Chart types requested: ${chartTypes.join(', ')}

${knowledgeBaseContent ? `Context from knowledge base: ${knowledgeBaseContent.slice(0, 2000)}...` : ''}

Return a JSON array of chart configurations. Each chart should be a complete ECharts option object.

For map charts, use this structure (return as regular ECharts config, the frontend will handle Mapbox):
{
  "title": {"text": "Title", "subtext": "Subtitle"},
  "mapStyle": "mapbox://styles/mapbox/light-v11",
  "center": [longitude, latitude],
  "zoom": number,
  "markers": [{"coordinates": [lng, lat], "title": "Name", "description": "Details", "color": "#color"}]
}

For treemap charts, use this structure:
{
  "title": {"text": "Title", "subtext": "Subtitle"},
  "series": [{
    "name": "Data",
    "type": "treemap",
    "data": [{"name": "Category", "value": number, "children": [{"name": "Item", "value": number}]}]
  }],
  "tooltip": {"trigger": "item"}
}

For other chart types, use standard ECharts configuration with proper series data structure.

Return only the JSON array, no additional text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a data visualization expert. Create valid ECharts configurations based on user requests. Always return valid JSON arrays of chart objects.'
        },
        { role: 'user', content: chartPrompt }
      ],
      max_tokens: 4000,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  const charts = JSON.parse(jsonMatch[0]);
  return {
    success: true,
    charts,
    sources: ["OpenAI GPT-4o-mini"],
    notes: `Successfully generated ${charts.length} charts using AI`
  };
}

async function generateInsights(prompt: string, numberOfCharts: number) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return [`Analysis completed for ${numberOfCharts} charts based on: ${prompt.slice(0, 100)}...`];
  }

  const insightsPrompt = `Generate ${numberOfCharts} key insights for UAE workforce analysis based on this request: "${prompt}".
  Focus on actionable intelligence and key trends. Return a JSON array of strings.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert data analyst for UAE workforce skills. Extract key insights and provide actionable intelligence.'
          },
          { role: 'user', content: insightsPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.5
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Insights generation error:', error);
  }
  
  return [`Analysis completed for ${numberOfCharts} charts showing UAE workforce skill trends`];
}

async function generateDetailedReport(charts: any[], insights: string[]) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return { report: 'Detailed report generation requires OpenAI API configuration' };
  }

  const reportPrompt = `Generate a comprehensive UAE workforce skills report based on:
  - Charts: ${JSON.stringify(charts)}
  - Insights: ${JSON.stringify(insights)}
  
  Include executive summary, key findings, detailed analysis, and strategic recommendations for UAE workforce development.
  Return a JSON object with a "report" key containing the full report text.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert policy analyst specializing in UAE workforce development. Generate comprehensive reports with actionable recommendations.'
          },
          { role: 'user', content: reportPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.5
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Report generation error:', error);
  }
  
  return { report: 'Report generation completed - detailed analysis available upon request' };
}
