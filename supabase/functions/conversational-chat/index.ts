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

// Use service role key for admin access during prototyping
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, userContext = {} } = await req.json();
    
    // Use static test user for prototyping
    const testUserId = '00000000-0000-0000-0000-000000000001';
    console.log('Using test user:', testUserId);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', testUserId)
        .single();
      conversation = data;
    } else {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: testUserId,
          title: message.substring(0, 50) + '...',
          context: userContext
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      conversation = data;
      console.log('Created new conversation:', conversation.id);
    }

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error saving user message:', userMessageError);
      throw userMessageError;
    }

    console.log('Saved user message:', userMessage.id);

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
      .eq('user_id', testUserId);
    
    const knowledgeBaseContext = files && files.length > 0 
      ? files.map(file => `File: ${file.original_filename}\nContent: ${file.extracted_content}`).join('\n\n')
      : '';

    console.log('Knowledge base files found:', files?.length || 0);

    // Create dynamic system prompt for conversational AI
    const systemPrompt = `You are ChartGen AI, an intelligent conversational assistant specialized in data visualization, policy analysis, and business insights.

Your role is to:
1. Be proactive in generating visualizations based on user requests
2. Generate charts even with minimal context, using reasonable sample data
3. Ask for clarification only when absolutely necessary
4. Provide region-specific policy recommendations when location context is mentioned
5. Offer strategic insights and improvement suggestions based on the data context

IMPORTANT GUIDELINES:
- Generate content quickly rather than asking many questions
- Use reasonable sample data if specific data isn't provided
- Be helpful and generate visualizations proactively
- If user mentions any business domain, generate relevant sample charts
- If user mentions a location, include regional context

RESPONSE FORMAT:
When user requests charts or mentions any data domain, respond with JSON:
{
  "response": "I'll generate some sample charts for [domain]. Here's what I'm creating:",
  "needsMoreInfo": false,
  "generateContent": true,
  "contentTypes": ["charts", "insights"],
  "context": {
    "chartTypes": ["bar", "line", "pie"],
    "region": "location if mentioned",
    "dataContext": "summary of data requirements",
    "domain": "business domain mentioned"
  }
}

Only ask for more info if the request is completely unclear:
{
  "response": "Could you clarify what type of data or charts you'd like to see?",
  "needsMoreInfo": true,
  "generateContent": false,
  "nextQuestion": "What domain or type of data would you like to visualize?"
}

${knowledgeBaseContext ? `Available Data Files:\n${knowledgeBaseContext}\n` : ''}

Current conversation context: ${JSON.stringify(conversation.context)}`;

    console.log('Calling OpenAI API...');
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
          ...(messages || []).map(msg => ({ role: msg.role, content: msg.content }))
        ],
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
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

    console.log('AI Response:', aiResponse);

    // Save AI response
    const { data: assistantMessage, error: assistantError } = await supabase
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

    if (assistantError) {
      console.error('Error saving assistant message:', assistantError);
      throw assistantError;
    }

    console.log('Saved assistant message:', assistantMessage.id);

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