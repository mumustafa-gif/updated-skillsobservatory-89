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
    const { prompt, knowledgeBaseFiles = [] } = await req.json();
    
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

    // Create the system prompt for chart generation
    const systemPrompt = `You are a professional chart generation assistant for UAE Ministry data visualization. Generate valid Apache ECharts configuration JSON with enterprise-grade styling and accessibility.

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
1. PROFESSIONAL LEGENDS: Always include detailed legends with:
   - Clear, descriptive labels for each data series
   - Professional color palette (#1f77b4, #ff7f0e, #2ca02c, #d62728, #9467bd, #8c564b, #e377c2, #7f7f7f, #bcbd22, #17becf)
   - Proper positioning (top, right, or bottom based on chart type)
   - Rich text formatting with data values where applicable

2. DYNAMIC AXIS INFORMATION: Include comprehensive axis configuration:
   - Descriptive axis labels that explain what the data represents
   - Proper units and formatting (%, millions, thousands, etc.)
   - Clear tick marks and grid lines
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
      "top": "8%",
      "data": ["Series 1", "Series 2", "Series 3"],
      "textStyle": {"fontSize": 12},
      "itemWidth": 18,
      "itemHeight": 12
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
      "bottom": "15%",
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
        "formatter": "{value}"
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
          "formatter": "{c}"
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

CHART-SPECIFIC ENHANCEMENTS:
- Bar/Line: Use gradient fills, proper spacing, data labels on hover
- Pie: Show percentages, use distinct colors, proper legend positioning
- Heatmap: Use continuous color scale with 5+ stops, show value labels
- Treemap: Use hierarchical colors, show both percentage and absolute values
- Scatter: Color-code by categories, use different shapes/sizes if applicable

Always generate realistic, meaningful sample data if no specific data is provided.
Include proper number formatting, units, and contextual information.

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