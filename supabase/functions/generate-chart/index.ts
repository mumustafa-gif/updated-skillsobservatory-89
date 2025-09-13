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
    const { prompt, knowledgeBaseFiles = [], persona = 'minister' } = await req.json();
    
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
    if (knowledgeBaseFiles.length > 0) {
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

    // Check if user is requesting map visualization
    const isMapRequest = prompt.toLowerCase().includes('map') || 
      prompt.toLowerCase().includes('geographic') || 
      prompt.toLowerCase().includes('location') ||
      prompt.toLowerCase().includes('region') ||
      prompt.toLowerCase().includes('spatial');

    // Create persona-specific system prompt for chart generation
    const getPersonaSystemPrompt = (persona: string) => {
      switch (persona) {
        case 'minister':
          return `You are a professional chart generation assistant creating executive-level visualizations for UAE Ministers and senior government officials. Focus on strategic insights, policy implications, and high-level KPIs. Generate valid Apache ECharts configuration JSON with enterprise-grade styling.`;
        case 'chro':
          return `You are a professional chart generation assistant creating workforce analytics dashboards for Chief Human Resources Officers. Focus on talent metrics, employee engagement, retention data, and organizational development insights. Generate valid Apache ECharts configuration JSON with enterprise-grade styling.`;
        case 'educationist':
          return `You are a professional chart generation assistant creating learning analytics dashboards for education leaders and policymakers. Focus on student outcomes, curriculum effectiveness, skill development metrics, and educational performance insights. Generate valid Apache ECharts configuration JSON with enterprise-grade styling.`;
        default:
          return `You are a professional chart generation assistant for data visualization. Generate valid Apache ECharts configuration JSON with enterprise-grade styling and accessibility.`;
      }
    };

    const systemPrompt = getPersonaSystemPrompt(persona) + ` Your task is to analyze data and create comprehensive, professional visualizations with detailed insights.

${isMapRequest ? `
IMPORTANT: For geographic/map requests, return a Mapbox configuration with this exact structure and ALWAYS use the colorful outdoor terrain style:
{
  "option": {
    "chartType": "Map Visualization",
    "title": {"text": "Title", "subtext": "Subtitle"},
    "mapStyle": "mapbox://styles/mapbox/outdoors-v12",
    "center": [longitude, latitude],
    "zoom": number,
    "markers": [{"coordinates": [lng, lat], "title": "Name", "description": "Details", "color": "#color"}]
  },
  "diagnostics": {
    "chartType": "Map Visualization",
    "dimensions": ["Geographic", "Data Points"],
    "notes": "Generated colorful outdoor terrain map visualization",
    "sources": ["Geographic data sources"]
  }
}

CRITICAL: Always use "mapbox://styles/mapbox/outdoors-v12" for the mapStyle property to show colorful terrain.
` : `
CRITICAL CHART REQUIREMENTS:
1. PERCENTAGE DATA CONVERSION: ALWAYS convert and display data as percentages:
   - If data is not in percentage format, convert it: (value/total)*100
   - Format all values with "%" symbol: "25.5%", "12.0%", etc.
   - For pie charts: Show both absolute values and percentages
   - For bar/line charts: Convert series data to percentage of total or relative percentage
   - Use proper percentage formatting in tooltips and labels

2. ENHANCED PROFESSIONAL LEGENDS: Include self-explanatory legends with:
   - Descriptive labels that explain what each data series represents
   - Include percentage values in legend labels where applicable: "Category A (35.2%)"
   - Professional color palette (#1f77b4, #ff7f0e, #2ca02c, #d62728, #9467bd, #8c564b, #e377c2, #7f7f7f, #bcbd22, #17becf)
   - Position at bottom-right of charts for optimal visibility
   - Rich text formatting with both absolute and percentage values
   - Include total count/sum in legend when relevant: "Total: 1,250 items (100%)"

3. DYNAMIC AXIS INFORMATION: Include comprehensive axis configuration:
   - Descriptive axis labels that explain what the data represents
   - ALWAYS show percentage units (%) in Y-axis for percentage data
   - Clear tick marks and grid lines with percentage formatting
   - Rotated labels if needed to prevent overlap

3. MULTI-COLOR SCHEMES: Use distinct color palettes:
   - Bar/Line charts: Professional blue gradient series
   - Pie charts: Diverse categorical colors
   - Heatmaps: Blue-to-red or green-to-red gradients with 5+ color stops
   - Treemaps: Hierarchical color schemes with distinct levels
   - Scatter plots: Color by category with transparency

4. TEXT VISIBILITY: Ensure all text is readable:
   - Minimum 12px font size for all labels
   - High contrast colors (dark text on light backgrounds)
   - Proper spacing to prevent overlaps
   - Truncation with tooltips for long labels

MANDATORY JSON STRUCTURE:
{
  "option": {
    "title": {
      "text": "Clear, descriptive title",
      "subtext": "Additional context or data source",
      "left": "center",
      "textStyle": {"fontSize": 18, "fontWeight": "bold"}
    },
    "legend": {
      "show": true,
      "type": "scroll",
      "orient": "horizontal",
      "right": "3%",
      "bottom": "3%",
      "data": ["Series 1 (25.5%)", "Series 2 (35.2%)", "Series 3 (39.3%)"],
      "textStyle": {"fontSize": 12, "color": "#333", "fontWeight": "600"},
      "itemWidth": 20,
      "itemHeight": 14,
      "itemGap": 18,
      "backgroundColor": "rgba(255,255,255,0.98)",
      "borderColor": "#d1d5db",
      "borderWidth": 1,
      "padding": [8, 12],
      "borderRadius": 8,
      "shadowColor": "rgba(0,0,0,0.1)",
      "shadowBlur": 8,
      "shadowOffsetY": 2
    },
    "tooltip": {
      "trigger": "axis|item",
      "backgroundColor": "#fff",
      "borderColor": "#ccc",
      "textStyle": {"color": "#333"}
    },
    "grid": {
      "left": "10%",
      "right": "10%",
      "bottom": "22%",
      "top": "20%",
      "containLabel": true
    },
    "xAxis": {
      "type": "category|value",
      "name": "X-Axis Label with Units",
      "nameLocation": "middle",
      "nameGap": 30,
      "axisLabel": {
        "rotate": 0,
        "fontSize": 11,
        "formatter": "{value}"
      }
    },
    "yAxis": {
      "type": "value|category",
      "name": "Y-Axis Label with Units",
      "nameLocation": "middle",
      "nameGap": 50,
      "axisLabel": {
        "fontSize": 11,
        "formatter": function(value) {
          if (typeof value === 'number') {
            return value + '%';
          }
          return value;
        }
      }
    },
    "series": [
      {
        "name": "Series Name",
        "type": "bar|line|pie|scatter|heatmap|treemap",
        "data": [...],
        "itemStyle": {
          "color": "#1f77b4"
        },
        "label": {
          "show": true,
          "position": "top|inside",
          "fontSize": 10,
          "formatter": function(params) {
            if (typeof params.value === 'number') {
              return params.value.toFixed(1) + '%';
            }
            return params.value;
          }
        }
      }
    ]
  },
  "diagnostics": {
    "chartType": "string",
    "dimensions": ["array of dimensions"],
    "notes": "string with assumptions made",
    "sources": ["array of source files used"]
  }
}

Supported chart types: bar, line, pie, scatter, radar, heatmap, treemap
`}

CHART-SPECIFIC PERCENTAGE ENHANCEMENTS:
- Bar/Line: Convert all values to percentages of total, show percentage labels on bars/points
- Pie: ALWAYS show percentages (calculate if not provided), format as "Label: 25.5%"
- Heatmap: Use percentage scale (0-100%), show percentage values in cells
- Treemap: Show both percentage of total and absolute values: "Category A\n25.5% (1,250)"
- Scatter: Use percentage scales for both axes when applicable

MANDATORY PERCENTAGE CONVERSION LOGIC:
1. Calculate total sum of all values in dataset
2. Convert each value to percentage: (value/total) * 100
3. Format with 1 decimal place: "25.5%"
4. Ensure percentages never exceed 100% - if data is already in percentage format, use as-is
5. For pie charts: values should sum to exactly 100%
6. Include in tooltips: "Series A: 1,250 (25.5%)"
7. Update legend labels: "Category A (25.5%)"

CRITICAL: If input data appears to already be in percentage format (values between 0-100), do NOT multiply by 100 again. Only convert to percentage if values are raw counts or decimals between 0-1.

Always generate realistic, meaningful sample data if no specific data is provided.
Include proper percentage formatting, units, and contextual information.

${knowledgeBaseContext ? `Knowledge Base Context:\n${knowledgeBaseContext}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate chart' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response
    let chartData;
    try {
      chartData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedContent);
      return new Response(JSON.stringify({ error: 'Invalid chart configuration generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to chart history
    const { error: saveError } = await supabase
      .from('chart_history')
      .insert({
        user_id: user.id,
        prompt,
        chart_config: chartData.option,
        diagnostics: chartData.diagnostics,
        chart_type: chartData.diagnostics?.chartType || 'unknown',
        knowledge_base_files: knowledgeBaseFiles
      });

    if (saveError) {
      console.error('Failed to save chart history:', saveError);
    }

    return new Response(JSON.stringify(chartData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-chart function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});