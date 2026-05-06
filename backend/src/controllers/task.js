import { Project } from "../models/project.js";
import { Task } from "../models/task.js";
import { ActivityLog } from "../models/activity.js";
import { Comment } from "../models/comment.js";
import { recordActivity } from "../libs/index.js";

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    // check user có trong project không
    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    // chặn viewer
    if (currentMember.role === "viewer") {
      return res.status(403).json({
        message: "Bạn không có quyền tạo công nợ",
      });
    }

    // tạo task (công nợ)
    const task = await Task.create({
      ...req.body,
      project: projectId,
      createdBy: req.user._id,
    });

    // add vào project
    project.tasks.push(task._id);
    await project.save();

    return res.status(201).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignees", "name profilePicture")
      .populate("watchers", "name profilePicture")
      .populate({
        path: "story",
        populate: {
          path: "epic",
        },
      });

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project).populate(
      "members.user",
      "name profilePicture",
    );

    res.status(200).json({ task, project });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateTaskTitle = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const oldTitle = task.title;

    task.title = title;
    await task.save();

    const formattedOldAmount = Number(oldTitle).toLocaleString("vi-VN");
    const formattedNewAmount = Number(title).toLocaleString("vi-VN");

    //record activity
    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Đã cập nhật số tiền nợ từ "${formattedOldAmount} ₫" thành "${formattedNewAmount} ₫"`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateTaskDescription = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const oldDescription =
      (task.description || "").substring(0, 50) +
      ((task.description || "").length > 50 ? "..." : "");

    task.description = description;
    await task.save();

    const newDescription =
      (description || "").substring(0, 50) +
      ((description || "").length > 50 ? "..." : "");

    //record activity
    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Đã cập nhật ghi chú từ "${oldDescription}" thành "${newDescription}"`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const oldStatus = task.status;

    task.status = status;
    await task.save();

    //record activity
    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Đã cập nhật trạng thái công nợ từ "${oldStatus}" sang "${status}"`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assignees } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const oldAssignees = task.assignees;

    task.assignees = assignees;
    await task.save();

    //record activity
    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Đã cập nhật người liên quan từ "${oldAssignees.length}" thành "${assignees.length}" người`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateTaskPriority = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { priority } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const oldPriority = task.priority;

    task.priority = priority;
    await task.save();

    //record activity
    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Đã cập nhật mức độ ưu tiên của công nợ từ "${oldPriority}" đến "${priority}"`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    project.tasks = project.tasks.filter(
      (projectTaskId) => projectTaskId.toString() !== task._id.toString(),
    );
    await project.save();

    await Comment.deleteMany({ task: task._id });
    await ActivityLog.deleteMany({ resourceId: task._id });
    await Task.findByIdAndDelete(task._id);

    return res.status(200).json({
      message: "Đã xóa công nợ thành công",
      taskId: task._id,
      projectId: project._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const addSubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const newSubTask = {
      title,
      completed: false,
    };

    task.subtasks.push(newSubTask);
    await task.save();

    const formattedAmount = Number(title).toLocaleString("vi-VN");

    //record activity
    await recordActivity(req.user._id, "created_subtask", "Task", task._id, {
      description: `Đã thêm khoản trả: ${formattedAmount} ₫`,
    });

    res.status(201).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const updateSubTask = async (req, res) => {
  try {
    const { taskId, subTaskId } = req.params;
    const { completed } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const subTask = task.subtasks.find(
      (subTask) => subTask._id.toString() === subTaskId,
    );
    if (!subTask) {
      return res.status(404).json({
        message: "Không tìm thấy khoản trả này",
      });
    }

    // Cập nhật trạng thái completed
    subTask.completed = completed;

    await task.save();

    // Format số tiền kiểu 1.000.000
    const formattedAmount = Number(subTask.title).toLocaleString("vi-VN");

    // Ghi activity
    await recordActivity(req.user._id, "updated_subtask", "Task", task._id, {
      description: `Đã ${completed ? "xác nhận" : "hủy xác nhận"} khoản trả: ${formattedAmount} ₫`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getActivityByResourceId = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const activity = await ActivityLog.find({ resourceId })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(activity);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const newComment = await Comment.create({
      text,
      task: taskId,
      author: req.user._id,
    });

    task.comments.push(newComment._id);
    await task.save();

    //record activity
    await recordActivity(req.user._id, "added_comment", "Task", task._id, {
      description: `Đã thêm bình luận: "${text.substring(
        0,
        50,
      )}${text.length > 50 ? "..." : ""}"`,
    });

    res.status(201).json(newComment);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getCommentsByTaskId = async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await Comment.find({ task: taskId })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    if (!comments) {
      return res.status(404).json({
        message: "Không tìm thấy bình luận",
      });
    }

    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const watchTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }

    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const isWatching = task.watchers.includes(req.user._id);

    if (!isWatching) {
      task.watchers.push(req.user._id);
    } else {
      task.watchers = task.watchers.filter(
        (watcher) => watcher.toString() !== req.user._id.toString(),
      );
    }

    await task.save();

    const formattedAmount = Number(task.title).toLocaleString("vi-VN");

    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `${isWatching ? "Đã ngừng theo dõi" : "Đã bắt đầu theo dõi"} công nợ: ${formattedAmount} ₫`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const achievedTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Không tìm thấy công nợ",
      });
    }
    const project = await Project.findById(task.project);

    if (!project) {
      return res.status(404).json({
        message: "Không tìm thấy dự án",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "Bạn không phải là thành viên của dự án này",
      });
    }

    const isAchieved = task.isArchived;

    task.isArchived = !isAchieved;

    await task.save();

    const formattedAmount = Number(task.title).toLocaleString("vi-VN");

    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `${isAchieved ? "Đã bỏ lưu trữ" : "Đã lưu trữ"} công nợ: ${formattedAmount} ₫`,
    });

    res.status(200).json(task);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    // Nếu là cashier thì xem tất cả tasks, ngược lại chỉ xem tasks được assign
    const query = req.user.role === "cashier"
      ? {} // Tất cả tasks
      : { assignees: { $in: [req.user._id] } }; // Chỉ tasks được assign

    const tasks = await Task.find(query)
      .populate("project", "title workspace")
      .sort({ createdAt: -1 });

    res.status(200).json(tasks);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Lỗi máy chủ nội bộ" });
  }
};

export {
  createTask,
  getTaskById,
  updateTaskTitle,
  updateTaskDescription,
  updateTaskStatus,
  updateTaskAssignees,
  updateTaskPriority,
  addSubTask,
  updateSubTask,
  getActivityByResourceId,
  addComment,
  getCommentsByTaskId,
  watchTask,
  achievedTask,
  deleteTask,
  getMyTasks,
};