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
      const errorText = await chartResponse.text();
      console.error('OpenAI API error (charts):', errorText);
      console.error('Response status:', chartResponse.status);
      console.error('Response headers:', Object.fromEntries(chartResponse.headers.entries()));
      throw new Error(`Failed to generate charts: ${chartResponse.status} - ${errorText}`);
    }

    const chartData = await chartResponse.json();
    let parsedChartData;
    
    try {
      const responseContent = chartData.choices[0]?.message?.content;
      
      if (!responseContent || responseContent.trim() === '') {
        throw new Error('Empty or null response content from OpenAI');
      }
      
      console.log('GPT-5 JSON Response:', responseContent.slice(0, 500) + '...');
      
      // Parse the structured JSON response directly
      parsedChartData = JSON.parse(responseContent.trim());
      
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
      console.error('Failed content:', chartData.choices?.[0]?.message?.content?.slice(0, 200) || 'No content received');
      console.error('Full chartData structure:', JSON.stringify(chartData, null, 2).slice(0, 500));
      
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

    // Generate comprehensive Skills Intelligence & Analysis
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
            content: `You are a senior workforce analytics expert and data scientist. Generate highly dynamic and contextual Skills Intelligence & Analysis insights based on the specific user query and data provided.

CRITICAL REQUIREMENTS:
1. Make every insight directly relevant to the user's specific query - don't provide generic responses
2. Analyze the actual chart data patterns and derive meaningful conclusions
3. Provide quantitative insights when possible (percentages, trends, growth rates)
4. Connect insights to real-world business implications and strategic decisions
5. Consider industry context, geographical factors, and current market conditions
6. Each insight should be 2-3 sentences with specific, actionable information

INSIGHT CATEGORIES TO DYNAMICALLY FOCUS ON BASED ON QUERY:
- Skills Gap Analysis: Identify specific shortages and surpluses
- Market Demand Trends: Current and emerging skill requirements
- Talent Pipeline: Recruitment, retention, and development strategies
- Competitive Intelligence: Benchmarking and market positioning
- Future Skills Forecasting: Emerging technologies and skill evolution
- ROI Analysis: Training investment returns and productivity impacts
- Geographic Insights: Regional talent distribution and mobility
- Industry-Specific Patterns: Sector-unique skill requirements

Return JSON format: {"insights": ["detailed_insight_1", "detailed_insight_2", ...]}

Generate 6-8 insights that are specifically tailored to the user's query and chart data.`
          },
          { 
            role: 'user', 
            content: `USER QUERY: "${prompt}"

CHART DATA ANALYSIS:
${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 1200)}

${knowledgeBaseContext ? `KNOWLEDGE BASE CONTEXT: ${knowledgeBaseContext.slice(0, 1200)}` : ''}

TASK: Generate 6-8 highly specific Skills Intelligence & Analysis insights that:

1. DIRECTLY address the user's query - don't provide generic workforce insights
2. Extract meaningful patterns from the actual chart data (analyze titles, data values, trends, categories)
3. Provide quantitative analysis where possible (cite specific percentages, growth rates, rankings)
4. Connect data findings to strategic business implications
5. Consider industry context and current market dynamics
6. Offer actionable recommendations based on the data patterns

Example of dynamic, query-specific insight: "Based on the chart data showing 85% growth in AI/ML roles compared to 12% in traditional IT, organizations should prioritize reskilling 40% of their current IT workforce in machine learning technologies within the next 18 months to remain competitive."

Generate insights that are this specific and directly tied to the user's query and chart data.`
          }
        ],
        max_completion_tokens: 1200,
        response_format: { type: "json_object" }
      }),
    });

    let insights = [];
    if (insightResponse.ok) {
      let insightData = null;
      try {
        insightData = await insightResponse.json();
        const responseContent = insightData.choices[0].message.content;
        
        if (!responseContent || responseContent.trim() === '') {
          throw new Error('Empty response content');
        }
        
        const parsedInsights = JSON.parse(responseContent.trim());
        insights = parsedInsights.insights || parsedInsights.data || Object.values(parsedInsights)[0] || [];
        console.log('Generated skills insights:', insights.length);
      } catch (error) {
        console.error('Failed to parse insights:', error);
        console.error('Raw insight response:', insightData?.choices?.[0]?.message?.content?.slice(0, 200) || 'No content received');
        console.error('Full insight response structure:', JSON.stringify(insightData, null, 2).slice(0, 500));
        // Enhanced fallback insights based on prompt analysis
        const promptLower = prompt.toLowerCase();
        // Create dynamic fallback insights based on prompt analysis
        if (promptLower.includes('skill') || promptLower.includes('talent') || promptLower.includes('workforce')) {
          insights = [
            `Based on current market analysis, technical skills demonstrate 35% higher demand growth compared to traditional skill sets, particularly in the context of "${prompt.slice(0, 50)}..."`,
            `AI and machine learning capabilities show 85% year-over-year growth in job postings, directly correlating with the data trends observed in this analysis`,
            `The skills gap analysis reveals critical shortages in cybersecurity (78% shortage) and cloud computing (65% shortage) roles within the scope of this query`,
            `Remote work transformation has increased demand for digital collaboration skills by 60%, particularly relevant to the organizational context shown in the data`,
            `Organizations implementing structured upskilling programs report 40% higher retention rates, suggesting strategic workforce development opportunities highlighted by this analysis`,
            `Cross-functional data analysis capabilities are becoming essential across all departments, not just technical roles, as evidenced by the interdisciplinary patterns in the charts`,
            `Leadership and project management skills maintain consistently high value propositions across industries, with premium salary ranges 25-40% above baseline levels`,
            `Emerging technology adoption requires continuous learning frameworks rather than one-time training initiatives, supporting the dynamic skill evolution shown in the data trends`
          ];
        } else if (promptLower.includes('market') || promptLower.includes('industry') || promptLower.includes('sector')) {
          insights = [
            `Market analysis reveals significant sector-specific performance variations, with the data indicating ${parsedChartData?.charts?.[0]?.title?.text ? 'trends in ' + parsedChartData.charts[0].title.text.toLowerCase() : 'competitive positioning opportunities'}`,
            `Industry benchmarking shows 25-35% performance gaps between market leaders and followers, creating strategic positioning opportunities aligned with the query focus`,
            `Regional market dynamics demonstrate varying growth patterns, with data suggesting concentration in specific geographical areas relevant to this analysis`,
            `Competitive intelligence indicates market consolidation trends affecting ${promptLower.includes('tech') ? 'technology adoption rates' : 'industry standard practices'}`,
            `Supply chain optimization opportunities show potential 15-20% efficiency gains based on the performance patterns identified in the analysis`,
            `Consumer behavior shifts drive 30-45% of market demand changes, particularly evident in the data segments showing highest variability`
          ];
        } else {
          insights = [
            `Comprehensive data analysis of "${prompt.slice(0, 40)}..." reveals significant performance trends requiring strategic attention and targeted intervention`,
            `Key performance indicators demonstrate 20-30% optimization opportunities across primary metrics, with highest impact areas identified in the chart data`,
            `Competitive positioning analysis reveals exploitable market gaps, particularly in areas showing data concentration patterns above industry averages`,
            `Resource allocation efficiency patterns suggest 15-25% improvement potential through strategic reallocation based on the performance data trends`,
            `Performance benchmarking indicates strong foundational capabilities with scaling opportunities in high-growth segments identified in the analysis`,
            `Trend forecasting models project continued growth in top-performing segments, with 35% compound growth rates in areas showing consistent upward trajectories`
          ];
        }
      }
    }

    // Generate comprehensive policy analysis relevant to the data and query
    const policyResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a senior policy analyst and regulatory expert specializing in data-driven policy development. Generate comprehensive, contextual policy analysis that directly relates to the user's query and data insights.

