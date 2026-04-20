import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useAdminSession } from '../hooks/useAdminSession';
import { useStaffSupportUnread } from '../hooks/useStaffSupportUnread';

const SupportStaffUnreadContext = createContext({
  unreadCount: 0,
  unreadItems: [],
  refresh: () => {},
  markConversationRead: () => {},
});

export function SupportStaffUnreadProvider({ children }) {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();
  const { unreadCount, unreadItems, refresh, markConversationRead } = useStaffSupportUnread(
    user?.id,
    isAdmin,
    adminLoading,
  );

  return (
    <SupportStaffUnreadContext.Provider value={{ unreadCount, unreadItems, refresh, markConversationRead }}>
      {children}
    </SupportStaffUnreadContext.Provider>
  );
}

export function useSupportStaffUnread() {
  return useContext(SupportStaffUnreadContext);
}
