import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

// Helper function to create proper fallback charts
function createFallbackChart(chartType: string, index: number) {
  const chartNumber = index + 1;
  
  if (chartType === 'map') {
    return {
      type: 'map',
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

    const authHeader = req.headers.get('Authorization')!;
    const apiKey = authHeader.split(' ')[1];

    if (apiKey !== Deno.env.get('SUPABASE_ANON_KEY')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: policyData, error: policyError } = await supabaseClient
      .from('policies')
      .select('*');

    if (policyError) {
      console.error('Error fetching policies:', policyError);
    }

    const { data: skillsIntelligence, error: skillsIntelligenceError } = await supabaseClient
      .from('skills_intelligence')
      .select('*');

    if (skillsIntelligenceError) {
      console.error('Error fetching skills intelligence:', skillsIntelligenceError);
    }

    const { data: currentPoliciesReport, error: currentPoliciesReportError } = await supabaseClient
      .from('current_policies_report')
      .select('*');

    if (currentPoliciesReportError) {
      console.error('Error fetching current policies report:', currentPoliciesReportError);
    }

    const { data: policyImprovementsReport, error: policyImprovementsReportError } = await supabaseClient
      .from('policy_improvements_report')
      .select('*');

    if (policyImprovementsReportError) {
      console.error('Error fetching policy improvements report:', policyImprovementsReportError);
    }

    const { prompt, numberOfCharts = 1, chartTypes = [], useKnowledgeBase = false, knowledgeBaseFiles = [], generateDetailedReports = true } = await req.json();

    console.log(`📊 Processing request: ${prompt.slice(0, 100)}...`);
    
    let knowledgeBaseContent = '';
    if (useKnowledgeBase && knowledgeBaseFiles.length > 0) {
      try {
        const knowledgeBasePromises = knowledgeBaseFiles.map(async (file: string) => {
          const { data, error } = await supabaseClient
            .storage
            .from('knowledge-base')
            .download(file);

          if (error) {
            console.error(`Error downloading ${file}:`, error);
            return '';
          }

          const fileContent = await new Response(data).text();
          return fileContent;
        });

        const knowledgeBaseResults = await Promise.all(knowledgeBasePromises);
        knowledgeBaseContent = knowledgeBaseResults.join('\n');
        console.log(`📚 Knowledge base content loaded from ${knowledgeBaseFiles.length} files`);
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

    // Attempt to generate charts using AI
    try {
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const chartPrompt = `Create ${numberOfCharts} interactive chart configuration(s) for Apache ECharts based on this request: "${prompt}"

Chart types requested: ${chartTypes.join(', ')}

${knowledgeBaseContent ? `Context from knowledge base: ${knowledgeBaseContent.slice(0, 2000)}...` : ''}

Return a JSON array of chart configurations. Each chart should be a complete ECharts option object.

For map charts, use this structure:
{
  "type": "map",
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

      console.log('OpenAI API attempt 1/2 - timeout: 30000ms');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using faster model for chart generation
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

      if (response.ok) {
        console.log('OpenAI API success on attempt 1');
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            charts = JSON.parse(jsonMatch[0]);
            diagnostics.sources = ["OpenAI GPT-4o-mini"];
            diagnostics.notes = `Successfully generated ${charts.length} charts using AI`;
          } else {
            throw new Error('No valid JSON found in response');
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          console.log('Failed content:', content);
          throw parseError;
        }
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Chart generation failed:', error);
      
      // Create fallback charts
      charts = [];
      for (let i = 0; i < numberOfCharts; i++) {
        const chartType = chartTypes[i] || 'bar';
        console.log(`Fallback Chart ${i + 1}: User selected "${chartType}", using "${chartType}"`);
        charts.push(createFallbackChart(chartType, i));
      }
      
      diagnostics.sources = ["Fallback Data Generator"];
      diagnostics.notes = `Fallback: Generated ${charts.length} generic charts due to parsing error for request: ${prompt.slice(0, 100)}`;
      
      console.log(`⚠️ Created ${charts.length} fallback charts in ${Date.now() - startTime}ms`);
    }

    let insights: any[] = [];
    if (generateDetailedReports) {
      try {
        const insightsPrompt = `Generate ${numberOfCharts} key insights based on the following chart configurations: ${JSON.stringify(charts)}.
        Focus on actionable intelligence and key trends. Return a JSON array of strings.`;

        console.log('OpenAI API attempt 2/2 - timeout: 30000ms');

        const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not configured');
        }

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
                content: 'You are an expert data analyst. Extract key insights from chart data and provide actionable intelligence.'
              },
              { role: 'user', content: insightsPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.5
          }),
        });

        if (response.ok) {
          console.log('OpenAI API success on attempt 2');
          const data = await response.json();
          const content = data.choices[0].message.content;

          try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              insights = JSON.parse(jsonMatch[0]);
              diagnostics.sources.push("OpenAI GPT-4o-mini");
              diagnostics.notes += `, Generated ${insights.length} insights using AI`;
            } else {
              throw new Error('No valid JSON found in insights response');
            }
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Failed content:', content);
            throw parseError;
          }
        } else {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      } catch (error) {
        console.error('Insights generation failed:', error);
        insights = [`Failed to generate insights: ${error.message}`];
        diagnostics.notes += `, Failed to generate insights: ${error.message}`;
      }
    }

    let detailedReport = null;
    if (generateDetailedReports) {
      try {
        const reportPrompt = `Generate a detailed report based on the following data:
        - Charts: ${JSON.stringify(charts)}
        - Insights: ${JSON.stringify(insights)}
        - Skills Intelligence: ${JSON.stringify(skillsIntelligence)}
        - Current Policies Report: ${JSON.stringify(currentPoliciesReport)}
        - Policy Improvements Report: ${JSON.stringify(policyImprovementsReport)}
        
        The report should include an executive summary, key findings, detailed analysis of each chart and insight, and policy recommendations.
        Focus on actionable intelligence and key trends. Return a JSON object with a "report" key containing the full report text.`;

        console.log('OpenAI API attempt 3/3 - timeout: 60000ms');

        const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openAIApiKey) {
          throw new Error('OpenAI API key not configured');
        }

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
                content: 'You are an expert data analyst and policy advisor. Generate a comprehensive report based on the provided data, including charts, insights, skills intelligence, and policy reports. Focus on actionable intelligence and key trends.'
              },
              { role: 'user', content: reportPrompt }
            ],
            max_tokens: 4000,
            temperature: 0.5
          }),
        });

        if (response.ok) {
          console.log('OpenAI API success on attempt 3');
          const data = await response.json();
          const content = data.choices[0].message.content;

          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              detailedReport = JSON.parse(jsonMatch[0]);
              diagnostics.sources.push("OpenAI GPT-4o-mini");
              diagnostics.notes += ', Generated detailed report using AI';
            } else {
              throw new Error('No valid JSON found in detailed report response');
            }
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Failed content:', content);
            throw parseError;
          }
        } else {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      } catch (error) {
        console.error('Detailed report generation failed:', error);
        detailedReport = { report: `Failed to generate detailed report: ${error.message}` };
        diagnostics.notes += `, Failed to generate detailed report: ${error.message}`;
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Complete! Generated ${charts.length} charts, ${insights.length} insights in ${totalTime}ms total`);

    return new Response(JSON.stringify({
      charts,
      diagnostics,
      insights,
      policyData,
      detailedReport,
      skillsIntelligence,
      currentPoliciesReport,
      policyImprovementsReport
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