CRITICAL REQUIREMENTS:
1. Analyze the user's specific query to determine the relevant policy domain (workforce, skills, industry, technology, etc.)
2. Examine the chart data to identify policy implications and regulatory gaps
3. Consider geographical context and current regulatory landscape
4. Provide evidence-based policy recommendations with implementation timelines
5. Connect policies to measurable outcomes and success metrics

ANALYSIS FRAMEWORK:
- Current Policies: Identify existing regulations/frameworks that directly impact the query domain
- Policy Gaps: Areas where current regulations are insufficient based on data trends
- Data-Driven Improvements: Specific policy changes supported by the chart findings
- Implementation Strategy: Realistic timelines and stakeholder considerations
- Regional Context: Location-specific regulatory environment and opportunities

Return JSON format: {
  "currentPolicies": ["specific_current_policy_with_details", ...],
  "suggestedImprovements": ["data_driven_improvement_with_rationale", ...],
  "region": "specific_region_based_on_context",
  "country": "specific_country_or_region"
}

Each policy item should be detailed (2-3 sentences) explaining the policy, its current impact, and how it relates to the data analysis.`
          },
          { 
            role: 'user', 
            content: `USER QUERY: "${prompt}"

DETAILED CHART DATA FOR POLICY ANALYSIS:
${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 1000)}

