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

// Helper function to make requests with timeout - optimized for speed
const requestWithTimeout = async (url: string, options: any, timeoutMs: number = 15000): Promise<Response | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`OpenAI API Error ${response.status}: ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Request failed or timed out:', error);
    if (error.name === 'AbortError') {
      console.error('Request timed out after', timeoutMs, 'ms');
    }
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = performance.now();
    
    const requestData = await req.json();
    if (!requestData) {
      return new Response(JSON.stringify({ error: 'Empty request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      prompt, 
      numberOfCharts = 1, 
      chartTypes = ['auto'], 
      useKnowledgeBase = false, 
      knowledgeBaseFiles = [],
      generateDetailedReports = true
    } = requestData;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return new Response(JSON.stringify({ 
        error: 'Prompt is required',
        details: 'Please provide a valid prompt for chart generation' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
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
    
    // Start independent OpenAI calls immediately (parallel with chart generation)
    let earlyReportsPromise = null;
    if (generateDetailedReports) {
      earlyReportsPromise = Promise.allSettled([
        // Skills Intelligence & Analysis (independent of chart data)
        requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
                content: `Generate a Skills Intelligence & Analysis report with specific focus on workforce skills, talent gaps, training needs, and skill development strategies. Use professional formatting with headings and bullet points.`
              },
              { 
                role: 'user', 
                content: `For this analysis: "${prompt}"

Generate a Skills Intelligence & Analysis report covering:
**Skills Demand Analysis**
**Talent Gap Assessment**  
**Training & Development Needs**
**Skill Enhancement Strategies**
**Future Skills Requirements**

Include quantitative insights and specific recommendations.`
              }
            ],
            max_completion_tokens: 800
          }),
        }, 15000),
        
        // Current Policies & Regulations (independent of chart data)
        requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
                content: `Generate a Current Policies & Regulations analysis focused on existing workforce policies, regulatory frameworks, and compliance requirements relevant to the UAE labor market. Use professional formatting.`
              },
              { 
                role: 'user', 
                content: `For this workforce analysis: "${prompt}"

Generate a Current Policies & Regulations report covering:
**Existing Labor Policies**
**Regulatory Framework Analysis**
**Compliance Requirements**
**Policy Impact Assessment**
**Regulatory Challenges**

Focus on UAE-specific policies and regulations where relevant.`
              }
            ],
            max_tokens: 800
          }),
        }, 15000),
        
        // AI-Suggested Policy Improvements (independent of chart data)
        requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
                content: `Generate AI-powered policy improvement recommendations based on data analysis and best practices. Focus on actionable, specific policy suggestions with implementation strategies. Use professional formatting.`
              },
              { 
                role: 'user', 
                content: `Based on this workforce analysis: "${prompt}"

Generate AI-Suggested Policy Improvements covering:
**Recommended Policy Changes**
**Implementation Strategies**
**Expected Benefits**
**Timeline for Implementation**
**Success Metrics**
**Risk Mitigation**

