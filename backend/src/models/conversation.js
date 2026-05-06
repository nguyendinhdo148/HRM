// models/conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // Type of conversation
    type: {
      type: String,
      // Đã thêm "group" vào đây để hết lỗi Validation
      enum: ["direct", "workspace", "project", "group"],
      required: true,
    },
    // For direct messages: array of two users
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        lastReadAt: {
          type: Date,
          default: Date.now,
        },
        isMuted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // For workspace chat
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
    },
    // For project chat
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    // Conversation name (for groups/workspace/project)
    name: {
      type: String,
      trim: true,
    },
    // Avatar/Icon for the conversation
    avatar: {
      type: String,
    },
    // Last message preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageText: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Total unread count for the conversation
    unreadCount: {
      type: Number,
      default: 0,
    },
    // Is conversation archived
    isArchived: {
      type: Boolean,
      default: false,
    },
    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ workspace: 1 });
conversationSchema.index({ project: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ "participants.user": 1, type: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);