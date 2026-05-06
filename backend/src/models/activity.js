import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "created_task",
        "updated_task",
        "created_subtask",
        "updated_subtask",
        "completed_task",
        "created_project",
        "updated_project",
        "completed_project",
        "created_workspace",
        "updated_workspace",
        "added_comment",
        "added_member",
        "removed_member",
        "joined_workspace",
        "transferred_workspace_ownership",
        "added_attachment",
      ],
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["Task", "Project", "Workspace", "Comment", "User"],
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: Object,
    },
  },
  { timestamps: true },
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