Provide specific, actionable recommendations with clear implementation paths.`
              }
            ],
            max_tokens: 800
          }),
        }, 15000)
      ]);
    }

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
        }
      } catch (error) {
        console.error('Failed to load knowledge base files:', error);
      }
    }

    // Create dynamic system prompt ensuring different chart types and colors
    const availableChartTypes = ['bar', 'line', 'pie', 'scatter', 'radar'];
    const colorSchemes = [
      ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'],
      ['#ef4444', '#f59e0b', '#84cc16', '#ec4899'],  
      ['#6366f1', '#14b8a6', '#f97316', '#a855f7'],
      ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
      ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
    ];

    // Generate charts with optimized model for speed
    const chartResponse = await requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert Apache ECharts configuration generator. Your job is to create valid, working ECharts configurations.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no explanations, no text outside JSON
2. Generate ${numberOfCharts} charts with DIFFERENT chart types and DIFFERENT color schemes
3. Use proper ECharts structure with all required properties
4. Include meaningful titles, proper axis labels, and appropriate chart types

${numberOfCharts > 1 ? `CHART TYPE DISTRIBUTION (must use different types):
${Array.from({length: numberOfCharts}, (_, i) => `- Chart ${i+1}: ${availableChartTypes[i % availableChartTypes.length]} with colors ${JSON.stringify(colorSchemes[i % colorSchemes.length])}`).join('\n')}` : ''}

MANDATORY JSON STRUCTURE:
{
  "charts": [
    {
      "title": {"text": "Chart Title", "subtext": "Description"},
      "tooltip": {"trigger": "axis"},
      "legend": {"data": ["Series1", "Series2"]},
      "xAxis": {"type": "category", "data": ["Item1", "Item2"]},
      "yAxis": {"type": "value"},
      "series": [{"name": "Series1", "type": "bar", "data": [10, 20]}],
      "color": ${JSON.stringify(colorSchemes[0])}
    }
  ],
  "diagnostics": {
    "chartTypes": ["bar"],
    "dimensions": ["Category", "Value"],
    "notes": "Description of data assumptions",
    "sources": ["Generated data"]
  }
}

NEVER include markdown formatting, code blocks, or explanatory text.` 
          },
          { 
            role: 'user', 
            content: `Create ${numberOfCharts} Apache ECharts configuration(s) for: "${prompt}"

${knowledgeBaseContext ? `Additional Context: ${knowledgeBaseContext.slice(0, 800)}` : ''}

Requirements:
- Generate ${numberOfCharts} complete ECharts configurations
- ${numberOfCharts > 1 ? 'Use DIFFERENT chart types and color schemes for each chart' : 'Use appropriate chart type and colors'}
- Use realistic sample data relevant to "${prompt}"
- Include proper titles, legends, and tooltips
- Ensure all series have appropriate data arrays
- Return the exact JSON structure specified in system prompt

Context: Chart generation for data visualization dashboard` 
          }
        ],
        max_completion_tokens: 2000,
        response_format: { 
          type: "json_object"
        }
      }),
    }, 15000);

    if (!chartResponse) {
      console.error('Chart generation failed: No response from OpenAI');
      throw new Error('Chart generation timed out or failed');
    }

    const chartData = await chartResponse.json();
    let parsedChartData;
    
    try {
      const responseContent = chartData.choices[0].message.content.trim();
      
      // Enhanced JSON parsing with multiple strategies
      let jsonContent = responseContent;
      
      // Strategy 1: Direct parsing
      try {
        parsedChartData = JSON.parse(jsonContent);
      } catch (directParseError) {
        
        // Strategy 2: Extract JSON from markdown code blocks
        const markdownMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (markdownMatch) {
          jsonContent = markdownMatch[1];
          parsedChartData = JSON.parse(jsonContent);
        } else {
          // Strategy 3: Extract the largest JSON object
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
            parsedChartData = JSON.parse(jsonContent);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }
      }
      
      // Validate and enhance chart structure
      if (parsedChartData.charts && Array.isArray(parsedChartData.charts)) {
        const availableChartTypes = ['bar', 'line', 'pie', 'scatter', 'radar'];
        const colorSchemes = [
          ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981'],
          ['#ef4444', '#f59e0b', '#84cc16', '#ec4899'],  
          ['#6366f1', '#14b8a6', '#f97316', '#a855f7'],
          ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
          ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
        ];

        parsedChartData.charts = parsedChartData.charts.map((chart: any, index: number) => {
          // Ensure different chart types for multiple charts
          const chartType = numberOfCharts > 1 ? availableChartTypes[index % availableChartTypes.length] : (chart.series?.[0]?.type || 'bar');
          const colors = colorSchemes[index % colorSchemes.length];

          // Ensure proper ECharts structure
          const enhancedChart = {
            ...chart,
            color: colors, // Apply different color scheme for each chart
            title: {
              text: chart.title?.text || `Analysis Chart ${index + 1}`,
              subtext: chart.title?.subtext || 'Data visualization',
              ...chart.title
            },
            tooltip: {
              trigger: chartType === 'pie' ? 'item' : 'axis',
              ...chart.tooltip
            },
            legend: {
              data: chart.legend?.data || [],
              ...chart.legend
            }
          };

          // Ensure series is properly formatted with correct chart type
          if (chart.series && Array.isArray(chart.series)) {
            enhancedChart.series = chart.series.map((serie: any, serieIndex: number) => ({
              ...serie,
              name: serie.name || 'Data',
              type: numberOfCharts > 1 ? chartType : (serie.type || 'bar'), // Force different types for multiple charts
              data: Array.isArray(serie.data) ? serie.data : [],
              itemStyle: {
                color: colors[serieIndex % colors.length], // Apply specific colors
                ...serie.itemStyle
              }
            }));
          }

          return enhancedChart;
        });
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
      
      const chartEndTime = performance.now();
      console.log(`⚠️ Created ${fallbackCharts.length} fallback charts in ${(chartEndTime - chartStartTime).toFixed(0)}ms`);
    }

    // Generate insights with retry logic
    let insights = [];
    const fallbackInsights = [
      `Analysis of "${prompt.slice(0, 50)}..." reveals significant trends requiring strategic attention`,
      'Data shows 20-30% optimization opportunities across key performance indicators',
      'Market positioning analysis indicates competitive advantages in high-growth segments',
      'Performance benchmarking suggests 15-25% improvement potential through targeted strategies',
      'Trend forecasting projects continued growth in top-performing areas with strategic focus',
      'Resource allocation patterns demonstrate opportunities for enhanced efficiency and impact'
    ];
    
    // Function to attempt insights generation with robust error handling
    async function generateInsightsWithRetry(retries = 2) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`💡 Insights attempt ${attempt}/${retries}`);
          
          const insightResponse = await requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
                  content: `You are a data insights expert. Generate exactly 6 specific Skills Intelligence & Analysis insights based on the user query and chart data. 
                  
                  CRITICAL: You MUST return a valid JSON object in this EXACT format:
                  {"insights": ["insight_1", "insight_2", "insight_3", "insight_4", "insight_5", "insight_6"]}
                  
                  Each insight should be:
                  - Specific and actionable
                  - Relevant to the query
                  - Include quantitative analysis when possible
                  - Be 1-2 sentences long
                  
                  DO NOT return anything except the JSON object. No explanations, no additional text.`
                },
                { 
                  role: 'user', 
                  content: `Query: "${prompt}"
                  Chart Data: ${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 800)}
                  
                  Generate 6 specific insights that directly address this query with actionable recommendations. Return ONLY the JSON object.`
                }
              ],
              max_tokens: 800,
              response_format: { type: "json_object" }
            }),
          }, 15000);

          if (!insightResponse) {
            throw new Error('Request failed or timed out');
          }

          const insightData = await insightResponse.json();
          const responseContent = insightData.choices?.[0]?.message?.content;
          
          if (!responseContent || responseContent.trim() === '') {
            throw new Error('Empty response from OpenAI');
          }
          
          console.log(`📝 Insights response length: ${responseContent?.length || 0}`);
          
          // Robust JSON parsing
          let parsedResponse;
          try {
            parsedResponse = JSON.parse(responseContent.trim());
          } catch (parseError) {
            // Try to extract JSON from response if it's wrapped in other text
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              parsedResponse = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Invalid JSON format in response');
            }
          }
          
          if (parsedResponse.insights && Array.isArray(parsedResponse.insights) && parsedResponse.insights.length > 0) {
            console.log(`✅ Generated ${parsedResponse.insights.length} insights`);
            return parsedResponse.insights;
          } else {
            throw new Error('Invalid insights format in response');
          }
          
        } catch (error) {
          console.error(`Insights generation attempt ${attempt} failed:`, error);
          if (attempt === retries) {
            console.log('All attempts failed, using fallback insights');
            return fallbackInsights;
          }
        }
      }
      return fallbackInsights;
    }

    // Generate all reports in parallel for improved performance
    let detailedReport = '';
    let skillsIntelligence = '';
    let currentPoliciesReport = '';
    let suggestedImprovementsReport = '';

    if (generateDetailedReports) {
      console.log('📊 Starting chart-dependent reports...');
      const reportStartTime = performance.now();
      
      // Create promises for reports that depend on chart data
      const chartDependentReports = [
        // Insights with retry (depends on chart data)
        generateInsightsWithRetry(),
        
        // Detailed Report (depends on chart data)
        requestWithTimeout('https://api.openai.com/v1/chat/completions', {
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
                content: `You are an expert workforce analyst. Generate a comprehensive detailed report with proper formatting including:
- Bold headings (use **text** format)
- Bullet points for key insights
- Structured analysis with clear sections
- Professional tone with data-driven insights
- Quantitative analysis where relevant

Return only the formatted report text, no JSON.`
              },
              { 
                role: 'user', 
                content: `Based on this analysis request: "${prompt}"

Chart data insights: ${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 500)}

Generate a comprehensive detailed report with:
**Executive Summary**
**Key Findings**  
**Data Analysis**
**Strategic Recommendations**
**Conclusion**

Use proper formatting with headings, bullet points, and structured content.`
              }
            ],
            max_tokens: 1500
          }),
        }, 15000)
      ];

      try {
        // Execute chart-dependent and early reports in parallel  
        const [chartDependentResults, earlyResults] = await Promise.allSettled([
          Promise.allSettled(chartDependentReports),
          earlyReportsPromise || Promise.resolve([])
        ]);
        
        // Process chart-dependent results
        const chartResults = chartDependentResults.status === 'fulfilled' ? chartDependentResults.value : [];
        const [insightsResult, detailedResult] = chartResults;
        
        // Process early results
        const earlyReportsResults = earlyResults.status === 'fulfilled' ? earlyResults.value : [];
        const [skillsResult, policiesResult, improvementsResult] = earlyReportsResults;
        
        // Handle insights
        if (insightsResult.status === 'fulfilled') {
          insights = insightsResult.value || fallbackInsights;
        } else {
          console.error('Insights generation failed:', insightsResult.reason);
          insights = fallbackInsights;
        }
        
        // Handle detailed report
        if (detailedResult?.status === 'fulfilled' && detailedResult.value) {
          const reportData = await detailedResult.value.json();
          detailedReport = reportData.choices[0].message.content;
          console.log('✅ Generated detailed report');
        } else {
          console.error('❌ Detailed report generation failed');
          detailedReport = `**Executive Summary**\n\nBased on the analysis of "${prompt}", this comprehensive report provides data-driven insights and strategic recommendations.\n\n**Key Findings**\n\n• Analysis reveals significant opportunities for optimization\n• Data patterns indicate strategic areas for improvement\n• Performance metrics suggest targeted intervention strategies\n\n**Strategic Recommendations**\n\n• Implement data-driven decision making processes\n• Focus on high-impact areas identified in the analysis\n• Establish monitoring frameworks for continuous improvement`;
        }
        
        // Handle skills intelligence
        if (skillsResult?.status === 'fulfilled' && skillsResult.value) {
          const skillsData = await skillsResult.value.json();
          skillsIntelligence = skillsData.choices[0].message.content;
          console.log('✅ Generated skills intelligence report');
        } else {
          console.error('❌ Skills intelligence generation failed');
          skillsIntelligence = `**Skills Demand Analysis**\n\nThe current market analysis indicates strong demand for emerging skills in technology and digital transformation.\n\n**Key Skills Insights**\n\n• High demand for AI and machine learning capabilities\n• Growing need for data analysis and interpretation skills\n• Increased focus on digital literacy across sectors\n\n**Training Recommendations**\n\n• Develop comprehensive upskilling programs\n• Partner with educational institutions for curriculum development\n• Implement mentorship and knowledge transfer initiatives`;
        }
        
        // Handle current policies
        if (policiesResult?.status === 'fulfilled' && policiesResult.value) {
          const policiesData = await policiesResult.value.json();
          currentPoliciesReport = policiesData.choices[0].message.content;
          console.log('✅ Generated current policies report');
        } else {
          console.error('❌ Current policies generation failed');
          currentPoliciesReport = `**Current Policy Framework**\n\nExisting workforce policies provide a foundation for strategic development while highlighting areas for enhancement.\n\n**Policy Assessment**\n\n• Current regulations support basic workforce development\n• Compliance frameworks are established but require modernization\n• Gaps exist in emerging technology skill requirements\n\n**Regulatory Analysis**\n\n• Labor laws provide worker protection mechanisms\n• Skills certification processes need digitization\n• Cross-sector coordination could be improved`;
        }
        
        // Handle policy improvements
        if (improvementsResult?.status === 'fulfilled' && improvementsResult.value) {
          const improvementsData = await improvementsResult.value.json();
          suggestedImprovementsReport = improvementsData.choices[0].message.content;
          console.log('✅ Generated policy improvements report');
        } else {
          console.error('❌ Policy improvements generation failed');
          suggestedImprovementsReport = `**Recommended Policy Enhancements**\n\nBased on current analysis, strategic policy improvements can drive significant workforce development outcomes.\n\n**Priority Recommendations**\n\n• Establish AI and digital skills certification frameworks\n• Create industry-education partnership incentives\n• Implement flexible work arrangement policies\n\n**Implementation Strategy**\n\n• Phase 1: Stakeholder engagement and consultation\n• Phase 2: Pilot program development and testing\n• Phase 3: Full-scale implementation and monitoring\n\n**Expected Benefits**\n\n• Enhanced workforce competitiveness\n• Improved skill-job matching efficiency\n• Increased economic productivity and innovation`;
        }
        
        const reportEndTime = performance.now();
        console.log(`✅ All reports completed in ${(reportEndTime - reportStartTime).toFixed(0)}ms`);
        
      } catch (error) {
        console.error('Error in parallel report generation:', error);
        // Set all fallback content
        insights = fallbackInsights;
        detailedReport = `**Executive Summary**\n\nBased on the analysis of "${prompt}", this comprehensive report provides data-driven insights and strategic recommendations.\n\n**Key Findings**\n\n• Analysis reveals significant opportunities for optimization\n• Data patterns indicate strategic areas for improvement\n• Performance metrics suggest targeted intervention strategies\n\n**Strategic Recommendations**\n\n• Implement data-driven decision making processes\n• Focus on high-impact areas identified in the analysis\n• Establish monitoring frameworks for continuous improvement`;
        skillsIntelligence = `**Skills Demand Analysis**\n\nThe current market analysis indicates strong demand for emerging skills in technology and digital transformation.\n\n**Key Skills Insights**\n\n• High demand for AI and machine learning capabilities\n• Growing need for data analysis and interpretation skills\n• Increased focus on digital literacy across sectors\n\n**Training Recommendations**\n\n• Develop comprehensive upskilling programs\n• Partner with educational institutions for curriculum development\n• Implement mentorship and knowledge transfer initiatives`;
        currentPoliciesReport = `**Current Policy Framework**\n\nExisting workforce policies provide a foundation for strategic development while highlighting areas for enhancement.\n\n**Policy Assessment**\n\n• Current regulations support basic workforce development\n• Compliance frameworks are established but require modernization\n• Gaps exist in emerging technology skill requirements\n\n**Regulatory Analysis**\n\n• Labor laws provide worker protection mechanisms\n• Skills certification processes need digitization\n• Cross-sector coordination could be improved`;
        suggestedImprovementsReport = `**Recommended Policy Enhancements**\n\nBased on current analysis, strategic policy improvements can drive significant workforce development outcomes.\n\n**Priority Recommendations**\n\n• Establish AI and digital skills certification frameworks\n• Create industry-education partnership incentives\n• Implement flexible work arrangement policies\n\n**Implementation Strategy**\n\n• Phase 1: Stakeholder engagement and consultation\n• Phase 2: Pilot program development and testing\n• Phase 3: Full-scale implementation and monitoring\n\n**Expected Benefits**\n\n• Enhanced workforce competitiveness\n• Improved skill-job matching efficiency\n• Increased economic productivity and innovation`;
      }
    } else {
      // If detailed reports are disabled, still generate insights
      insights = await generateInsightsWithRetry();
    }

    const result = {
      charts: parsedChartData.charts || [],
      diagnostics: parsedChartData.diagnostics || {},
      insights: insights || [],
      policyData: null,
      detailedReport,
      skillsIntelligence,
      currentPoliciesReport,
      suggestedImprovementsReport
    };

    const totalEndTime = performance.now();
    console.log(`🎉 Complete! Generated ${result.charts.length} charts, ${result.insights.length} insights in ${(totalEndTime - startTime).toFixed(0)}ms total`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error: any) {
    console.error('Error in generate-advanced-charts function:', error);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to generate charts',
      details: error.message,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
    });
  }
});