// lib/fetch-util.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://pm-private-1.onrender.com/api-v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new Event("force-logout"));
    }
    return Promise.reject(error);
  },
);

const postData = async <T>(path: string, data: unknown): Promise<T> => {
  const response = await api.post(path, data);
  return response.data;
};

const fetchData = async <T>(path: string): Promise<T> => {
  const response = await api.get(path);
  return response.data;
};

const updateData = async <T>(path: string, data: unknown): Promise<T> => {
  const response = await api.put(path, data, {
    headers:
      data instanceof FormData
        ? {
            "Content-Type": "multipart/form-data",
          }
        : undefined,
  });
  return response.data;
};

const patchData = async <T>(path: string, data: unknown): Promise<T> => {
  const response = await api.patch(path, data);
  return response.data;
};

const deleteData = async <T>(path: string): Promise<T> => {
  const response = await api.delete(path);
  return response.data;
};

export { fetchData, postData, updateData, patchData, deleteData };

// ============= WORKSPACES =============
export const getWorkspaces = async () => {
  return fetchData("/workspaces");
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  return fetchData(`/workspaces/${workspaceId}`);
};

export const getWorkspaceStats = async (workspaceId: string) => {
  return fetchData(`/workspaces/${workspaceId}/stats`);
};

export const getWorkspaceProjects = async (workspaceId: string) => {
  return fetchData(`/workspaces/${workspaceId}/projects`);
};

export const createWorkspace = async (data: any) => {
  return postData("/workspaces", data);
};

export const inviteToWorkspace = async (
  workspaceId: string,
  email: string,
  role: string,
) => {
  return postData(`/workspaces/${workspaceId}/invite-member`, { email, role });
};

export const acceptInvite = async (token: string) => {
  return postData("/workspaces/accept-invite-token", { token });
};

// ============= PROJECTS =============
export const getProjects = async () => {
  return fetchData("/projects");
};

export const getProjectDetails = async (projectId: string) => {
  return fetchData(`/projects/${projectId}`);
};

export const getProjectTasks = async (projectId: string) => {
  return fetchData(`/projects/${projectId}/tasks`);
};


export const getWorkspaceProjectTasks = async (
  workspaceId: string,
  projectId: string,
) => {
  // ✅ Sửa đường dẫn đúng với backend
  return fetchData(`/projects/${projectId}/tasks`);
};

export const createProject = async (workspaceId: string, data: any) => {
  return postData(`/workspaces/${workspaceId}/create-project`, data);
};

export const updateProject = async (projectId: string, data: any) => {
  return updateData(`/projects/${projectId}`, data);
};

export const deleteProject = async (projectId: string) => {
  return deleteData(`/projects/${projectId}`);
};

export const archiveProject = async (projectId: string) => {
  return updateData(`/projects/${projectId}/archive`, {});
};

// ============= EPICS =============

export const getProjectEpics = async (
  workspaceId: string,
  projectId: string,
) => {
  return fetchData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics`,
  );
};

export const getEpicDetails = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
) => {
  return fetchData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}`,
  );
};

export const createEpic = async (
  workspaceId: string,
  projectId: string,
  data: any,
) => {
  return postData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics`,
    data,
  );
};

export const updateEpic = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  data: any,
) => {
  return updateData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}`,
    data,
  );
};

export const deleteEpic = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
) => {
  return deleteData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}`,
  );
};

export const archiveEpic = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
) => {
  return updateData(
    `/epics/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/archive`,
    {},
  );
};

// ============= STORIES =============
export const getEpicStories = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
) => {
  return fetchData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories`,
  );
};

export const getStoryDetails = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
) => {
  return fetchData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}`,
  );
};

export const createStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  data: any,
) => {
  return postData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories`,
    data,
  );
};

export const updateStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
  data: any,
) => {
  return updateData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}`,
    data,
  );
};

export const deleteStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
) => {
  return deleteData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}`,
  );
};

export const archiveStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
) => {
  return updateData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}/archive`,
    {},
  );
};

export const addTaskToStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
  taskId: string,
) => {
  return postData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}/tasks`,
    { taskId },
  );
};

export const removeTaskFromStory = async (
  workspaceId: string,
  projectId: string,
  epicId: string,
  storyId: string,
  taskId: string,
) => {
  return deleteData(
    `/stories/workspace/${workspaceId}/projects/${projectId}/epics/${epicId}/stories/${storyId}/tasks/${taskId}`,
  );
};

// ============= TASKS =============
export const getMyTasks = async () => {
  return fetchData("/tasks/my-tasks");
};

export const getTaskById = async (taskId: string) => {
  return fetchData(`/tasks/${taskId}`);
};

export const createTask = async (projectId: string, data: any) => {
  return postData(`/tasks/${projectId}/create-task`, data);
};

export const updateTaskTitle = async (taskId: string, title: string) => {
  return updateData(`/tasks/${taskId}/title`, { title });
};

export const updateTaskDescription = async (
  taskId: string,
  description: string,
) => {
  return updateData(`/tasks/${taskId}/description`, { description });
};

export const updateTaskStatus = async (taskId: string, status: string) => {
  return updateData(`/tasks/${taskId}/status`, { status });
};

export const updateTaskPriority = async (taskId: string, priority: string) => {
  return updateData(`/tasks/${taskId}/priority`, { priority });
};

export const updateTaskAssignees = async (taskId: string, assignees: string[]) => {
  return updateData(`/tasks/${taskId}/assignees`, { assignees });
};

export const addSubTask = async (taskId: string, title: string) => {
  return postData(`/tasks/${taskId}/create-subtask`, { title });
};

export const updateSubTask = async (
  taskId: string,
  subTaskId: string,
  completed: boolean,
) => {
  return updateData(`/tasks/${taskId}/update-subtask/${subTaskId}`, {
    completed,
  });
};

export const addComment = async (taskId: string, text: string) => {
  return postData(`/tasks/${taskId}/add-comment`, { text });
};

export const getComments = async (taskId: string) => {
  return fetchData(`/tasks/${taskId}/comments`);
};

export const watchTask = async (taskId: string) => {
  return postData(`/tasks/${taskId}/watch`, {});
};

export const archiveTask = async (taskId: string) => {
  return postData(`/tasks/${taskId}/achieved`, {});
};

export const deleteTask = async (taskId: string) => {
  return deleteData(`/tasks/${taskId}`);
};

export const getTaskActivity = async (resourceId: string) => {
  return fetchData(`/tasks/${resourceId}/activity`);
};

// ============= AUTH =============
export const register = async (data: any) => {
  return postData("/auth/register", data);
};

export const login = async (data: any) => {
  return postData("/auth/login", data);
};

export const verifyEmail = async (token: string) => {
  return postData("/auth/verify-email", { token });
};

export const resetPasswordRequest = async (email: string) => {
  return postData("/auth/reset-password-request", { email });
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string,
) => {
  return postData("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
};

// ============= USER =============
export const getUserProfile = async () => {
  return fetchData("/users/profile");
};

export const updateUserProfile = async (data: any) => {
  return updateData("/users/profile", data);
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) => {
  return updateData("/users/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
};