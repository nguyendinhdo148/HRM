import type { StatsCardProps } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  ListTodo,
  Circle,
  Zap,
  ChartNoAxesColumn,
} from "lucide-react";

export const StatsCard = ({ data }: { data: StatsCardProps }) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-50 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Projects
          </CardTitle>
          <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-blue-900">
            {data.totalProjects}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-blue-600">
              {data.totalProjectsInProgress}
            </span>{" "}
            in progress
          </p>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-green-50 to-green-50 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Total Tasks
          </CardTitle>
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-green-900">
            {data.totalTasks}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-green-600">
              {data.totalTaskCompleted}
            </span>{" "}
            completed
          </p>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-50 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            To do
          </CardTitle>
          <ListTodo className="h-5 w-5 text-amber-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-amber-900">
            {data.totalTaskToDo}
          </div>
          <p className="text-xs text-muted-foreground">Waiting to be started</p>
        </CardContent>
      </Card>
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-50 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            In Progress
          </CardTitle>
          <ChartNoAxesColumn className="h-5 w-5 text-purple-500 flex-shrink-0" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-3xl font-bold text-purple-900">
            {data.totalTaskInProgress}
          </div>
          <p className="text-xs text-muted-foreground">
            Currently being worked on
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
