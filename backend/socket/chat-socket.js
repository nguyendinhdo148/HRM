// socket/chat-socket.js
import jwt from "jsonwebtoken";
import { Conversation } from "../models/conversation.js";
import { Message } from "../models/message.js";
import { Notification } from "../models/notification.js";
import mongoose from "mongoose";

// Helper function to create message in database
const createMessageInDB = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { conversationId, senderId, content, type, attachments, replyToId, mentions } = data;

    // Find conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if user is participant
    const participant = conversation.participants.find(p => p.user.toString() === senderId);
    if (!participant) {
      throw new Error("You are not a participant in this conversation");
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: senderId,
      content,
      type: type || "text",
      attachments: attachments || [],
      replyTo: replyToId || null,
      mentions: mentions || [],
      readBy: [{ user: senderId }],
    });

    await message.save({ session });
    await message.populate("sender", "name email profilePicture");

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageText = content.substring(0, 100);
    conversation.lastMessageAt = new Date();

    // Update unread count for other participants
    let totalUnread = 0;
    for (const p of conversation.participants) {
      if (p.user.toString() !== senderId) {
        totalUnread++;
      }
    }
    conversation.unreadCount = totalUnread;

    await conversation.save({ session });

    // Create notifications for other participants
    const otherParticipants = conversation.participants.filter(
      p => p.user.toString() !== senderId
    );

    const notifications = [];
    for (const participant of otherParticipants) {
      const notification = new Notification({
        user: participant.user,
        type: "message",
        content: `New message from ${message.sender.name}`,
        conversationId: conversation._id,
        sender: senderId,
        metadata: {
          messagePreview: content.substring(0, 100),
          senderName: message.sender.name,
          conversationType: conversation.type,
        },
      });
      notifications.push(notification);
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return {
      message,
      notifications,
      otherParticipants,
      conversation,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Helper function to get conversation with participants
const getConversationWithParticipants = async (conversationId) => {
  return await Conversation.findById(conversationId)
    .populate("participants.user", "name email profilePicture")
    .lean();
};

// Helper function to mark conversation as read
const markConversationAsRead = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const participant = conversation.participants.find(p => p.user.toString() === userId);
  if (participant) {
    participant.lastReadAt = new Date();
    await conversation.save();
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      "readBy.user": { $ne: userId },
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    }
  );

  return conversation;
};

export const initializeChatSocket = (io) => {
  const chatNamespace = io.of("/chat");
  
  chatNamespace.use((socket, next) => {
    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    
    try {
      // Verify JWT token and attach user to socket
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err);
      next(new Error("Authentication error"));
    }
  });
  
  chatNamespace.on("connection", (socket) => {
    console.log("User connected to chat:", socket.userId);
    
    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);
    
    // Handle joining conversation rooms
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });
    
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });
    
    // Handle sending message
    socket.on("send-message", async (data) => {
      try {
        const { conversationId, content, type, attachments, replyToId, mentions } = data;
        
        // Create message in database with notifications
        const result = await createMessageInDB({
          conversationId,
          senderId: socket.userId,
          content,
          type,
          attachments,
          replyToId,
          mentions,
        });
        
        const { message, notifications, otherParticipants, conversation } = result;
        
        // Emit new message to conversation room
        chatNamespace.to(`conversation:${conversationId}`).emit("new-message", message);
        
        // Send notifications to other participants
        for (const participant of otherParticipants) {
          const notification = notifications.find(
            n => n.user.toString() === participant.user.toString()
          );
          
          // Send notification to user's personal room
          chatNamespace.to(`user:${participant.user}`).emit("new_notification", {
            _id: notification?._id,
            type: "message",
            content: `New message from ${message.sender.name}`,
            conversationId: conversation._id,
            sender: {
              _id: socket.userId,
              name: message.sender.name,
              profilePicture: message.sender.profilePicture,
            },
            messagePreview: content.substring(0, 100),
            createdAt: new Date(),
          });
          
          // Also send message notification with unread count
          chatNamespace.to(`user:${participant.user}`).emit("message-notification", {
            conversationId: conversation._id,
            message: message,
            unreadCount: conversation.unreadCount,
          });
        }
        
        // Confirm message sent to sender
        socket.emit("message-sent", message);
        
      } catch (error) {
        console.error("Socket send message error:", error);
        socket.emit("message-error", { error: error.message });
      }
    });
    
    // Handle typing indicator
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        userId: socket.userId,
        conversationId,
        isTyping,
      });
    });
    
    // Handle mark as read
    socket.on("mark-read", async ({ conversationId }) => {
      try {
        await markConversationAsRead(conversationId, socket.userId);
        
        // Notify conversation room that user has read messages
        socket.to(`conversation:${conversationId}`).emit("messages-read", {
          conversationId,
          userId: socket.userId,
          readAt: new Date(),
        });
        
      } catch (error) {
        console.error("Socket mark read error:", error);
        socket.emit("error", { error: error.message });
      }
    });
    
    // Handle getting online status
    socket.on("get-online-status", ({ userIds }) => {
      const onlineUsers = [];
      for (const userId of userIds) {
        const room = chatNamespace.adapter.rooms.get(`user:${userId}`);
        if (room && room.size > 0) {
          onlineUsers.push(userId);
        }
      }
      socket.emit("online-status", { users: onlineUsers });
    });
    
    socket.on("disconnect", () => {
      console.log("User disconnected from chat:", socket.userId);
      
      // Notify others that user went offline
      socket.broadcast.emit("user-offline", {
        userId: socket.userId,
        timestamp: new Date(),
      });
    });
  });
  
  return chatNamespace;
};