import express from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import { validateRequest } from "zod-express-middleware";
import { projectSchema } from "../libs/validate-schema.js";
import { z } from "zod";
import {
  createProject,
  getProjectDetails,
  getProjectTasks,
  updateProject,
  deleteProject,
  archiveProject,
  addMemberToProject,
  removeMemberFromProject,
  updateMemberRole,
} from "../controllers/project.js";

const router = express.Router();

router.post(
  "/:workspaceId/create-project",
  authMiddleware,
  validateRequest({
    params: z.object({
      workspaceId: z.string(),
    }),
    body: projectSchema,
  }),
  createProject,
);

router.get(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
  }),
  getProjectDetails,
);

router.get(
  "/:projectId/tasks",
  authMiddleware,
  validateRequest({ params: z.object({ projectId: z.string() }) }),
  getProjectTasks,
);

// Cập nhật project
router.put(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"]).optional(),
      startDate: z.string().optional(),
      dueDate: z.string().optional(),
      tags: z.string().optional(),
      progress: z.number().min(0).max(100).optional(),
    }),
  }),
  updateProject,
);

// Xóa project
router.delete(
  "/:projectId",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
  }),
  deleteProject,
);

// Archive project
router.patch(
  "/:projectId/archive",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
  }),
  archiveProject,
);

// Thêm member vào project
router.post(
  "/:projectId/members",
  authMiddleware,
  validateRequest({
    params: z.object({ projectId: z.string() }),
    body: z.object({
      userId: z.string(),
      role: z.enum(["manager", "contributor", "viewer"]).optional(),
    }),
  }),
  addMemberToProject,
);

// Xóa member khỏi project
router.delete(
  "/:projectId/members/:userId",
  authMiddleware,
  validateRequest({
    params: z.object({
      projectId: z.string(),
      userId: z.string(),
    }),
  }),
  removeMemberFromProject,
);

// Cập nhật role của member
router.put(
  "/:projectId/members/:userId",
  authMiddleware,
  validateRequest({
    params: z.object({
      projectId: z.string(),
      userId: z.string(),
    }),
    body: z.object({
      role: z.enum(["manager", "contributor", "viewer"]),
    }),
  }),
  updateMemberRole,
);

export default router;