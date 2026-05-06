import type { Task } from "@/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { format } from "date-fns";

export const UpcomingTasks = ({ data }: { data: Task[] }) => {
  const [searchParams] = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
        <CardDescription className="text-xs">
          Tasks that need your attention
        </CardDescription>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-center text-sm text-muted-foreground">
              No upcoming tasks yet. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((task) => (
              <Link
                to={`/workspaces/${workspaceId}/projects/${task.project}/tasks/${task._id}`}
                key={task._id}
                className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
              >
                <div
                  className={cn(
                    "mt-1 rounded-full p-1.5 flex-shrink-0 transition-colors",
                    task.priority === "High" && "bg-red-100 text-red-600",
                    task.priority === "Medium" && "bg-amber-100 text-amber-600",
                    task.priority === "Low" && "bg-gray-100 text-gray-600",
                  )}
                >
                  {task.status === "Done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-md",
                        task.priority === "High" && "bg-red-50 text-red-700",
                        task.priority === "Medium" &&
                          "bg-amber-50 text-amber-700",
                        task.priority === "Low" && "bg-gray-50 text-gray-700",
                      )}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {task.status}
                    </span>
                    {task.dueDate && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.dueDate), "MMM dd")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
