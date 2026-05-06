import { BackButton } from "@/components/workspace/back-button";
import { Button } from "@/components/ui/button";
import { FolderTree, Plus } from "lucide-react";
import type { Project } from "@/types";

interface ProjectHeaderProps {
  project: Project & { epics?: any[] };
  onCreateTask: () => void;
}

export const ProjectHeader = ({
  project,
  onCreateTask,
}: ProjectHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FolderTree className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-slate-500 text-sm mt-0.5 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={onCreateTask}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tạo công nợ
      </Button>
    </div>
  );
};