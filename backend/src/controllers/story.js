import { Story } from "../models/story.js";
import { Epic } from "../models/epic.js";
import { Project } from "../models/project.js";
import { Task } from "../models/task.js";
import { recordActivity } from "../libs/index.js";

// Tạo story mới
const createStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;
    const { title, description, priority, assignees, startDate, dueDate, storyPoints } = req.body;

    // Kiểm tra epic
    const epic = await Epic.findById(epicId);
    if (!epic) {
      return res.status(404).json({ message: "Epic not found" });
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

    // Tạo story
    const story = await Story.create({
      title,
      description,
      epic: epicId,
      project: projectId,
      priority: priority || "Medium",
      assignees: assignees || [],
      startDate,
      dueDate,
      storyPoints: storyPoints || 0,
      createdBy: req.user._id,
    });

    // Thêm story vào epic
    epic.stories.push(story._id);
    await epic.save();

    // Ghi log
    await recordActivity(req.user._id, "created_story", "Story", story._id, {
      description: `Created story "${title}" in epic ${epic.title}`
    });

    res.status(201).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Lấy tất cả stories của epic
const getEpicStories = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId } = req.params;

    const stories = await Story.find({ 
      epic: epicId, 
      isArchived: false 
    })
      .populate("assignees", "name email profilePicture")
      .populate({
        path: "tasks",
        match: { isArchived: false },
        populate: "assignees"
      })
      .sort({ createdAt: -1 });

    res.status(200).json(stories);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Lấy chi tiết story
const getStoryDetails = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate("assignees", "name email profilePicture")
      .populate({
        path: "tasks",
        match: { isArchived: false },
        populate: "assignees"
      })
      .populate("createdBy", "name email profilePicture");

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    res.status(200).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cập nhật story
const updateStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId } = req.params;
    const { title, description, status, priority, assignees, startDate, dueDate, storyPoints } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
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
    if (title) story.title = title;
    if (description) story.description = description;
    if (status) story.status = status;
    if (priority) story.priority = priority;
    if (assignees) story.assignees = assignees;
    if (startDate) story.startDate = startDate;
    if (dueDate) story.dueDate = dueDate;
    if (storyPoints !== undefined) story.storyPoints = storyPoints;

    await story.save();

    await recordActivity(req.user._id, "updated_story", "Story", story._id, {
      description: `Updated story "${story.title}"`
    });

    res.status(200).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Xóa story
const deleteStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
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
      return res.status(403).json({ message: "You don't have permission to delete this story" });
    }

    // Xóa story khỏi epic
    const epic = await Epic.findById(epicId);
    if (epic) {
      epic.stories = epic.stories.filter(id => id.toString() !== storyId);
      await epic.save();
    }

    // Xóa tất cả tasks của story
    await Task.updateMany(
      { story: storyId },
      { $unset: { story: "" } }
    );

    await recordActivity(req.user._id, "deleted_story", "Story", story._id, {
      description: `Deleted story "${story.title}"`
    });

    await Story.findByIdAndDelete(storyId);

    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Archive/Unarchive story
const archiveStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
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

    story.isArchived = !story.isArchived;
    await story.save();

    await recordActivity(req.user._id, "updated_story", "Story", story._id, {
      description: `${story.isArchived ? "Archived" : "Unarchived"} story "${story.title}"`
    });

    res.status(200).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Thêm task vào story
const addTaskToStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId } = req.params;
    const { taskId } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Kiểm tra task có thuộc project không
    if (task.project.toString() !== projectId) {
      return res.status(403).json({ message: "Task does not belong to this project" });
    }

    // Thêm task vào story
    if (!story.tasks.includes(taskId)) {
      story.tasks.push(taskId);
      await story.save();
    }

    // Cập nhật task
    task.story = storyId;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Added task "${task.title}" to story "${story.title}"`
    });

    res.status(200).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Xóa task khỏi story
const removeTaskFromStory = async (req, res) => {
  try {
    const { workspaceId, projectId, epicId, storyId, taskId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Xóa task khỏi story
    story.tasks = story.tasks.filter(id => id.toString() !== taskId);
    await story.save();

    // Cập nhật task
    task.story = null;
    await task.save();

    await recordActivity(req.user._id, "updated_task", "Task", task._id, {
      description: `Removed task "${task.title}" from story "${story.title}"`
    });

    res.status(200).json(story);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createStory,
  getEpicStories,
  getStoryDetails,
  updateStory,
  deleteStory,
  archiveStory,
  addTaskToStory,
  removeTaskFromStory,
};