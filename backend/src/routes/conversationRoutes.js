import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateConversationSchema, SendMessageSchema } from '../validators/schemas.js';
import { generateCopilotReply } from '../services/geminiService.js';

const router = Router();

// In-memory fallback caches
const localConversations = [];
const localMessages = [];

// GET /api/conversations
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    try {
      const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && conversations) {
        return res.json({ conversations });
      }
    } catch (dbErr) {
      console.warn('[DB] Supabase conversations select fallback to local');
    }

    const userConvs = localConversations.filter((c) => c.user_id === userId);
    return res.json({ conversations: userConvs });
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

    let conversation = null;

    try {
      const { data, error } = await supabaseAdmin
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

      if (!error && data) conversation = data;
    } catch (e) {}

    if (!conversation) {
      conversation = {
        id: `conv-${Date.now()}`,
        user_id: userId,
        title,
        domain,
        status: 'completed',
        last_risk_score: 0,
        last_trust_score: 100,
        created_at: new Date().toISOString(),
      };
      localConversations.unshift(conversation);
    }

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

    let conversation = null;
    let messages = [];

    try {
      const { data: convData } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (convData) {
        conversation = convData;
        const { data: msgData } = await supabaseAdmin
          .from('messages')
          .select('*')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true });
        messages = msgData || [];
      }
    } catch (e) {}

    if (!conversation) {
      conversation = localConversations.find(
        (c) => c.id === id && c.user_id === userId
      );
      messages = localMessages.filter((m) => m.conversation_id === id);
    }

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    return res.json({ conversation, messages });
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

    let conversation = null;
    let priorMessages = [];

    try {
      const { data: convData } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      conversation = convData;

      const { data: msgData } = await supabaseAdmin
        .from('messages')
        .select('role, content')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(20);
      priorMessages = msgData || [];
    } catch (e) {}

    if (!conversation) {
      conversation = localConversations.find(
        (c) => c.id === id && c.user_id === userId
      );
      priorMessages = localMessages
        .filter((m) => m.conversation_id === id)
        .slice(-20);
    }

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    const currentDomain = validated.domain || conversation.domain;

    // Insert user message
    let userMsg = null;
    try {
      const { data: uMsg } = await supabaseAdmin
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
      userMsg = uMsg;
    } catch (e) {}

    if (!userMsg) {
      userMsg = {
        id: `msg-u-${Date.now()}`,
        conversation_id: id,
        user_id: userId,
        role: 'user',
        content: validated.content,
        status: 'completed',
        metadata: {},
        created_at: new Date().toISOString(),
      };
      localMessages.push(userMsg);
    }

    // Call Gemini Copilot
    const aiResponse = await generateCopilotReply({
      domain: currentDomain,
      history: priorMessages,
      userMessage: validated.content,
    });

    // Insert assistant message
    let assistantMsg = null;
    try {
      const { data: aMsg } = await supabaseAdmin
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
      assistantMsg = aMsg;
    } catch (e) {}

    if (!assistantMsg) {
      assistantMsg = {
        id: `msg-a-${Date.now()}`,
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
        created_at: new Date().toISOString(),
      };
      localMessages.push(assistantMsg);
    }

    // Update conversation scores & title
    const autoTitle =
      conversation.title === 'New Security Advisory'
        ? validated.content.slice(0, 45) + (validated.content.length > 45 ? '...' : '')
        : conversation.title;

    let updatedConv = null;
    try {
      const { data: uConv } = await supabaseAdmin
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
      updatedConv = uConv;
    } catch (e) {}

    if (!updatedConv) {
      conversation.title = autoTitle;
      conversation.status = 'completed';
      conversation.last_risk_score = aiResponse.riskScore;
      conversation.last_trust_score = aiResponse.trustScore;
      updatedConv = conversation;
    }

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

    try {
      await supabaseAdmin
        .from('conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch (e) {}

    const cIdx = localConversations.findIndex((c) => c.id === id && c.user_id === userId);
    if (cIdx !== -1) localConversations.splice(cIdx, 1);

    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    return next(err);
  }
});

export default router;
