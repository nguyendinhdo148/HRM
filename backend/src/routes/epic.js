import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  createEpic,
  getProjectEpics,
  getEpicDetails,
  updateEpic,
  deleteEpic,
  archiveEpic,
} from "../controllers/epic.js";

const router = express.Router();

// Tạo epic mới
router.post(
  "/workspace/:workspaceId/projects/:projectId/epics",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
    }),
    body: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }),
  }),
  createEpic,
);

// Lấy tất cả epics của project
router.get(
  "/workspace/:workspaceId/projects/:projectId/epics",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
    }),
  }),
  getProjectEpics,
);

// Lấy chi tiết epic
router.get(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
  }),
  getEpicDetails,
);

// Cập nhật epic
router.put(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["To do", "In Progress", "Review", "Done"]).optional(),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
    }),
  }),
  updateEpic,
);

// Xóa epic
router.delete(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
  }),
  deleteEpic,
);

// Archive/Unarchive epic
router.patch(
  "/workspace/:workspaceId/projects/:projectId/epics/:epicId/archive",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
      projectId: z.string(),
      epicId: z.string(),
    }),
  }),
  archiveEpic,
);

export default router;