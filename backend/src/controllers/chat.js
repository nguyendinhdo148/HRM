// controllers/chat.js
import mongoose from "mongoose";
import { Conversation } from "../models/conversation.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { Workspace } from "../models/workspace.js";
import { Project } from "../models/project.js";
import { Notification } from "../models/notification.js";
import { v2 as cloudinary } from "cloudinary";
// Get or create direct conversation
export const getOrCreateDirectConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find existing direct conversation
    let conversation = await Conversation.findOne({
      type: "direct",
      "participants.user": { $all: [currentUserId, userId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    }).populate("participants.user", "name email profilePicture");

    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        type: "direct",
        participants: [
          { user: currentUserId },
          { user: userId },
        ],
        createdBy: currentUserId,
      });
      await conversation.save();
      
      // Populate user data
      await conversation.populate("participants.user", "name email profilePicture");
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Get or create conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get workspace conversation
export const getWorkspaceConversation = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Check workspace access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    });
    if (!workspace) {
      return res.status(403).json({ message: "You don't have access to this workspace" });
    }

    // Get or create workspace conversation
    let conversation = await Conversation.findOne({
      type: "workspace",
      workspace: workspaceId,
    });

    if (!conversation) {
      // Get all workspace members
      const members = workspace.members.map(member => ({
        user: member.user,
        lastReadAt: new Date(),
      }));

      conversation = new Conversation({
        type: "workspace",
        workspace: workspaceId,
        name: `${workspace.name} Chat`,
        participants: members,
        createdBy: userId,
      });
      await conversation.save();
    }

    // Populate participants
    await conversation.populate("participants.user", "name email profilePicture");
    await conversation.populate("lastMessage");

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Get workspace conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get project conversation
// Thêm hàm kiểm tra của mongoose ở đầu nếu chưa có
// import mongoose from "mongoose";

