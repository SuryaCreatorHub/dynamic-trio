import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateConversationSchema, SendMessageSchema } from '../validators/schemas.js';
import { generateCopilotReply } from '../services/geminiService.js';

const router = Router();

// GET /api/conversations
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: conversations, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ conversations: conversations || [] });
  } catch (err) {
    return next(err);
  }
});

// POST /api/conversations
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const validated = CreateConversationSchema.parse(req.body);

    const title = validated.title || 'New Security Advisory';
    const domain = validated.domain || 'PROMPT_SECURITY';

    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        domain,
        status: 'completed',
        last_risk_score: 0,
        last_trust_score: 100,
      })
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ conversation });
  } catch (err) {
    return next(err);
  }
});

// GET /api/conversations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (convErr || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    return res.json({ conversation, messages: messages || [] });
  } catch (err) {
    return next(err);
  }
});

// POST /api/conversations/:id/messages
router.post('/:id/messages', async (req, res, next) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const validated = SendMessageSchema.parse(req.body);

    // Verify conversation ownership
    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (convErr || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    const currentDomain = validated.domain || conversation.domain;

    // 1. Insert user message with status 'completed'
    const { data: userMsg, error: userMsgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        user_id: userId,
        role: 'user',
        content: validated.content,
        status: 'completed',
        metadata: {},
      })
      .select()
      .single();

    if (userMsgErr) throw userMsgErr;

    // 2. Set conversation status to 'generating' for Realtime subscribers
    await supabaseAdmin
      .from('conversations')
      .update({
        status: 'generating',
        domain: currentDomain,
      })
      .eq('id', id);

    // Fetch prior messages for context
    const { data: priorMessages } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(20);

    // 3. Call AI Copilot
    let aiResponse;
    try {
      aiResponse = await generateCopilotReply({
        domain: currentDomain,
        history: priorMessages || [],
        userMessage: validated.content,
      });
    } catch (genErr) {
      console.error('[AI_REPLY_FAILED]', genErr);
      await supabaseAdmin
        .from('conversations')
        .update({ status: 'failed' })
        .eq('id', id);
      throw genErr;
    }

    // 4. Insert Assistant message
    const { data: assistantMsg, error: asstErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: id,
        user_id: userId,
        role: 'assistant',
        content: aiResponse.replyMarkdown,
        status: 'completed',
        metadata: {
          riskScore: aiResponse.riskScore,
          trustScore: aiResponse.trustScore,
          detectedFlags: aiResponse.detectedFlags,
          suggestedFollowUps: aiResponse.suggestedFollowUps,
        },
      })
      .select()
      .single();

    if (asstErr) throw asstErr;

    // 5. Update conversation status to 'completed' with updated scores
    const autoTitle =
      conversation.title === 'New Security Advisory'
        ? validated.content.slice(0, 45) + (validated.content.length > 45 ? '...' : '')
        : conversation.title;

    const { data: updatedConv, error: convUpdErr } = await supabaseAdmin
      .from('conversations')
      .update({
        status: 'completed',
        title: autoTitle,
        last_risk_score: aiResponse.riskScore,
        last_trust_score: aiResponse.trustScore,
      })
      .eq('id', id)
      .select()
      .single();

    if (convUpdErr) throw convUpdErr;

    return res.status(200).json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      conversation: updatedConv,
    });
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/conversations/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    return next(err);
  }
});

export default router;

