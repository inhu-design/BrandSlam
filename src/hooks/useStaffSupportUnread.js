import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchStaffConversations } from './useSupportChat';
import { applyUnreadTabTitle, notifyInboundCustomerMessage } from '../lib/supportChatNotify';

export const STAFF_SUPPORT_READ_PREFIX = 'bs_support_staff_read_';

function getStaffReadMs(conversationId) {
  if (typeof window === 'undefined' || !conversationId) return 0;
  try {
    const s = window.localStorage.getItem(`${STAFF_SUPPORT_READ_PREFIX}${conversationId}`);
    return s ? new Date(s).getTime() : 0;
  } catch {
    return 0;
  }
}

/**
 * 관리자: 고객이 보낸 미읽음 메시지 수(대화별 last-read 기준 합산).
 */
async function computeStaffUnreadTotal(adminUserId) {
  if (!adminUserId) return 0;
  const { rows, error } = await fetchStaffConversations();
  if (error || !rows?.length) return 0;
  const results = await Promise.all(
    rows.map(async (r) => {
      const id = r?.id;
      if (!id) return 0;
      const readMs = getStaffReadMs(id);
      const iso = new Date(readMs).toISOString();
      const { count, error: cErr } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', id)
        .neq('sender_id', adminUserId)
        .gt('created_at', iso);
      if (cErr) return 0;
      return count || 0;
    }),
  );
  return results.reduce((a, b) => a + b, 0);
}

/**
 * @param {string|null|undefined} adminUserId
 * @param {boolean} isAdmin
 * @param {boolean} adminLoading
 */
export function useStaffSupportUnread(adminUserId, isAdmin, adminLoading) {
  const [unreadCount, setUnreadCount] = useState(0);
  const debounceRef = useRef(null);
  const channelRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!adminUserId || !isAdmin) {
      setUnreadCount(0);
      return;
    }
    const n = await computeStaffUnreadTotal(adminUserId);
    setUnreadCount(n);
  }, [adminUserId, isAdmin]);

  useEffect(() => {
    if (adminLoading || !isAdmin || !adminUserId) {
      setUnreadCount(0);
      return undefined;
    }
    queueMicrotask(() => {
      void refresh();
    });
    return undefined;
  }, [adminLoading, isAdmin, adminUserId, refresh]);

  useEffect(() => {
    if (adminLoading || !isAdmin || !adminUserId) return undefined;

    const ch = supabase
      .channel('staff_support_messages_global')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          const row = payload.new;
          if (!row?.conversation_id || row.sender_id === adminUserId) return;
          const shouldPing =
            typeof document !== 'undefined' && (document.hidden || document.visibilityState === 'hidden');
          if (shouldPing) {
            notifyInboundCustomerMessage({ body: row.body, tag: `support-in-${row.id}` });
          }
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            void refresh();
          }, 350);
        },
      )
      .subscribe();

    channelRef.current = ch;
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [adminLoading, isAdmin, adminUserId, refresh]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (adminLoading || !isAdmin) return;
    applyUnreadTabTitle(unreadCount);
  }, [adminLoading, isAdmin, unreadCount]);

  useEffect(() => {
    return () => {
      if (typeof document === 'undefined') return;
      if (!isAdmin) return;
      applyUnreadTabTitle(0);
    };
  }, [isAdmin]);

  const markConversationRead = useCallback(
    (conversationId) => {
      if (!conversationId || typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(
          `${STAFF_SUPPORT_READ_PREFIX}${conversationId}`,
          new Date().toISOString(),
        );
      } catch {
        /* quota */
      }
      void refresh();
    },
    [refresh],
  );

  return { unreadCount, refresh, markConversationRead };
}
