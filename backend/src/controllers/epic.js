import { Epic } from "../models/epic.js";
import { Project } from "../models/project.js";
import { Workspace } from "../models/workspace.js";
import { recordActivity } from "../libs/index.js";

// Tạo Epic mới
const createEpic = async (req, res) => {
  try {
    const { workspaceId, projectId } = req.params;
    const { title, description, priority, startDate, dueDate } = req.body;

    // Kiểm tra workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Kiểm tra project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Kiểm tra project có thuộc workspace không
    if (project.workspace.toString() !== workspaceId) {
      return res.status(403).json({ message: "Project does not belong to this workspace" });
    }

    // Kiểm tra quyền
    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    // Tạo epic
    const epic = await Epic.create({
      title,
      description,
      project: projectId,
      priority: priority || "Medium",
      startDate,
      dueDate,
      createdBy: req.user._id,
    });

    // Thêm epic vào project
    project.epics.push(epic._id);
    await project.save();

    // Ghi log activity
    await recordActivity(req.user._id, "created_epic", "Epic", epic._id, {
      description: `Created epic "${title}" in project ${project.title}`,
    });

    res.status(201).json(epic);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Lấy tất cả epics của project
const getProjectEpics = async (req, res) => {
  try {
    const { workspaceId, projectId } = req.params;

    // Kiểm tra workspace
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Kiểm tra project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Kiểm tra quyền
    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    // Lấy epics và populate stories
    const epics = await Epic.find({ 
      project: projectId, 
      isArchived: false 
    })
      .populate({
        path: "stories",
        match: { isArchived: false },
        populate: {
          path: "tasks",
          match: { isArchived: false }
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(epics);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Lấy chi tiết epic
const getEpicDetails = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;

    const epic = await Epic.findById(epicId)
      .populate({
        path: "stories",
        match: { isArchived: false },
        populate: {
          path: "tasks",
          match: { isArchived: false },
          populate: "assignees", 
        }
      })
      .populate("createdBy", "name email profilePicture");

    if (!epic) {
      return res.status(404).json({ message: "Epic not found" });
    }

    // Kiểm tra epic có thuộc project không
    if (epic.project.toString() !== projectId) {
      return res.status(403).json({ message: "Epic does not belong to this project" });
    }

    res.status(200).json(epic);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật epic
const updateEpic = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;
    const { title, description, status, priority, startDate, dueDate } = req.body;

    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({ message: "Epic not found" });
    }

    // Kiểm tra quyền
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    // Cập nhật
    if (title) epic.title = title;
    if (description) epic.description = description;
    if (status) epic.status = status;
    if (priority) epic.priority = priority;
    if (startDate) epic.startDate = startDate;
    if (dueDate) epic.dueDate = dueDate;

    await epic.save();

    // Ghi log
    await recordActivity(req.user._id, "updated_epic", "Epic", epic._id, {
      description: `Updated epic "${epic.title}"`
    });

    res.status(200).json(epic);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Xóa epic
const deleteEpic = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;

    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({ message: "Epic not found" });
    }

    // Kiểm tra quyền
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!currentMember || currentMember.role === "viewer") {
      return res.status(403).json({ message: "You don't have permission to delete this epic" });
    }

    // Xóa epic khỏi project
    project.epics = project.epics.filter(id => id.toString() !== epicId);
    await project.save();

    // Ghi log
    await recordActivity(req.user._id, "deleted_epic", "Epic", epic._id, {
      description: `Deleted epic "${epic.title}"`
    });

    // Xóa epic và tất cả stories bên trong
    await Epic.findByIdAndDelete(epicId);
    // Có thể xóa stories ở đây nếu muốn cascade

    res.status(200).json({ message: "Epic deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Archive/Unarchive epic
const archiveEpic = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;

    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({ message: "Epic not found" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    epic.isArchived = !epic.isArchived;
    await epic.save();

    await recordActivity(req.user._id, "updated_epic", "Epic", epic._id, {
      description: `${epic.isArchived ? "Archived" : "Unarchived"} epic "${epic.title}"`
    });

    res.status(200).json(epic);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createEpic,
  getProjectEpics,
  getEpicDetails,
  updateEpic,
  deleteEpic,
  archiveEpic,
};