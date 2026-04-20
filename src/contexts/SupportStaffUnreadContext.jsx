import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useAdminSession } from '../hooks/useAdminSession';
import { useStaffSupportUnread } from '../hooks/useStaffSupportUnread';

const SupportStaffUnreadContext = createContext({
  unreadCount: 0,
  refresh: () => {},
  markConversationRead: () => {},
});

export function SupportStaffUnreadProvider({ children }) {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();
  const { unreadCount, refresh, markConversationRead } = useStaffSupportUnread(user?.id, isAdmin, adminLoading);

  return (
    <SupportStaffUnreadContext.Provider value={{ unreadCount, refresh, markConversationRead }}>
      {children}
    </SupportStaffUnreadContext.Provider>
  );
}

export function useSupportStaffUnread() {
  return useContext(SupportStaffUnreadContext);
}
