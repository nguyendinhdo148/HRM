import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  createStory,
  getEpicStories,
  getStoryDetails,
  updateStory,
  deleteStory,
  archiveStory,
  addTaskToStory,
  removeTaskFromStory,
} from "../controllers/story.js";

const router = express.Router();

// Tạo story mới
router.post(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
    body: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      assignees: z.array(z.string()).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      storyPoints: z.number().min(0).max(100).optional(),
    }),
  }),
  createStory,
);

// Lấy tất cả stories của epic
router.get(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
  }),
  getEpicStories,
);

// Lấy chi tiết story
router.get(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
    }),
  }),
  getStoryDetails,
);

// Cập nhật story
router.put(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
    }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["To do", "In Progress", "Review", "Done"]).optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      assignees: z.array(z.string()).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      storyPoints: z.number().min(0).max(100).optional(),
    }),
  }),
  updateStory,
);

// Xóa story
router.delete(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
    }),
  }),
  deleteStory,
);

// Archive/Unarchive story
router.patch(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId/archive",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
    }),
  }),
  archiveStory,
);

// Thêm task vào story
router.post(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId/tasks",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
    }),
    body: z.object({
      taskId: z.string(),
    }),
  }),
  addTaskToStory,
);

// Xóa task khỏi story
router.delete(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/stories/:storyId/tasks/:taskId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
      storyId: z.string(),
      taskId: z.string(),
    }),
  }),
  removeTaskFromStory,
);

export default router;