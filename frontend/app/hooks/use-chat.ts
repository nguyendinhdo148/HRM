import { useState, useEffect, useCallback } from "react";
import { fetchData, postData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import { useSocket } from "./useSocket";
import { useLocation } from "react-router";

interface Conversation {
  _id: string;
  type: "direct" | "group" | "workspace" | "project";
  participants: any[];
  name?: string;
  lastMessageText?: string;
  createdAt: string;
  unreadCount?: number;
  createdBy?: string;
}

export const useChatUnreadCount = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const conversations = await fetchData<Conversation[]>("/chat/conversations");
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setTotalUnreadCount(totalUnread);
    } catch (error) {
      console.error("Error fetching conversations for unread count:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await postData(`/chat/conversations/${conversationId}/read`, {});
      // Update local count by refetching
      await fetchConversations();
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  }, [fetchConversations]);

  // Listen to socket events for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const handleNewMessage = (data: any) => {
      // Refetch conversations to get updated unread counts
      fetchConversations();
    };

    const handleConversationRead = (data: any) => {
      // When messages are marked as read in a conversation, refetch to get updated counts
      fetchConversations();
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleConversationRead);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("conversation-read", handleConversationRead);
    };
  }, [socket, isConnected, user, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  return {
    totalUnreadCount,
    isLoading,
    markConversationAsRead,
    refetch: fetchConversations,
  };
};