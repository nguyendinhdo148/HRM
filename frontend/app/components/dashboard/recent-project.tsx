import type { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getProjectProgress, getTaskStatusColor } from "@/lib";
import { Link, useSearchParams } from "react-router";
import { cn } from "@/lib/utils";
import { Progress } from "../ui/progress";
import { ArrowRight } from "lucide-react";

export const RecentProjects = ({ data }: { data: Project[] }) => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-center text-sm text-muted-foreground">
              No projects yet. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((project) => {
              const projectProgress = getProjectProgress(project.tasks);

              return (
                <Link
                  to={`/workspaces/${workspaceId}/projects/${project._id}`}
                  key={project._id}
                  className="block border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {project.description}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap flex-shrink-0",
                        getTaskStatusColor(project.status),
                      )}
                    >
                      {project.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {projectProgress}%
                      </span>
                    </div>
                    <Progress value={projectProgress} className="h-2" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
