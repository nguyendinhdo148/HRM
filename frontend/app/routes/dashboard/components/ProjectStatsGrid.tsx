import { FolderTree, TrendingUp, Target, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import type { Task } from "@/types";

interface ProjectStatsGridProps {
  tasks: Task[];
  taskCounts: { todo: number; inProgress: number; done: number };
  epicStats: { totalEpics: number; totalStories: number };
  projectProgress: number;
  members?: any[];
}

export const ProjectStatsGrid = ({
  tasks,
  taskCounts,
  projectProgress,
  members,
}: ProjectStatsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <StatCard
        icon={<TrendingUp className="w-5 h-5" />}
        title="Tiến độ tổng thể"
        value={`${projectProgress}%`}
        color="blue"
        progress={projectProgress}
      />
      <StatCard
        icon={<Target className="w-5 h-5" />}
        title="Tổng công nợ"
        value={tasks.length.toString()}
        color="purple"
        badge={`${taskCounts.todo} cần xử lý · ${taskCounts.inProgress} đang xử lý · ${taskCounts.done} hoàn thành`}
      />
      <StatCard
        icon={<Users className="w-5 h-5" />}
        title="Người theo dõi công nợ"
        value={(members?.length || 0).toString()}
        color="orange"
        avatars={members}
      />
    </div>
  );
};