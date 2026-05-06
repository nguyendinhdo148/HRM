import { Project } from "../models/project.js";
import { Task } from "../models/task.js";
import { Workspace } from "../models/workspace.js";
import { Notification } from "../models/notification.js";
const createProject = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { title, description, status, startDate, dueDate, tags, members } =
      req.body;

    // tìm workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        message: "Workspace not found",
      });
    }

    // check quyền
    const isOwner = workspace.owner.toString() === req.user._id.toString();

    const currentMember = workspace.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isOwner && !currentMember) {
      return res.status(403).json({
        message: "You are not a member of this workspace",
      });
    }

    // chặn member / viewer
    if (!isOwner && currentMember.role !== "admin") {
      return res.status(403).json({
        message: "Only owner or admin can create project",
      });
    }

    // xử lý tags
    const tagArray = tags ? tags.split(",") : [];

    // xử lý members
    const projectMembers = Array.isArray(members) ? [...members] : [];

    const hasCreator = projectMembers.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    // đảm bảo creator luôn có trong project
    if (!hasCreator) {
      projectMembers.push({
        user: req.user._id,
        role: "manager",
      });
    }

    // 🚀 create project
    const newProject = await Project.create({
      title,
      description,
      status,
      startDate,
      dueDate,
      tags: tagArray,
      workspace: workspaceId,
      members: projectMembers,
      createdBy: req.user._id,
    });

    // 📌 add vào workspace
    workspace.projects.push(newProject._id);
    await workspace.save();

    return res.status(201).json(newProject);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId)
      .populate("members.user", "name email profilePicture")
      .populate({
        path: "epics",
        match: { isArchived: false },
        populate: {
          path: "stories",
          match: { isArchived: false },
          populate: {
            path: "tasks",
            match: { isArchived: false },
            populate: {
              path: "assignees",
              select: "name profilePicture"
            }
          }
        }
      });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );
    const isCreator = project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== "cashier") {
      const workspace = await Workspace.findById(project.workspace);
      const isWorkspaceMember = workspace?.members.some(
        (member) => member.user.toString() === req.user._id.toString(),
      );

      if (!isWorkspaceMember) {
        return res.status(403).json({
          message: "You are not a member of this project or workspace",
        });
      }
    }

    return res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId)
      .populate("members.user")
      .populate({
        path: "epics",
        match: { isArchived: false },
        populate: {
          path: "stories",
          match: { isArchived: false },
          populate: {
            path: "tasks",
            match: { isArchived: false },
            populate: {
              path: "assignees",
              select: "name profilePicture"
            }
          }
        }
      });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user._id.toString() === req.user._id.toString(),
    );
    const isCreator = project.createdBy.toString() === req.user._id.toString();

    if (!isMember && !isCreator && req.user.role !== "cashier") {
      const workspace = await Workspace.findById(project.workspace);
      const isWorkspaceMember = workspace?.members.some(
        (member) => member.user.toString() === req.user._id.toString(),
      );

      if (!isWorkspaceMember) {
        return res.status(403).json({
          message: "You are not a member of this project or workspace",
        });
      }
    }

    const tasks = await Task.find({
      project: projectId,
      isArchived: false,
    })
      .populate("assignees", "name profilePicture")
      .populate({
        path: "story",
        select: "title epic",
        populate: {
          path: "epic",
          select: "title"
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      project,
      tasks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, status, startDate, dueDate, tags, progress } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;
    if (startDate) project.startDate = startDate;
    if (dueDate) project.dueDate = dueDate;
    if (tags) project.tags = tags.split(",");
    if (progress !== undefined) project.progress = progress;

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember || currentMember.role !== "manager") {
      return res.status(403).json({
        message: "You don't have permission to delete this project",
      });
    }

    // Xóa tất cả tasks của project
    await Task.deleteMany({ project: projectId });

    // Xóa project khỏi workspace
    const workspace = await Workspace.findById(project.workspace);
    if (workspace) {
      workspace.projects = workspace.projects.filter(
        (id) => id.toString() !== projectId
      );
      await workspace.save();
    }

    // Xóa project
    await Project.findByIdAndDelete(projectId);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const archiveProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res.status(403).json({
        message: "You are not a member of this project",
      });
    }

    project.isArchived = !project.isArchived;
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const addMemberToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    const project = await Project.findById(projectId)
      .populate("createdBy", "name email")
      .populate("workspace", "name");

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember || currentMember.role !== "manager") {
      return res.status(403).json({
        message: "Only manager can add members to project",
      });
    }

    const isAlreadyMember = project.members.some(
      (member) => member.user.toString() === userId
    );

    if (isAlreadyMember) {
      return res.status(400).json({
        message: "User is already a member of this project",
      });
    }

    project.members.push({
      user: userId,
      role: role || "contributor",
    });

    await project.save();

    // Create notification for the new member
    const notification = new Notification({
      user: userId,
      type: "project",
      content: `You have been added to project "${project.title}" by ${req.user.name}`,
      projectId: project._id,
      sender: req.user._id,
      metadata: {
        projectTitle: project.title,
        projectStatus: project.status,
        workspaceName: project.workspace?.name,
        role: role || "contributor",
      },
    });

    await notification.save();

    // Emit socket notification
    const io = req.app.get("io");
    if (io) {
      console.log(`📢 Emitting project invite notification to user:${userId}`);
      io.to(`user:${userId}`).emit("new_notification", {
        _id: notification._id,
        type: "project",
        content: `You have been added to project "${project.title}"`,
        projectId: project._id,
        sender: {
          _id: req.user._id,
          name: req.user.name,
        },
        metadata: {
          projectTitle: project.title,
          role: role || "contributor",
        },
        isRead: false,
        createdAt: notification.createdAt,
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const removeMemberFromProject = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember || currentMember.role !== "manager") {
      return res.status(403).json({
        message: "Only manager can remove members from project",
      });
    }

    project.members = project.members.filter(
      (member) => member.user.toString() !== userId
    );

    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const currentMember = project.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember || currentMember.role !== "manager") {
      return res.status(403).json({
        message: "Only manager can update member roles",
      });
    }

    const member = project.members.find(
      (member) => member.user.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        message: "Member not found in this project",
      });
    }

    member.role = role;
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createProject,
  getProjectDetails,
  getProjectTasks,
  updateProject,
  deleteProject,
  archiveProject,
  addMemberToProject,
  removeMemberFromProject,
  updateMemberRole,
};