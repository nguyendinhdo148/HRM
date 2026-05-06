import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-util";
import { useAuth } from "@/provider/auth-context";
import type { User } from "@/types";

interface Message {
  _id: string;
  sender: User;
  content: string;
  type: string;
  attachments?: Array<{ fileUrl: string; fileType: string; fileName: string; fileSize?: number }>;
  createdAt: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: Array<{ user: User; readAt: string }>;
  reactions?: Array<{ emoji: string; user: User }>;
}

interface ConversationParticipant {
  user: User;
  joinedAt: string;
  lastReadAt?: string;
}

interface Conversation {
  _id: string;
  type: "direct" | "group" | "workspace" | "project";
  participants: ConversationParticipant[];
  name?: string;
  lastMessageText?: string;
  createdAt: string;
  unreadCount?: number;
  createdBy?: string;
}

const getInitials = (name: string) => {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
};

// Component hiển thị Avatar (Ưu tiên ảnh profilePicture, nếu không có thì lấy chữ cái đầu)
const AvatarRender = ({ user, size = "48px" }: { user?: User; size?: string }) => {
  if (!user) return <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: "#cbd5e1", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: "#cbd5e1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: `calc(${size} / 2.5)`, fontWeight: "bold", overflow: "hidden", flexShrink: 0, border: "1px solid #e2e8f0" }}>
      {user.profilePicture ? (
        <img src={user.profilePicture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
};

const Achieved = () => {
  const { user: currentUser } = useAuth();
  
  // State Dữ liệu chính
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // State Trạng thái & UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  
  // State Tin nhắn
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");

  // State File & Upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State Modal
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [chatMode, setChatMode] = useState<"direct" | "group">("direct");
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentConversationRef = useRef<Conversation | null>(null);

  useEffect(() => {
    currentConversationRef.current = currentConversation;
  }, [currentConversation]);

  // ==========================================
  // 1. FETCH DỮ LIỆU BAN ĐẦU
  // ==========================================
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetchData<Conversation[]>("/chat/conversations");
      setConversations(response);
      setError("");
    } catch (err) {
      console.error("Lỗi lấy danh sách hội thoại:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetchData<User[]>("/chat/users");
      setAllUsers(response || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách user:", err);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await fetchData<{ messages: Message[] }>(`/chat/conversations/${conversationId}/messages`);
      setMessages(response.messages || []);
    } catch (err) {
      console.error("Lỗi lấy tin nhắn:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. XỬ LÝ UPLOAD FILE & ẢNH (CTRL + C / CHỌN FILE)
  // ==========================================
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1 || items[i].type.indexOf("application") !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Sao chép file ra một mảng mới trước
      const fileArray = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...fileArray]);
    }
    
    // Dùng setTimeout để đợi React lưu State xong mới reset input
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 100);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToCloudinary = async (): Promise<any[]> => {
    if (selectedFiles.length === 0) return [];
    const uploadedAttachments = [];
    const token = localStorage.getItem("token");
    
    // Đảm bảo URL chính xác
    let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api-v1";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("file", file); 
      
      try {
        // Dùng Fetch native thay vì postData để đảm bảo gửi chuẩn multipart/form-data
        const response = await fetch(`${baseUrl}/chat/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}` 
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        const res = await response.json();
        
        uploadedAttachments.push({
          fileName: file.name,
          fileUrl: res.url || res.secure_url || res.fileUrl, 
          fileType: file.type.startsWith("image/") ? "image" : "file",
          fileSize: file.size,
        });
      } catch (err) {
        console.error("Lỗi upload file:", err);
        setError("Không thể tải lên một số file");
      }
    }
    return uploadedAttachments;
  };

  // ==========================================
  // 3. XỬ LÝ TIN NHẮN (GỬI, SỬA, XOÁ, THẢ TIM)
  // ==========================================
  const sendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !currentConversation) return;
    try {
      setUploading(true);
      const attachments = await uploadFilesToCloudinary();
      
      const finalContent = newMessage.trim() 
        ? newMessage.trim() 
        : (attachments.length > 0 ? "Đã gửi tệp đính kèm" : " ");

      const payload = { 
        content: finalContent, 
        type: attachments.length > 0 ? (attachments[0].fileType === "image" ? "image" : "file") : "text",
        attachments: attachments
      };

      const response = await postData<Message>(`/chat/conversations/${currentConversation._id}/messages`, payload);
      
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("send-message", { conversationId: currentConversation._id, messageData: response });
      }
      
      setMessages(prev => [...prev, response]);
      setConversations(prev => {
        const convIndex = prev.findIndex(c => c._id === currentConversation._id);
        if (convIndex === -1) return prev;
        const updatedConv = { 
          ...prev[convIndex], 
          lastMessageText: payload.content || (attachments.length > 0 ? "Đã gửi tệp đính kèm" : "") 
        };
        const newConvs = [...prev];
        newConvs.splice(convIndex, 1);
        return [updatedConv, ...newConvs];
      });
      
      setNewMessage("");
      setSelectedFiles([]);
      scrollToBottom();
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      setError("Không thể gửi tin nhắn");
    } finally {
      setUploading(false);
    }
  };

  const editMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;
    try {
      await updateData<Message>(`/chat/messages/${editingMessage._id}`, { content: editContent });
      setMessages(prev => prev.map(msg => msg._id === editingMessage._id ? { ...msg, content: editContent, isEdited: true } : msg));
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("edit-message", { messageId: editingMessage._id, content: editContent, conversationId: currentConversation?._id });
      }
      setConversations(prev => prev.map(conv => conv._id === currentConversation?._id ? { ...conv, lastMessageText: editContent } : conv));
      setEditingMessage(null);
      setEditContent("");
    } catch (err) {
      console.error("Lỗi sửa tin nhắn:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteData(`/chat/messages/${messageId}`);
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isDeleted: true, content: "Tin nhắn đã bị thu hồi" } : msg));
      if (socketRef.current && socketConnected) {
        socketRef.current.emit("delete-message", { messageId, conversationId: currentConversation?._id });
      }
    } catch (err) {
      console.error("Lỗi thu hồi tin nhắn:", err);
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await postData<{ reactions: Array<{ emoji: string; user: User }> }>(`/chat/messages/${messageId}/reactions`, { emoji });
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, reactions: response.reactions } : msg));
    } catch (err) {
      console.error("Lỗi thả cảm xúc:", err);
    }
  };

  // ==========================================
  // 4. CHỨC NĂNG CRUD HỘI THOẠI & NHÓM
  // ==========================================
  const selectConversation = async (conv: Conversation) => {
    setCurrentConversation(conv);
    if (socketRef.current && socketConnected) {
      socketRef.current.emit("join-conversation", conv._id);
      // Emit mark-read event for real-time updates
      socketRef.current.emit("mark-read", { conversationId: conv._id });
    }
    await fetchMessages(conv._id);
    await postData(`/chat/conversations/${conv._id}/read`, {});
    setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
  };

  const createDirectConversation = async (userId: string) => {
    if (!userId) return;
    try {
      const existingConv = conversations.find(conv => {
        if (conv.type === "direct") {
          const otherUser = conv.participants.find(p => p.user._id !== currentUser?._id);
          return otherUser?.user._id === userId;
        }
        return false;
      });
      if (existingConv) {
        await selectConversation(existingConv);
        setShowNewChatModal(false);
        return;
      }
      const response = await fetchData<Conversation>(`/chat/conversations/direct/${userId}`);
      setConversations([response, ...conversations]);
      await selectConversation(response);
      setShowNewChatModal(false);
    } catch (err) {
      setError("Không thể tạo cuộc trò chuyện");
    }
  };

  const createGroupConversation = async () => {
    if (selectedGroupUsers.length === 0) return;
    try {
      const response = await postData<Conversation>("/chat/conversations/group", {
        name: groupName.trim() || "Nhóm trò chuyện",
        participantIds: selectedGroupUsers.map(u => u._id)
      });
      setConversations([response, ...conversations]);
      await selectConversation(response);
      setShowNewChatModal(false);
      setSelectedGroupUsers([]);
      setGroupName("");
    } catch (err) {
      setError("Không thể tạo nhóm chat");
    }
  };

  const addMembersToGroup = async () => {
    if (!currentConversation || selectedGroupUsers.length === 0) return;
    try {
      await postData(`/chat/conversations/${currentConversation._id}/members`, {
        userIds: selectedGroupUsers.map(u => u._id)
      });
      
      const newParticipants = selectedGroupUsers.map(u => ({ user: u, joinedAt: new Date().toISOString() }));
      const updatedConv = { ...currentConversation, participants: [...currentConversation.participants, ...newParticipants] };
      
      setCurrentConversation(updatedConv);
      setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
      
      setShowAddMemberModal(false);
      setSelectedGroupUsers([]);
    } catch (err) {
      setError("Không thể thêm thành viên");
    }
  };

  const removeMemberFromGroup = async (userId: string) => {
    if (!currentConversation) return;
    if (window.confirm("Bạn có chắc muốn xoá thành viên này khỏi nhóm?")) {
      try {
        await deleteData(`/chat/conversations/${currentConversation._id}/members/${userId}`);
        const updatedConv = { 
          ...currentConversation, 
          participants: currentConversation.participants.filter(p => p.user._id !== userId) 
        };
        setCurrentConversation(updatedConv);
        setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
      } catch (err) {
        setError("Không thể xoá thành viên");
      }
    }
  };

  const deleteOrLeaveGroup = async () => {
    if (!currentConversation) return;
    if (window.confirm("Bạn có chắc chắn muốn rời/giải tán nhóm này không? Toàn bộ tin nhắn sẽ bị xoá đối với bạn.")) {
      try {
        await deleteData(`/chat/conversations/${currentConversation._id}`);
        setConversations(prev => prev.filter(c => c._id !== currentConversation._id));
        setCurrentConversation(null);
        setShowGroupSettings(false);
      } catch (err) {
        setError("Không thể giải tán nhóm");
      }
    }
  };

  // ==========================================
  // 5. SOCKET & TIỆN ÍCH
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !currentUser) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace("/api-v1", "") || "http://localhost:5001", { auth: { token }, reconnection: true });

    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));

    socket.on("new-message", (data: any) => {
      const message = data.message || data; 
      const convId = data.conversationId || message.conversation || currentConversationRef.current?._id;
      if (convId === currentConversationRef.current?._id) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
      if (convId) {
        setConversations(prev => {
          const convIndex = prev.findIndex(c => c._id === convId);
          if (convIndex === -1) return prev; 
          const isCurrentConv = convId === currentConversationRef.current?._id;
          const updatedConv = { 
            ...prev[convIndex], 
            lastMessageText: message.content || "Có tin nhắn mới",
            unreadCount: isCurrentConv ? 0 : (prev[convIndex].unreadCount || 0) + 1
          };
          const newConvs = [...prev];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        });
      }
    });

    socket.on("message-edited", (data: any) => {
      const msgId = data.messageId || data._id || (data.message && data.message._id);
      const newContent = data.content || (data.message && data.message.content);
      const convId = data.conversationId || data.conversation || (data.message && data.message.conversation);
      if (!msgId || !newContent) return;
      setMessages(prev => prev.map(msg => msg._id === msgId ? { ...msg, content: newContent, isEdited: true } : msg));
      setConversations(prev => prev.map(conv => (conv._id === convId || conv._id === currentConversationRef.current?._id) ? { ...conv, lastMessageText: newContent } : conv));
    });

    socket.on("message-deleted", (messageId: string) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isDeleted: true, content: "Tin nhắn đã bị thu hồi" } : msg));
    });

    socket.on("reaction-added", (data: { messageId: string; reactions: any[]; conversationId?: string; user?: any }) => {
      setMessages(prev => prev.map(msg => msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg));
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [currentUser]);

  useEffect(() => { scrollToBottom(); }, [messages, selectedFiles]);
  useEffect(() => { fetchConversations(); fetchAllUsers(); }, []);

  const getConversationName = (conv: Conversation): string => {
    if (conv.type === "direct") {
      const otherUser = conv.participants?.find((p) => p.user?._id !== currentUser?._id);
      return otherUser?.user?.name || "Người dùng ẩn";
    }
    return conv.name || "Nhóm";
  };

  const getConversationAvatarUser = (conv: Conversation): User | undefined => {
    if (conv.type === "direct") {
      return conv.participants?.find((p) => p.user?._id !== currentUser?._id)?.user;
    }
    return undefined; // Nhóm dùng icon mặc định
  };

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

  const toggleSelectUserForGroup = (user: User) => {
    setSelectedGroupUsers(prev => prev.some(u => u._id === user._id) ? prev.filter(u => u._id !== user._id) : [...prev, user]);
  };

  const filteredUsers = allUsers.filter(user => {
    if (!user) return false;
    // Ẩn người đã có trong nhóm khi đang mở modal Thêm thành viên
    if (showAddMemberModal && currentConversation?.participants.some(p => p.user._id === user._id)) return false;
    const search = searchTerm.toLowerCase();
    return (user.name || "").toLowerCase().includes(search) || (user.email || "").toLowerCase().includes(search);
  });

  if (!currentUser) return <div style={{ display: "flex", justifyContent: "center", height: "100vh", alignItems: "center" }}>Đang tải dữ liệu...</div>;

  return (
    <>
      <style>{`
        .zalo-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .zalo-scroll::-webkit-scrollbar-track { background: transparent; }
        .zalo-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .zalo-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .no-horizontal-scroll { overflow-x: hidden !important; }
      `}</style>

      <div style={{ display: "flex", height: "calc(100vh - 40px)", margin: "20px auto", maxWidth: "1400px", borderRadius: "12px", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", backgroundColor: "#fff" }}>
        
        {/* ========================================================== */}
        {/* SIDEBAR BÊN TRÁI (DANH SÁCH CHAT) */}
        {/* ========================================================== */}
        <div style={{ width: "340px", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#0f172a" }}>Chats</h2>
            <button onClick={() => { setChatMode("direct"); setShowNewChatModal(true); }} style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#0f172a", border: "none", cursor: "pointer", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Tạo trò chuyện mới">
              +
            </button>
          </div>

          <div className="zalo-scroll" style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading && conversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>Đang tải...</div>
            ) : conversations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                Chưa có tin nhắn nào.<br />
                <button onClick={() => setShowNewChatModal(true)} style={{ marginTop: "16px", padding: "10px 20px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Bắt đầu trò chuyện</button>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = currentConversation?._id === conv._id;
                const isGroup = conv.type !== "direct";
                return (
                  <div key={conv._id} onClick={() => selectConversation(conv)} style={{ display: "flex", alignItems: "center", padding: "12px", marginBottom: "4px", backgroundColor: isActive ? "#e5efff" : "transparent", borderRadius: "12px", cursor: "pointer", transition: "background 0.2s" }}>
                    <AvatarRender user={getConversationAvatarUser(conv)} size="48px" />
                    <div style={{ flex: 1, minWidth: 0, marginLeft: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <div style={{ fontWeight: isActive ? "700" : "600", fontSize: "15px", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getConversationName(conv)}</div>
                        {isGroup && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "10px", backgroundColor: "#e2e8f0", color: "#475569", flexShrink: 0 }}>Nhóm</span>}
                      </div>
                      <div style={{ fontSize: "13px", color: conv.unreadCount ? "#0f172a" : "#64748b", fontWeight: conv.unreadCount ? "600" : "400", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.lastMessageText || "Chưa có tin nhắn"}
                      </div>
                    </div>
                    {conv.unreadCount ? <div style={{ backgroundColor: "#ef4444", color: "white", borderRadius: "10px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold", marginLeft: "10px" }}>{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</div> : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* KHUNG CHAT BÊN PHẢI */}
        {/* ========================================================== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#e2e8f0" }}>
          {currentConversation ? (
            <>
              {/* Header Khung Chat */}
              <div 
                onClick={() => currentConversation.type !== "direct" && setShowGroupSettings(true)} 
                style={{ padding: "16px 24px", backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", cursor: currentConversation.type !== "direct" ? "pointer" : "default" }}
                title={currentConversation.type !== "direct" ? "Quản lý nhóm" : ""}
              >
                <AvatarRender user={getConversationAvatarUser(currentConversation)} size="42px" />
                <div style={{ marginLeft: "12px", flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    {getConversationName(currentConversation)}
                    {currentConversation.type !== "direct" && <span style={{ fontSize: "14px", color: "#64748b", fontWeight: "normal" }}>⚙️</span>}
                  </h3>
                  <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>
                    {currentConversation.type === "direct" ? "Trò chuyện trực tiếp" : `${currentConversation.participants.length} thành viên`}
                  </div>
                </div>
              </div>

              {/* Vùng hiển thị tin nhắn */}
              <div className="zalo-scroll no-horizontal-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column" }}>
                {messages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "#64748b", backgroundColor: "rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: "20px", fontSize: "14px" }}>
                    Hãy là người đầu tiên gửi tin nhắn!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.sender?._id === currentUser._id;
                    
                    {/* Action Menu (Sửa/Xoá/Copy/React) */}
                    const actionMenu = !msg.isDeleted && (
                      <div className="message-actions" style={{ display: "flex", alignItems: "center", gap: "2px", opacity: 0, transition: "opacity 0.2s", padding: "0 6px" }}>
                         <button onClick={() => navigator.clipboard.writeText(msg.content)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px" }} title="Sao chép text">📋</button>
                         <div style={{ position: "relative", display: "flex" }}
                              onMouseEnter={(e) => { const p = e.currentTarget.querySelector('.emoji-picker'); if (p) (p as HTMLElement).style.display = 'block'; }}
                              onMouseLeave={(e) => { const p = e.currentTarget.querySelector('.emoji-picker'); if (p) (p as HTMLElement).style.display = 'none'; }}
                         >
                            <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#64748b", display: "flex", alignItems: "center" }} title="Cảm xúc">
                              😀
                            </button>
                            <div className="emoji-picker" style={{ display: "none", position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", paddingBottom: "8px", zIndex: 20 }}>
                               <div style={{ backgroundColor: "#fff", padding: "6px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", gap: "4px" }}>
                                 {["👍", "❤️", "😂", "😮", "😢"].map(emoji => (
                                   <button key={emoji} onClick={() => addReaction(msg._id, emoji)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", padding: "4px", transition: "transform 0.1s" }} onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.9)"} onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}>{emoji}</button>
                                 ))}
                               </div>
                            </div>
                         </div>
                         {isOwn && (
                           <>
                             <button onClick={() => { setEditingMessage(msg); setEditContent(msg.content); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px" }} title="Sửa">✏️</button>
                             <button onClick={() => deleteMessage(msg._id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", padding: "4px" }} title="Thu hồi">🗑️</button>
                           </>
                         )}
                      </div>
                    );

                    return (
                      <div key={msg._id} style={{ marginBottom: "20px", display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                        {!isOwn && <AvatarRender user={msg.sender} size="32px" />}

                        <div style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", alignItems: "center", maxWidth: "80%", marginLeft: !isOwn ? "8px" : "0" }}
                             onMouseEnter={(e) => { const m = e.currentTarget.querySelector('.message-actions'); if (m) (m as HTMLElement).style.opacity = '1'; }}
                             onMouseLeave={(e) => { const m = e.currentTarget.querySelector('.message-actions'); if (m) (m as HTMLElement).style.opacity = '0'; }}
                        >
                          <div style={{
                            padding: "12px 16px", borderRadius: "16px",
                            borderBottomRightRadius: isOwn ? "4px" : "16px",
                            borderBottomLeftRadius: !isOwn ? "4px" : "16px",
                            backgroundColor: msg.isDeleted ? "transparent" : (isOwn ? "#e5efff" : "#fff"),
                            border: msg.isDeleted ? "1px solid #cbd5e1" : "none",
                            color: msg.isDeleted ? "#94a3b8" : "#0f172a",
                            boxShadow: msg.isDeleted ? "none" : "0 1px 2px rgba(0,0,0,0.05)",
                            position: "relative", wordBreak: "break-word", whiteSpace: "pre-wrap",
                          }}>
                            {!isOwn && !msg.isDeleted && <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontWeight: "600" }}>{msg.sender?.name}</div>}
                            
                            {/* Render File/Ảnh Đính kèm */}
                            {msg.attachments && msg.attachments.length > 0 && !msg.isDeleted && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: msg.content ? "8px" : "0" }}>
                                {msg.attachments.map((file, idx) => (
                                  file.fileType === "image" ? 
                                    <img key={idx} src={file.fileUrl} alt="attachment" style={{ maxWidth: "250px", maxHeight: "250px", borderRadius: "8px", cursor: "pointer", objectFit: "cover", border: "1px solid #e2e8f0" }} onClick={() => window.open(file.fileUrl)} /> :
                                    <a key={idx} href={file.fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", padding: "8px 12px", backgroundColor: isOwn ? "#dbeafe" : "#f1f5f9", borderRadius: "8px", textDecoration: "none", color: "#0068ff", fontSize: "13px", fontWeight: "600", border: "1px solid #bfdbfe" }}>
                                      📄 {file.fileName}
                                    </a>
                                ))}
                              </div>
                            )}

                            {/* Render Text */}
                            {msg.content && <div style={{ fontStyle: msg.isDeleted ? "italic" : "normal", fontSize: "15px", lineHeight: "1.5" }}>{msg.content}</div>}
                            
                            {/* Render Reactions */}
                            {msg.reactions && msg.reactions.length > 0 && !msg.isDeleted && (
                              <div style={{ position: "absolute", bottom: "-12px", right: isOwn ? "auto" : "-10px", left: isOwn ? "-10px" : "auto", display: "flex", gap: "2px", backgroundColor: "#fff", padding: "2px 4px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", zIndex: 5 }}>
                                {Array.from(new Set(msg.reactions.map(r => r.emoji))).map((emoji, idx) => <span key={idx} style={{ fontSize: "12px" }}>{emoji}</span>)}
                                {msg.reactions.length > 1 && <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "2px", fontWeight: "bold" }}>{msg.reactions.length}</span>}
                              </div>
                            )}
                            
                            <div style={{ fontSize: "11px", marginTop: "6px", color: msg.isDeleted ? "#cbd5e1" : "#94a3b8", textAlign: "right" }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.isEdited && !msg.isDeleted && <span> (đã sửa)</span>}
                            </div>
                          </div>
                          {actionMenu}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Vùng xem trước file chuẩn bị gửi */}
              {selectedFiles.length > 0 && (
                <div style={{ padding: "12px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #e5e7eb", display: "flex", gap: "12px", overflowX: "auto" }} className="zalo-scroll">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} style={{ position: "relative", width: "64px", height: "64px", borderRadius: "8px", backgroundColor: "#e2e8f0", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "1px solid #cbd5e1" }}>
                      {file.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(file)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "20px", textAlign: "center", color: "#64748b" }}>📄<br/><span style={{fontSize: "8px"}}>{file.name.substring(0,6)}..</span></span>
                      )}
                      <button onClick={() => removeFile(idx)} style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", color: "white", border: "none", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Thanh nhập liệu (Nhập Text, Đính kèm File, Gửi) */}
              <div style={{ padding: "16px 24px", backgroundColor: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", gap: "12px", alignItems: "center" }}>
                <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
                
                <button onClick={() => fileInputRef.current?.click()} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#f1f5f9", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }} title="Đính kèm file/ảnh">
                  📎
                </button>
                
                <input
                  type="text" value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  onPaste={handlePaste}
                  placeholder="Nhập tin nhắn hoặc dán ảnh (Ctrl+V)..."
                  style={{ flex: 1, padding: "14px 20px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "24px", fontSize: "15px", outline: "none", color: "#0f172a" }}
                  disabled={uploading}
                />
                
                <button onClick={sendMessage} disabled={uploading || (!newMessage.trim() && selectedFiles.length === 0)} style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: (newMessage.trim() || selectedFiles.length > 0) && !uploading ? "#0068ff" : "#cbd5e1", color: "white", border: "none", cursor: (newMessage.trim() || selectedFiles.length > 0) && !uploading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                  {uploading ? <span style={{ fontSize: "12px", fontWeight: "bold" }}>...</span> : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12L2.01 3L2 10l15 2-15 2z" fill="currentColor"/></svg>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b", flexDirection: "column", gap: "16px" }}>
              <div style={{ width: "120px", height: "120px", backgroundColor: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>💬</div>
              <div style={{ fontSize: "16px", fontWeight: "500" }}>Chọn một hội thoại để bắt đầu</div>
            </div>
          )}
        </div>

        {/* ========================================================== */}
        {/* MODAL 1: TẠO CHAT / NHÓM MỚI */}
        {/* ========================================================== */}
        {showNewChatModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }} onClick={() => setShowNewChatModal(false)}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "460px", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Tạo cuộc trò chuyện mới</h3>
                <button onClick={() => setShowNewChatModal(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
              </div>

              {/* TABS LỰA CHỌN */}
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
                <button onClick={() => setChatMode("direct")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: chatMode === "direct" ? "2px solid #0068ff" : "2px solid transparent", color: chatMode === "direct" ? "#0068ff" : "#64748b", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Chat 1-1</button>
                <button onClick={() => setChatMode("group")} style={{ flex: 1, padding: "12px", background: "none", border: "none", borderBottom: chatMode === "group" ? "2px solid #0068ff" : "2px solid transparent", color: chatMode === "group" ? "#0068ff" : "#64748b", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Tạo Nhóm</button>
              </div>

              <div className="zalo-scroll" style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
                {chatMode === "group" && (
                  <input type="text" placeholder="Tên nhóm (Tuỳ chọn)" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", outline: "none" }} />
                )}

                <input type="text" placeholder="Tìm kiếm người dùng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px", fontSize: "14px", outline: "none" }} />

                {chatMode === "group" && selectedGroupUsers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                    {selectedGroupUsers.map(u => (
                      <div key={u._id} style={{ padding: "6px 12px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "20px", fontSize: "12px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}>
                        {u.name} <button onClick={() => toggleSelectUserForGroup(u)} style={{ background: "none", border: "none", color: "#0369a1", cursor: "pointer", fontSize: "14px", padding: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="zalo-scroll" style={{ flex: 1, overflowY: "auto", minHeight: "200px", maxHeight: "300px" }}>
                  {filteredUsers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "14px" }}>Không tìm thấy người dùng</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedGroupUsers.some(u => u._id === user._id);
                      return (
                        <div key={user._id} onClick={() => chatMode === "direct" ? createDirectConversation(user._id) : toggleSelectUserForGroup(user)} style={{ padding: "12px", marginBottom: "8px", backgroundColor: isSelected ? "#f0fdf4" : "#f8fafc", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", border: isSelected ? "1px solid #bbf7d0" : "1px solid transparent", transition: "all 0.2s" }}>
                          {chatMode === "group" && <input type="checkbox" checked={isSelected} readOnly style={{ marginRight: "12px", width: "16px", height: "16px", cursor: "pointer" }} />}
                          <AvatarRender user={user} size="36px" />
                          <div style={{ marginLeft: "12px" }}>
                            <div style={{ fontWeight: "600", color: "#0f172a", fontSize: "14px" }}>{user.name || "Người dùng ẩn"}</div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>{user.email || "Không có email"}</div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {chatMode === "group" && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                    <button onClick={createGroupConversation} disabled={selectedGroupUsers.length === 0} style={{ width: "100%", padding: "12px", backgroundColor: selectedGroupUsers.length > 0 ? "#0068ff" : "#cbd5e1", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: selectedGroupUsers.length > 0 ? "pointer" : "default", transition: "background 0.2s" }}>
                      Tạo nhóm ({selectedGroupUsers.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* MODAL 2: QUẢN LÝ NHÓM (CRUD MEMBERS) */}
        {/* ========================================================== */}
        {showGroupSettings && currentConversation && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowGroupSettings(false)}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "400px", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: "20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>Quản lý nhóm</h3>
                <button onClick={() => setShowGroupSettings(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
              </div>

              <div className="zalo-scroll" style={{ padding: "20px", overflowY: "auto", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ fontWeight: "600", color: "#334155" }}>Thành viên ({currentConversation.participants.length})</div>
                  <button onClick={() => { setShowGroupSettings(false); setShowAddMemberModal(true); }} style={{ color: "#0068ff", background: "none", border: "none", fontWeight: "600", cursor: "pointer", padding: "4px 8px", backgroundColor: "#eff6ff", borderRadius: "6px" }}>+ Thêm</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {currentConversation.participants.map(p => (
                    <div key={p.user._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <AvatarRender user={p.user} size="36px" />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#0f172a" }}>{p.user.name} {p.user._id === currentUser._id && <span style={{color: "#64748b", fontWeight: "normal"}}>(Bạn)</span>}</div>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>{p.user.email}</div>
                          {p.user._id === currentConversation.createdBy && <div style={{ fontSize: "11px", color: "#0068ff", fontWeight: "bold", marginTop: "2px" }}>Trưởng nhóm</div>}
                        </div>
                      </div>
                      
                      {p.user._id !== currentUser._id && (
                        <button onClick={() => removeMemberFromGroup(p.user._id)} style={{ padding: "6px 10px", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                          Xoá
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9" }}>
                <button onClick={deleteOrLeaveGroup} style={{ width: "100%", padding: "14px", backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor="#fee2e2"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor="#fef2f2"}>
                   Rời / Giải tán nhóm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2.1: THÊM MEMBER VÀO NHÓM */}
        {showAddMemberModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }} onClick={() => setShowAddMemberModal(false)}>
             <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={(e) => e.stopPropagation()}>
               <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#0f172a" }}>Thêm thành viên</h3>
               <input type="text" placeholder="Tìm kiếm user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "16px", outline: "none", fontSize: "14px" }} />
               
               <div className="zalo-scroll" style={{ maxHeight: "250px", overflowY: "auto", marginBottom: "16px" }}>
                 {filteredUsers.length === 0 ? (
                   <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: "14px" }}>Không có user phù hợp</div>
                 ) : (
                   filteredUsers.map(user => (
                     <div key={user._id} onClick={() => toggleSelectUserForGroup(user)} style={{ display: "flex", alignItems: "center", padding: "10px", cursor: "pointer", backgroundColor: selectedGroupUsers.some(u => u._id === user._id) ? "#f0fdf4" : "transparent", borderRadius: "8px", marginBottom: "4px" }}>
                       <input type="checkbox" checked={selectedGroupUsers.some(u => u._id === user._id)} readOnly style={{ marginRight: "12px", width: "16px", height: "16px" }} />
                       <AvatarRender user={user} size="36px" />
                       <div style={{ marginLeft: "12px", fontSize: "14px", fontWeight: "500", color: "#0f172a" }}>{user.name}</div>
                     </div>
                   ))
                 )}
               </div>

               <div style={{ display: "flex", gap: "12px" }}>
                 <button onClick={() => setShowAddMemberModal(false)} style={{ flex: 1, padding: "12px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Hủy</button>
                 <button onClick={addMembersToGroup} disabled={selectedGroupUsers.length === 0} style={{ flex: 1, padding: "12px", background: selectedGroupUsers.length > 0 ? "#0068ff" : "#cbd5e1", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: selectedGroupUsers.length > 0 ? "pointer" : "default" }}>Xác nhận</button>
               </div>
             </div>
          </div>
        )}

        {/* ========================================================== */}
        {/* MODAL 3: SỬA TIN NHẮN */}
        {/* ========================================================== */}
        {editingMessage && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "24px", width: "90%", maxWidth: "460px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#0f172a", fontSize: "18px" }}>Sửa tin nhắn</h3>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "20px", minHeight: "100px", fontSize: "14px", outline: "none", resize: "none", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button onClick={() => setEditingMessage(null)} style={{ padding: "10px 16px", border: "1px solid #e2e8f0", background: "white", color: "#334155", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Hủy</button>
                <button onClick={editMessage} style={{ padding: "10px 20px", backgroundColor: "#0068ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>Lưu</button>
              </div>
            </div>
          </div>
        )}

        {/* ERROR TOAST MÔ PHỎNG */}
        {error && (
          <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#ef4444", color: "white", padding: "12px 24px", borderRadius: "30px", zIndex: 2000, fontWeight: "500", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}>
            {error}
          </div>
        )}
      </div>
    </>
  );
};

export default Achieved;