// routes/notification.js
import express from "express";
import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import authMiddleware from "../middleware/auth-middleware.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.js";

const router = express.Router();

// Mark all notifications as read (must be before /:notificationId routes)
router.patch(
  "/read-all",
  authMiddleware,
  markAllAsRead
);

// Get user notifications
router.get(
  "/",
  authMiddleware,
  validateRequest({
    query: z.object({
      limit: z.string().optional(),
      page: z.string().optional(),
    }),
  }),
  getNotifications
);

// Mark notification as read
router.patch(
  "/:notificationId/read",
  authMiddleware,
  validateRequest({
    params: z.object({
      notificationId: z.string(),
    }),
  }),
  markAsRead
);

// Delete notification
router.delete(
  "/:notificationId",
  authMiddleware,
  validateRequest({
    params: z.object({
      notificationId: z.string(),
    }),
  }),
  deleteNotification
);

export default router;