// routes/chat.js
import express from "express";
import { z } from "zod";
import multer from "multer";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getOrCreateDirectConversation,
  getWorkspaceConversation,
  getProjectConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  updateMessage,
  deleteMessage,
  addReaction,
  markConversationAsRead,
  getAllUsersForChat,
  createGroupConversation,
  addMembersToGroup,
  removeMemberFromGroup,
  deleteGroupConversation,
  uploadFile,
} from "../controllers/chat.js";
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // Cho phép ảnh
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  
  // Cho phép tài liệu
  const allowedDocTypes = [
    "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", 
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
  ];
  if (allowedDocTypes.includes(file.mimetype)) return cb(null, true);
  
  return cb(new Error("Định dạng file không được hỗ trợ"));
};
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
const router = express.Router();

// Get all conversations for current user
router.get("/conversations", authMiddleware, getUserConversations);

// Direct message routes
router.get(
  "/conversations/direct/:userId",
  authMiddleware,
  validateRequest({
    params: z.object({
      userId: z.string(),
    }),
  }),
  getOrCreateDirectConversation
);
router.post(
  "/conversations/:conversationId/members",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
    }),
    body: z.object({
      userIds: z.array(z.string()).min(1),
    }),
  }),
  addMembersToGroup
);
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);
// Route Xoá thành viên khỏi nhóm
router.delete(
  "/conversations/:conversationId/members/:userId",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
      userId: z.string(),
    }),
  }),
  removeMemberFromGroup
);

// Route Giải tán / Xoá nhóm
router.delete(
  "/conversations/:conversationId",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
    }),
  }),
  deleteGroupConversation
);
// Workspace chat routes
router.get(
  "/conversations/workspace/:workspaceId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
    }),
  }),
  getWorkspaceConversation
);
router.post(
  "/conversations/group",
  authMiddleware,
  validateRequest({
    body: z.object({
      name: z.string().optional(),
      participantIds: z.array(z.string()).min(1),
    }),
  }),
  createGroupConversation
);
// Project chat routes
router.get(
  "/conversations/project/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({
      projectId: z.string(),
    }),
  }),
  getProjectConversation
);

// Message routes
router.get(
  "/conversations/:conversationId/messages",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
    }),
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  }),
  getMessages
);

router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
    }),
    body: z.object({
      content: z.string().min(1),
      type: z.enum(["text", "image", "file", "system"]).optional(),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
      })).optional(),
      replyToId: z.string().optional(),
      mentions: z.array(z.object({
        user: z.string(),
        offset: z.number(),
        length: z.number(),
      })).optional(),
    }),
  }),
  sendMessage
);

router.put(
  "/messages/:messageId",
  authMiddleware,
  validateRequest({
    params: z.object({
      messageId: z.string(),
    }),
    body: z.object({
      content: z.string().min(1),
    }),
  }),
  updateMessage
);

router.get("/users", authMiddleware, getAllUsersForChat);

// Get all conversations for current user
router.get("/conversations", authMiddleware, getUserConversations);
router.delete(
  "/messages/:messageId",
  authMiddleware,
  validateRequest({
    params: z.object({
      messageId: z.string(),
    }),
  }),
  deleteMessage
);

router.post(
  "/messages/:messageId/reactions",
  authMiddleware,
  validateRequest({
    params: z.object({
      messageId: z.string(),
    }),
    body: z.object({
      emoji: z.string(),
    }),
  }),
  addReaction
);

router.post(
  "/conversations/:conversationId/read",
  authMiddleware,
  validateRequest({
    params: z.object({
      conversationId: z.string(),
    }),
  }),
  markConversationAsRead
);

export default router;