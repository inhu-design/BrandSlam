import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * @param {string|null} conversationId
 * @param {{ id: string }|null} user
 * @param {number} [fallbackPollMs] Realtime 누락 대비 주기적 재조회(밀리초). 0이면 비활성.
 */
export function useSupportMessages(conversationId, user, fallbackPollMs = 0) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!conversationId);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  const load = useCallback(
    async (opts = {}) => {
      const silent = !!opts.silent;
      if (!conversationId || !user?.id) {
        setMessages([]);
        if (!silent) setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const { data, error: err } = await supabase
        .from('support_messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (err) {
        if (!silent) {
          setError(err.message || String(err));
          setMessages([]);
        }
      } else {
        setMessages(data || []);
        if (!silent) setError(null);
      }
      if (!silent) setLoading(false);
    },
    [conversationId, user?.id],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  useEffect(() => {
    if (!fallbackPollMs || !conversationId || !user?.id) return undefined;
    const id = setInterval(() => {
      load({ silent: true });
    }, fallbackPollMs);
    return () => clearInterval(id);
  }, [fallbackPollMs, conversationId, user?.id, load]);

  useEffect(() => {
    if (!conversationId || !user?.id) return undefined;

    const channel = supabase
      .channel(`support_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          load({ silent: true });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user?.id, load]);

  const sendMessage = useCallback(
    async (body) => {
      const trimmed = String(body || '').trim();
      if (!trimmed || !conversationId || !user?.id) return { error: 'invalid' };
      const { data, error: err } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          body: trimmed,
        })
        .select('id, conversation_id, sender_id, body, created_at')
        .single();
      if (err) return { error: err.message || String(err) };
      if (data) {
        setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
      }
      return { error: null };
    },
    [conversationId, user],
  );

  return { messages, loading, error, sendMessage, reload: load };
}

/**
 * 고객 1인 1대화 보장 (support_conversations.customer_user_id UNIQUE)
 */
export async function ensureCustomerConversation(user) {
  if (!user?.id) return { conversation: null, error: 'no_user' };

  const email = (user.email || '').trim() || null;

  const { data: existing, error: selErr } = await supabase
    .from('support_conversations')
    .select('id, customer_user_id, customer_email, status, created_at, last_message_at')
    .eq('customer_user_id', user.id)
    .maybeSingle();

  if (selErr) return { conversation: null, error: selErr.message || String(selErr) };
  if (existing) return { conversation: existing, error: null };

  const { data: created, error: insErr } = await supabase
    .from('support_conversations')
    .insert({
      customer_user_id: user.id,
      customer_email: email,
    })
    .select('id, customer_user_id, customer_email, status, created_at, last_message_at')
    .single();

  if (insErr) {
    if (insErr.code === '23505') {
      const { data: again } = await supabase
        .from('support_conversations')
        .select('id, customer_user_id, customer_email, status, created_at, last_message_at')
        .eq('customer_user_id', user.id)
        .maybeSingle();
      return { conversation: again || null, error: null };
    }
    return { conversation: null, error: insErr.message || String(insErr) };
  }

  return { conversation: created, error: null };
}

export async function fetchStaffConversations() {
  const { data, error } = await supabase
    .from('support_conversations')
    .select('id, customer_user_id, customer_email, status, created_at, last_message_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) return { rows: [], error: error.message || String(error) };
  return { rows: data || [], error: null };
}
