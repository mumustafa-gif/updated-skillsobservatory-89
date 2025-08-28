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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, messageId, context, region } = await req.json();
    
    // Use static test user for prototyping
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // Check if we have existing policies for this region
    const { data: existingPolicies } = await supabase
      .from('ai_policies')
      .select('*')
      .eq('region', region)
      .limit(5);

    const systemPrompt = `You are a policy analysis expert with deep knowledge of regional regulations, compliance requirements, and best practices across different countries and states.

Generate region-specific policies and recommendations based on the data context provided.

IMPORTANT: Return ONLY a JSON object with this exact structure:
{
  "policies": [
    {
      "category": "Data Privacy",
      "title": "GDPR Compliance Requirements",
      "description": "Detailed policy description",
      "implementation": "How to implement this policy",
      "compliance_level": "Mandatory/Recommended/Optional",
      "legal_reference": "Specific law or regulation reference"
    }
  ],
  "recommendations": [
    {
      "category": "Operational Excellence", 
      "priority": "High/Medium/Low",
      "title": "Recommendation title",
      "description": "Detailed recommendation",
      "implementation_timeline": "timeframe",
      "expected_impact": "description of impact"
    }
  ],
  "compliance_checklist": [
    "• Specific compliance requirement 1",
    "• Specific compliance requirement 2",
    "• Specific compliance requirement 3"
  ],
  "regional_context": {
    "jurisdiction": "specific jurisdiction",
    "key_regulations": ["regulation 1", "regulation 2"],
    "enforcement_agencies": ["agency 1", "agency 2"],
    "update_frequency": "how often policies change"
  }
}

Focus on:
1. Data protection and privacy laws
2. Industry-specific regulations
3. Reporting requirements
4. Operational best practices
5. Risk management policies

${existingPolicies && existingPolicies.length > 0 ? 
  `Existing policies for reference:\n${JSON.stringify(existingPolicies, null, 2)}\n` : ''}

Region: ${region}
Data Context: ${JSON.stringify(context)}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate policies for ${region} based on context: ${JSON.stringify(context)}` }
        ],
        max_completion_tokens: 2500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate policies' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    let policyData;
    try {
      policyData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', generatedContent);
      return new Response(JSON.stringify({ error: 'Invalid policy data generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save generated policies
    const { error: saveError } = await supabase
      .from('generated_content')
      .insert({
        conversation_id: conversationId,
        message_id: messageId,
        content_type: 'policies',
        content: policyData,
        region_context: region
      });

    if (saveError) {
      console.error('Failed to save policies:', saveError);
    }

    // Cache policies in ai_policies table for future reference
    for (const policy of policyData.policies || []) {
      await supabase
        .from('ai_policies')
        .upsert({
          region: region,
          policy_category: policy.category,
          policy_content: policy,
          data_context: JSON.stringify(context)
        });
    }

    return new Response(JSON.stringify(policyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-policies function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});