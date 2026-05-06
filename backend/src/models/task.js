import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    // Đã đổi thành Number và xóa trim: true
    title: { type: Number, required: true }, 
    description: { type: String, trim: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    story: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story",
    },
    status: {
      type: String,
      enum: ["To do", "In Progress", "Review", "Done"],
      default: "To do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    dueDate: { type: Date },
    completeAt: { type: Date },
    estimatedTime: { type: Number, min: 0 },
    actualTime: { type: Number, min: 0 },
    tags: [{ type: String }],
    subtasks: [
      {
        title: {
          type: Number, // Đã đổi thành Number
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Task = mongoose.model("Task", taskSchema);