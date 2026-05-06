import { Loader } from "@/components/loader";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { Button } from "@/components/ui/button";
import { UseProjectQuery } from "@/hooks/use-project";
import { useUpdateTaskStatusMutation } from "@/hooks/use-task";
import { getProjectProgress } from "@/lib";
import type { Project, Task, TaskStatus } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ProjectHeader } from "../components/ProjectHeader";
import { ProjectStatsGrid } from "../components/ProjectStatsGrid";
import { TaskBoardView } from "../components/tasks/TaskBoardView";
import { TaskListView } from "../components/tasks/TaskListView";
import { TaskToolbar } from "../components/TaskToolbar";

const ProjectDetails = () => {
  const { projectId, workspaceId } = useParams<{
    projectId: string;
    workspaceId: string;
  }>();
  const navigate = useNavigate();

  const [isCreateTask, setIsCreateTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskStatus | "All">("All");
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  const { data, isLoading, refetch } = UseProjectQuery(projectId!) as {
    data: { tasks: Task[]; project: Project & { epics?: any[] } };
    isLoading: boolean;
    refetch: () => void;
  };

  const { mutate: updateTaskStatus } = useUpdateTaskStatusMutation();

  useEffect(() => {
    if (data?.tasks) {
      setLocalTasks(data.tasks);
    }
  }, [data?.tasks]);

  const taskCounts = useMemo(
    () => ({
      todo: localTasks.filter((t) => t.status === "To do").length,
      inProgress: localTasks.filter((t) => t.status === "In Progress").length,
      done: localTasks.filter((t) => t.status === "Done").length,
    }),
    [localTasks],
  );

  const epicStats = useMemo(() => {
    if (!data?.project?.epics) return { totalEpics: 0, totalStories: 0 };
    const totalStories = data.project.epics.reduce(
      (acc: number, epic: any) => acc + (epic.stories?.length || 0),
      0,
    );
    return { totalEpics: data.project.epics.length, totalStories };
  }, [data?.project?.epics]);

  const projectProgress = getProjectProgress(localTasks);

  const filteredTasks = useMemo(() => {
    let filtered = localTasks;
    if (selectedStoryId) {
      filtered = filtered.filter((t) => t.story?._id === selectedStoryId);
    } else if (selectedEpicId) {
      filtered = filtered.filter((t) => t.story?.epic?._id === selectedEpicId);
    }
    if (taskFilter !== "All") {
      filtered = filtered.filter((t) => t.status === taskFilter);
    }
    return filtered;
  }, [localTasks, selectedEpicId, selectedStoryId, taskFilter]);

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const prev = localTasks;
      setLocalTasks((tasks) =>
        tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)),
      );
      updateTaskStatus(
        { taskId, status: newStatus },
        {
          onSuccess: () => refetch(),
          onError: () => {
            setLocalTasks(prev);
            refetch();
          },
        },
      );
    },
    [localTasks, updateTaskStatus, refetch],
  );

  const handleTaskClick = (taskId: string) => {
    navigate(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
    );
  };

  const handleSelectEpic = (epicId: string) => {
    setSelectedEpicId(epicId);
    setSelectedStoryId(null);
    setTaskFilter("All");
  };

  const handleSelectStory = (storyId: string) => {
    setSelectedStoryId(storyId);
    setSelectedEpicId(null);
    setTaskFilter("All");
  };

  const handleClearFilter = () => {
    setSelectedEpicId(null);
    setSelectedStoryId(null);
    setTaskFilter("All");
  };

  const getFilterLabel = () => {
    if (selectedStoryId) {
      const story = data?.project?.epics
        ?.flatMap((e: any) => e.stories)
        .find((s: any) => s._id === selectedStoryId);
      return `Đang hiển thị công nợ trong story: ${story?.title}`;
    }
    if (selectedEpicId) {
      const epic = data?.project?.epics?.find(
        (e: any) => e._id === selectedEpicId,
      );
      return `Đang hiển thị công nợ trong epic: ${epic?.title}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  if (!data?.project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-2xl font-bold text-muted-foreground">
          Không tìm thấy dự án
        </div>
        <Button onClick={() => navigate(-1)}>Quay lại</Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />

        <div className="relative px-6 py-8 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <ProjectHeader
              project={data.project}
              onCreateTask={() => setIsCreateTask(true)}
            />
            <ProjectStatsGrid
              tasks={localTasks}
              taskCounts={taskCounts}
              epicStats={epicStats}
              projectProgress={projectProgress}
              members={data.project.members}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TaskToolbar
           tasks={filteredTasks}
          epics={data.project.epics}
          selectedEpicId={selectedEpicId}
          selectedStoryId={selectedStoryId}
          taskFilter={taskFilter}
          viewMode={viewMode}
          onSelectEpic={handleSelectEpic}
          onSelectStory={handleSelectStory}
          onClearFilter={handleClearFilter}
          onTaskFilterChange={setTaskFilter}
          onViewModeChange={setViewMode}
          getFilterLabel={getFilterLabel}
        />

        {viewMode === "board" ? (
          <TaskBoardView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <TaskListView
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onCreateTask={() => setIsCreateTask(true)}
          />
        )}
      </div>

      <CreateTaskDialog
        open={isCreateTask}
        onOpenChange={setIsCreateTask}
        projectId={projectId!}
        projectMembers={data.project.members as any}
      />
    </div>
  );
};

export default ProjectDetails;