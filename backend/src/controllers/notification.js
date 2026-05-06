// controllers/notification.js
import { Notification } from "../models/notification.js";

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, page = 1 } = req.query;

    console.log("🔍 DEBUG getNotifications:");
    console.log("  userId:", userId);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sender", "name email profilePicture")
        .populate("conversationId", "type participants")
        .populate("projectId", "title")
        .lean(),
      Notification.countDocuments({ user: userId }),
    ]);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    console.log("  total notifications:", total);
    console.log("  unread count:", unreadCount);

    res.status(200).json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    console.log("� PATCH /notifications/:id/read called");
    console.log("�🔍 DEBUG markAsRead:");
    console.log("  notificationId:", notificationId);
    console.log("  userId:", userId);

    // Check if notification exists in DB
    const existingNotification = await Notification.findById(notificationId);
    console.log("  DB notification found:", !!existingNotification);
    if (existingNotification) {
      console.log("    notification.user:", existingNotification.user.toString());
      console.log("    notification.isRead:", existingNotification.isRead);
      console.log("    user match:", existingNotification.user.toString() === userId.toString());
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    console.log("  Update result:", !!notification);

    if (!notification) {
      console.log("  ❌ Notification not found or user mismatch!");
      return res.status(404).json({ message: "Notification not found" });
    }

    console.log("  ✅ Notification updated successfully");

    // Send response with complete data first
    const responseData = {
      success: true,
      notification: notification,
      message: "Notification marked as read",
    };
    
    res.status(200).json(responseData);

    // Emit socket event AFTER response sent
    const io = req.app.get("io");
    if (io) {
      console.log(`📢 Emitting notification_read event for: ${notificationId} to user:${userId}`);
      io.to(`user:${userId}`).emit("notification_read", notificationId);
    }
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("� PATCH /notifications/read-all called");
    console.log("�🔍 DEBUG markAllAsRead:");
    console.log("  userId:", userId);

    // Count unread before
    const unreadBefore = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });
    console.log("  unread count before:", unreadBefore);

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    console.log(`  ✅ Marked ${result.modifiedCount} notifications as read for user:${userId}`);

    // Emit socket event to all connected clients of this user
    const io = req.app.get("io");
    if (io) {
      console.log(`📢 Emitting all_notifications_read event for user: ${userId}`);
      io.to(`user:${userId}`).emit("all_notifications_read");
    }

    res.status(200).json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};