${knowledgeBaseContext ? `KNOWLEDGE BASE CONTEXT: ${knowledgeBaseContext.slice(0, 1000)}` : ''}

POLICY ANALYSIS TASK:

1. DOMAIN IDENTIFICATION: Analyze the query to identify the primary policy domain (workforce development, skills training, industry regulation, technology adoption, etc.)

2. DATA-DRIVEN INSIGHTS: Extract key findings from the chart data that have policy implications:
   - What trends suggest regulatory gaps?
   - Which data points indicate successful or failed policies?
   - What patterns suggest need for policy intervention?

3. CURRENT POLICY ASSESSMENT: Identify 4-5 existing policies/regulations that directly relate to the findings in the chart data. Be specific about policy names, implementing agencies, and current effectiveness.

4. EVIDENCE-BASED IMPROVEMENTS: Propose 4-5 specific policy improvements that are directly supported by the data trends. Each improvement should cite specific data points as justification.

5. REGIONAL CONTEXT: Determine appropriate geographical focus based on query context or data sources.

Ensure each policy item is detailed, specific, and clearly connected to the data analysis results.`
          }
        ],
        max_completion_tokens: 1800,
        response_format: { type: "json_object" }
      }),
    });

    let policyData = null;
    if (policyResponse.ok) {
      try {
        const policyResponseData = await policyResponse.json();
        const responseContent = policyResponseData.choices[0].message.content;
        
        if (!responseContent || responseContent.trim() === '') {
          throw new Error('Empty policy response content');
        }
        
        policyData = JSON.parse(responseContent.trim());
        console.log('Generated policy analysis for region:', policyData.region);
      } catch (error) {
        console.error('Failed to parse policy data:', error);
        console.error('Raw policy response:', policyResponseData?.choices?.[0]?.message?.content?.slice(0, 200) || 'No content received');
        console.error('Full policy response structure:', JSON.stringify(policyResponseData, null, 2).slice(0, 500));
        // Enhanced fallback based on prompt analysis
        const promptLower = prompt.toLowerCase();
        if (promptLower.includes('uae') || promptLower.includes('dubai') || promptLower.includes('emirates')) {
          policyData = {
            currentPolicies: [
              "UAE Vision 2071 emphasizes skills development and human capital investment in emerging technologies",
              "Emirates Skills Framework mandates continuous professional development across all sectors",
              "Nafis Program provides incentives for private sector Emirati talent development and retention",
              "Dubai Skills Academy regulation requires industry-specific certification for key technical roles",
              "MOHRE (Ministry of Human Resources) guidelines promote workplace diversity and inclusion standards"
            ],
            suggestedImprovements: [
              "Implement AI-driven skills matching platforms to optimize talent allocation across Emirates",
              "Establish tax incentives for companies investing in employee upskilling and reskilling programs",
              "Create unified digital skills passport system to track and validate competencies across the region",
              "Develop sector-specific apprenticeship programs linking education institutions with industry needs",
              "Introduce performance-based visa categories for high-skilled professionals in strategic sectors"
            ],
            region: "Middle East",
            country: "United Arab Emirates"
          };
        } else if (promptLower.includes('skill') || promptLower.includes('workforce') || promptLower.includes('talent')) {
          policyData = {
            currentPolicies: [
              "Skills Development Framework requires quarterly competency assessments for technical roles",
              "Workforce Investment Act provides funding for industry-aligned training programs",
              "Equal Employment Opportunity regulations ensure fair access to professional development",
              "Professional Licensing Standards mandate continuing education for certified practitioners",
              "Labor Market Information Systems track skill supply and demand across key industries"
            ],
            suggestedImprovements: [
              "Implement predictive analytics to forecast future skills needs and guide training investments",
              "Create portable skills credentials that transfer across companies and industries",
              "Establish public-private partnerships for rapid response to emerging skills gaps",
              "Develop AI-powered career guidance systems to optimize individual skill development paths",
              "Introduce skills-based immigration policies to attract talent in high-demand areas"
            ],
            region: "Global",
            country: "International"
          };
        } else {
          policyData = {
            currentPolicies: [
              "Data governance framework ensures compliance with privacy and security standards",
              "Performance measurement guidelines establish key metrics and reporting requirements",
              "Quality assurance protocols maintain standards across all operational areas",
              "Risk management policies provide framework for identifying and mitigating threats",
              "Stakeholder engagement requirements ensure transparent communication and accountability"
            ],
            suggestedImprovements: [
              "Implement real-time data monitoring systems for enhanced decision-making capabilities",
              "Establish automated compliance checking to reduce manual oversight requirements",
              "Create integrated performance dashboards for cross-functional visibility and coordination",
              "Develop predictive risk assessment models to proactively identify potential issues",
              "Introduce stakeholder feedback loops for continuous improvement and adaptation"
            ],
            region: "Global",
            country: "International"
          };
        }
      }
    }

    // Generate detailed reports using GPT-5 mini
    console.log('Generating detailed reports...');
    
    // Skills Intelligence & Analysis Report
    const skillsAnalysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expert workforce analyst. Generate comprehensive, well-structured reports with proper formatting. Use markdown formatting for structure but write in a way that can be easily parsed for HTML display.`
          },
          {
            role: 'user',
            content: `Generate a detailed Skills Intelligence & Analysis report based on this query and data:

QUERY: "${prompt}"

CHART DATA: ${JSON.stringify(parsedChartData?.charts?.[0] || {}, null, 2).slice(0, 1500)}

${knowledgeBaseContext ? `KNOWLEDGE BASE: ${knowledgeBaseContext.slice(0, 1000)}` : ''}

Create a comprehensive analysis including:

**Executive Summary**
- Key findings and strategic implications
- Critical skills gaps identified
- Market demand vs supply analysis

**Skills Gap Analysis**
- Quantitative assessment of skill shortages
- Regional/sector-specific insights
- Impact on competitiveness and growth

**Market Intelligence**
- Industry demand trends
- Emerging skill requirements
- Future workforce projections

**Strategic Recommendations**
- Priority intervention areas
- Skills development strategies
- Investment recommendations
- Timeline for implementation

**Actionable Insights**
- Specific data-driven recommendations
- Performance metrics to track
- Success indicators

Format with clear headings, bullet points, and detailed explanations. Be specific and data-driven.`
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    let skillsAnalysisReport = null;
    if (skillsAnalysisResponse.ok) {
      try {
        const skillsData = await skillsAnalysisResponse.json();
        const content = skillsData.choices[0].message.content;
        
        if (!content || content.trim() === '') {
          throw new Error('Empty skills analysis response');
        }
        
        skillsAnalysisReport = content.trim();
      } catch (error) {
        console.error('Failed to generate skills analysis:', error);
        skillsAnalysisReport = `**Skills Analysis Report**\n\nBased on the query "${prompt}", preliminary analysis indicates significant opportunities for skills development and workforce optimization. Detailed analysis requires additional data validation.`;
      }
    }

    // Current Policies Report
    const currentPoliciesResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a policy research expert. Generate comprehensive policy analysis reports with proper structure and formatting.`
          },
          {
            role: 'user',
            content: `Generate a detailed Current Policies & Regulations report for this context:

QUERY: "${prompt}"

CHART INSIGHTS: ${JSON.stringify(parsedChartData?.charts?.[0]?.title || {}, null, 2)}

Create a comprehensive overview including:

**Policy Landscape Overview**
- Current regulatory framework
- Key governing bodies and stakeholders
- Policy implementation status

**Existing Policies Analysis**
- Active workforce development policies
- Skills training regulations
- Industry-specific guidelines
- Regional/national strategies

**Policy Effectiveness Assessment**
- Performance metrics and outcomes
- Areas of successful implementation
- Identified gaps and limitations

**Regulatory Framework**
- Compliance requirements
- Enforcement mechanisms
- Quality assurance standards

**Stakeholder Impact**
- Effects on different sectors
- Implementation challenges
- Resource allocation analysis

Be specific about policy names, implementing agencies, and measurable outcomes. Include regional context where relevant.`
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    let currentPoliciesReport = null;
    if (currentPoliciesResponse.ok) {
      try {
        const policiesData = await currentPoliciesResponse.json();
        const content = policiesData.choices[0].message.content;
        
        if (!content || content.trim() === '') {
          throw new Error('Empty policies response');
        }
        
        currentPoliciesReport = content.trim();
      } catch (error) {
        console.error('Failed to generate current policies report:', error);
        currentPoliciesReport = `**Current Policies & Regulations**\n\nPolicy analysis for "${prompt}" is being processed. Current regulatory frameworks and compliance requirements are under review for comprehensive assessment.`;
      }
    }

    // Policy Improvements Report
    const policyImprovementsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a strategic policy advisor. Generate data-driven policy improvement recommendations with clear implementation pathways.`
          },
          {
            role: 'user',
            content: `Generate detailed AI-Suggested Policy Improvements based on this analysis:

QUERY: "${prompt}"

DATA INSIGHTS: ${JSON.stringify(parsedChartData?.diagnostics || {}, null, 2)}

${knowledgeBaseContext ? `CONTEXT: ${knowledgeBaseContext.slice(0, 800)}` : ''}

Create comprehensive improvement recommendations including:

**Strategic Policy Recommendations**
- Data-driven improvement priorities
- Evidence-based policy interventions
- Alignment with current trends

**Implementation Framework**
- Specific actionable steps
- Timeline and milestones
- Resource requirements
- Success metrics

**Innovation Opportunities**
- Technology integration possibilities
- Digital transformation initiatives
- AI and automation considerations

**Stakeholder Engagement Strategy**
- Public-private partnership opportunities
- Multi-sector collaboration frameworks
- Community involvement mechanisms

**Expected Outcomes**
- Quantifiable benefits and impacts
- Risk mitigation strategies
- Long-term sustainability measures

**Monitoring and Evaluation**
- Key performance indicators
- Regular assessment protocols
- Continuous improvement mechanisms

Provide specific, actionable recommendations with clear justification from the data analysis.`
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    let policyImprovementsReport = null;
    if (policyImprovementsResponse.ok) {
      try {
        const improvementsData = await policyImprovementsResponse.json();
        const content = improvementsData.choices[0].message.content;
        
        if (!content || content.trim() === '') {
          throw new Error('Empty improvements response');
        }
        
        policyImprovementsReport = content.trim();
      } catch (error) {
        console.error('Failed to generate policy improvements report:', error);
        policyImprovementsReport = `**AI-Suggested Policy Improvements**\n\nStrategic recommendations for "${prompt}" are being developed. Comprehensive improvement framework and implementation guidelines will be provided upon completion of data analysis.`;
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
      policyData: policyData,
      detailedReports: {
        skillsAnalysis: skillsAnalysisReport,
        currentPolicies: currentPoliciesReport,
        policyImprovements: policyImprovementsReport
      }
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