export const getProjectConversation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // THÊM ĐOẠN NÀY: Kiểm tra xem projectId có phải định dạng ID hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "ID dự án không hợp lệ" });
    }

    // Check project access
    const project = await Project.findOne({
      _id: projectId,
      "members.user": userId,
    });
    
    if (!project) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    // Get or create project conversation
    let conversation = await Conversation.findOne({
      type: "project",
      project: projectId,
    });

    if (!conversation) {
      // Get all project members
      const members = project.members.map(member => ({
        user: member.user,
        lastReadAt: new Date(),
      }));

      conversation = new Conversation({
        type: "project",
        project: projectId,
        name: `${project.title} Chat`,
        participants: members,
        createdBy: userId,
      });
      await conversation.save();
    }

    // Populate participants
    await conversation.populate("participants.user", "name email profilePicture");
    await conversation.populate("lastMessage");

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Get project conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Send message with notification
export const sendMessage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { conversationId } = req.params;
    const { content, type, attachments, replyToId, mentions } = req.body;
    const userId = req.user.id;

    // Find conversation with populated participants
    const conversation = await Conversation.findById(conversationId)
      .populate("participants.user", "name email profilePicture");

    if (!conversation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if user is participant
    const participant = conversation.participants.find(p => p.user._id.toString() === userId);
    if (!participant) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "You are not a participant in this conversation" });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      type: type || "text",
      attachments: attachments || [],
      replyTo: replyToId || null,
      mentions: mentions || [],
      readBy: [{ user: userId }],
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
      if (p.user._id.toString() !== userId) {
        totalUnread++;
      }
    }
    conversation.unreadCount = totalUnread;

    await conversation.save({ session });

    // Create notifications for other participants
    const otherParticipants = conversation.participants.filter(
      p => p.user._id.toString() !== userId
    );

    const notifications = [];
    for (const participant of otherParticipants) {
      const notification = new Notification({
        user: participant.user._id,
        type: "message",
        content: `New message from ${message.sender.name}`,
        conversationId: conversation._id,
        sender: userId,
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

    // Emit socket notifications
    const io = req.app.get("io");
    if (io) {
      for (const participant of otherParticipants) {
        const notification = notifications.find(
          n => n.user.toString() === participant.user._id.toString()
        );
        
        const recipientId = participant.user._id.toString();
        console.log(`📢 Emitting new_notification to user:${recipientId}`);
        
        io.to(`user:${recipientId}`).emit("new_notification", {
          _id: notification?._id,
          type: "message",
          content: `New message from ${message.sender.name}`,
          conversationId: conversation._id,
          sender: {
            _id: userId,
            name: message.sender.name,
            profilePicture: message.sender.profilePicture,
          },
          messagePreview: content.substring(0, 100),
          isRead: false,
          createdAt: new Date(),
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(p => p.user.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this conversation" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "name email profilePicture")
      .populate("replyTo", "content sender")
      .populate("readBy.user", "name email")
      .lean();

    const total = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    });

    res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user conversations
// Get user conversations
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      "participants.user": userId,
      isArchived: false,
    })
      .sort({ lastMessageAt: -1 })
      .populate("participants.user", "name email profilePicture")
      .populate("lastMessage")
      .populate("workspace", "name color")
      .populate("project", "title")
      .lean();

    // Calculate unread count for current user
    const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
      
      // FIX 1: Lọc bỏ những participant bị null (do user đã bị xoá khỏi DB)
      conv.participants = conv.participants.filter(p => p.user != null);

      // FIX 2: Xử lý an toàn khi tìm participant hiện tại
      const participant = conv.participants.find(p => {
        if (!p.user) return false;
        // Check nếu p.user đã được populate thành object thì lấy _id, nếu chưa thì lấy trực tiếp
        const idToCheck = p.user._id ? p.user._id.toString() : p.user.toString();
        return idToCheck === userId;
      });
      
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readBy: { $not: { $elemMatch: { user: userId } } },
        createdAt: { $gt: participant?.lastReadAt || new Date(0) },
        isDeleted: false,
      });
      
      return {
        ...conv,
        unreadCount,
      };
    }));

    res.status(200).json(conversationsWithUnread);
  } catch (error) {
    console.error("Get user conversations error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update message
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.error("Update message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    message.isDeleted = true;
    await message.save();

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const existingReaction = message.reactions.find(
      r => r.emoji === emoji && r.user.toString() === userId
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.emoji === emoji && r.user.toString() === userId)
      );
    } else {
      message.reactions.push({ emoji, user: userId });
    }

    await message.save();

    res.status(200).json({ reactions: message.reactions });
  } catch (error) {
    console.error("Add reaction error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getAllUsersForChat = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Lấy tất cả user ngoại trừ user đang đăng nhập
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select("name email profilePicture"); // Chỉ lấy các trường cần thiết

    res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Thêm thành viên vào nhóm
export const addMembersToGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userIds } = req.body; // Mảng chứa ID các user cần thêm

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy hội thoại" });
    }

    // Lọc ra những user chưa có trong nhóm để tránh thêm trùng
    const newParticipants = userIds
      .filter(userId => !conversation.participants.some(p => p.user.toString() === userId))
      .map(userId => ({
        user: userId,
        lastReadAt: new Date(),
      }));

    if (newParticipants.length === 0) {
      return res.status(400).json({ message: "Các thành viên này đã có trong nhóm" });
    }

    // Push vào mảng participants hiện tại
    conversation.participants.push(...newParticipants);
    await conversation.save();

    // Populate lại để trả về cho FE hiển thị thông tin user (tên, avatar)
    await conversation.populate("participants.user", "name email profilePicture");

    res.status(200).json(conversation);
  } catch (error) {
    console.error("Lỗi thêm thành viên:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Xoá thành viên khỏi nhóm (hoặc tự rời nhóm)
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy hội thoại" });
    }

    // Lọc bỏ user cần xoá ra khỏi mảng
    conversation.participants = conversation.participants.filter(
      (p) => p.user.toString() !== userId
    );

    await conversation.save();

    res.status(200).json({ message: "Đã xoá thành viên thành công" });
  } catch (error) {
    console.error("Lỗi xoá thành viên:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// Hàm xử lý upload file lên Cloudinary
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không tìm thấy file tải lên" });
    }

    // 1. LẤY TÊN GỐC VÀ ĐUÔI FILE
    const originalName = req.file.originalname;
    const nameParts = originalName.split('.');
    const ext = nameParts.pop(); // Đuôi file (VD: docx, pdf, png)
    const nameWithoutExt = nameParts.join('.'); // Tên file bỏ đuôi

    // 2. LÀM SẠCH TÊN FILE (Bỏ dấu Tiếng Việt, dấu cách, ký tự đặc biệt để URL không bị lỗi)
    const safeName = nameWithoutExt
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu Tiếng Việt
      .replace(/[^a-zA-Z0-9]/g, '_') // Biến ký tự lạ/dấu cách thành dấu gạch dưới
      .replace(/_+/g, '_'); // Gộp các dấu gạch dưới thừa

    // 3. ĐẶT LẠI TÊN CHO CLOUDINARY (Tên file sạch + Mã thời gian chống trùng + Đuôi)
    const publicId = `${safeName}_${Date.now()}.${ext}`;

    // Chuyển buffer từ RAM thành chuỗi Base64
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload lên Cloudinary kèm theo public_id vừa tạo
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "chat_attachments",
      resource_type: "auto", 
      public_id: publicId // Ép Cloudinary phải dùng tên này
    });

    // Trả về dữ liệu cho Frontend
    res.status(200).json({ 
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes
    });

  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error);
    res.status(500).json({ message: "Lỗi tải file lên máy chủ", error: error.message });
  }
};
// Giải tán / Xoá nhóm
export const deleteGroupConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Tuỳ chọn: Xoá luôn tất cả tin nhắn thuộc về nhóm này cho sạch Database
    await Message.deleteMany({ conversation: conversationId });

    // Xoá document nhóm
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: "Đã giải tán nhóm" });
  } catch (error) {
    console.error("Lỗi xoá nhóm:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// Thêm hàm tạo nhóm chat tuỳ chọn
export const createGroupConversation = async (req, res) => {
  try {
    const { name, participantIds } = req.body;
    const currentUserId = req.user.id;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: "Vui lòng chọn ít nhất 1 thành viên để tạo nhóm" });
    }

    // Gộp user hiện tại vào danh sách thành viên (lọc trùng bằng Set)
    const uniqueParticipantIds = [...new Set([...participantIds, currentUserId])];
    const participants = uniqueParticipantIds.map(id => ({
      user: id,
      lastReadAt: new Date(),
    }));

    const conversation = new Conversation({
      type: "group", // Đổi type thành group
      name: name || "Nhóm trò chuyện mới",
      participants,
      createdBy: currentUserId,
    });

    await conversation.save();
    
    // Populate dữ liệu để trả về cho Frontend hiển thị ngay
    await conversation.populate("participants.user", "name email profilePicture");

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Create group conversation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Mark conversation as read
export const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
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

    res.status(200).json({ message: "Conversation marked as read" });
  } catch (error) {
    console.error("Mark conversation as read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};