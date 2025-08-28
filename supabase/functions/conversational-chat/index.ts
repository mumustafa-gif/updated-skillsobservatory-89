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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, userContext = {} } = await req.json();
    
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

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = data;
    } else {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...',
          context: userContext
        })
        .select()
        .single();
      
      if (error) throw error;
      conversation = data;
    }

    // Save user message
    const { data: userMessage } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      })
      .select()
      .single();

    // Get conversation history
    const { data: messages } = await supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Get knowledge base context if available
    const { data: files } = await supabase
      .from('knowledge_base_files')
      .select('original_filename, extracted_content')
      .eq('user_id', user.id);
    
    const knowledgeBaseContext = files && files.length > 0 
      ? files.map(file => `File: ${file.original_filename}\nContent: ${file.extracted_content}`).join('\n\n')
      : '';

    // Create dynamic system prompt for conversational AI
    const systemPrompt = `You are ChartGen AI, an intelligent conversational assistant specialized in data visualization, policy analysis, and business insights.

Your role is to:
1. Engage in dynamic conversations to understand the user's data visualization needs
2. Ask clarifying questions to gather all necessary information before generating visualizations
3. Generate multiple relevant chart types when sufficient information is available
4. Provide region-specific policy recommendations when location context is mentioned
5. Offer strategic insights and improvement suggestions based on the data context

IMPORTANT CONVERSATION FLOW:
- Ask ONE specific question at a time to gather information
- Only generate charts/content when you have sufficient context
- Be conversational and helpful, not robotic
- Adapt your questions based on the user's responses
- If the user mentions a location (country, state, city), incorporate regional context

RESPONSE FORMAT:
When you have enough information to generate content, respond with JSON:
{
  "response": "Your conversational response",
  "needsMoreInfo": false,
  "generateContent": true,
  "contentTypes": ["charts", "policies", "insights"],
  "context": {
    "chartTypes": ["bar", "line", "pie"],
    "region": "location if mentioned",
    "dataContext": "summary of data requirements"
  }
}

When you need more information, respond with JSON:
{
  "response": "Your follow-up question",
  "needsMoreInfo": true,
  "generateContent": false,
  "nextQuestion": "specific question to ask"
}

${knowledgeBaseContext ? `Available Data Files:\n${knowledgeBaseContext}\n` : ''}

Current conversation context: ${JSON.stringify(conversation.context)}`;

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
          ...messages.map(msg => ({ role: msg.role, content: msg.content }))
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let aiResponse;
    
    try {
      aiResponse = JSON.parse(data.choices[0].message.content);
    } catch {
      // Fallback if response is not JSON
      aiResponse = {
        response: data.choices[0].message.content,
        needsMoreInfo: true,
        generateContent: false
      };
    }

    // Save AI response
    const { data: assistantMessage } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: aiResponse.response,
        metadata: {
          needsMoreInfo: aiResponse.needsMoreInfo,
          generateContent: aiResponse.generateContent,
          context: aiResponse.context || {}
        }
      })
      .select()
      .single();

    // Update conversation context
    await supabase
      .from('conversations')
      .update({
        context: { ...conversation.context, ...aiResponse.context },
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    return new Response(JSON.stringify({
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      ...aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in conversational-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});