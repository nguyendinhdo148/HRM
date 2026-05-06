import type {
  StatsCardProps,
  TaskTrendsData,
  ProjectStatusData,
  TaskPriorityData,
  WorkspaceProductivityData,
} from "@/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { ChartBarBig, ChartLine, PieChart as PieChartIcon } from "lucide-react";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

interface StatisticsChartsProps {
  stat: StatsCardProps;
  taskTrendsData: TaskTrendsData[];
  projectStatusData: ProjectStatusData[];
  taskPriorityData: TaskPriorityData[];
  workspaceProductivityData: WorkspaceProductivityData[];
}

export const StatisticsCharts = ({
  taskTrendsData,
  projectStatusData,
  taskPriorityData,
  workspaceProductivityData,
}: StatisticsChartsProps) => {
  return (
    <div className="space-y-6 mb-8">
      {/* Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* Task Trends */}
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Task Trends
              </CardTitle>
              <CardDescription className="text-xs">
                Daily task status changes
              </CardDescription>
            </div>
            <ChartLine className="size-5 text-blue-500" />
          </CardHeader>

          <CardContent>
            <ChartContainer
              className="h-[360px] w-full"
              config={{
                completed: { color: "#10b981" },
                inProgress: { color: "#3b82f6" },
                todo: { color: "#6b7280" },
              }}
            >
              <LineChart
                data={taskTrendsData}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />

                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "dataMax + 2"]}
                />

                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <ChartTooltip content={<ChartTooltipContent />} />

                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="inProgress"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="todo"
                  stroke="#6b7280"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />

                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Project Status
              </CardTitle>
              <CardDescription className="text-xs">
                Status breakdown
              </CardDescription>
            </div>

            <PieChartIcon className="size-5 text-green-500" />
          </CardHeader>

          <CardContent>
            <ChartContainer
              className="h-[360px] w-full"
              config={{
                Completed: { color: "#10b981" },
                "In Progress": { color: "#3b82f6" },
                Planning: { color: "#f59e0b" },
              }}
            >
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>

                <ChartTooltip />

                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        {/* Task Priority */}
        <Card className="border-0 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Task Priority
            </CardTitle>
            <CardDescription className="text-xs">
              Priority distribution
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ChartContainer
              className="h-[360px] w-full"
              config={{
                High: { color: "#ef4444" },
                Medium: { color: "#f59e0b" },
                Low: { color: "#6b7280" },
              }}
            >
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <Pie
                  data={taskPriorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {taskPriorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>

                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                />

                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Workspace Productivity */}
        <Card className="border-0 shadow-sm h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Workspace Productivity
              </CardTitle>
              <CardDescription className="text-xs">
                Task completion by project
              </CardDescription>
            </div>

            <ChartBarBig className="h-5 w-5 text-orange-500" />
          </CardHeader>

          <CardContent>
            <ChartContainer
              className="h-[360px] w-full"
              config={{
                completed: { color: "#3b82f6" },
                total: { color: "#111827" },
              }}
            >
              <BarChart
                data={workspaceProductivityData}
                barGap={8}
                barSize={24}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />

                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />

                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <ChartTooltip />

                <Bar
                  dataKey="total"
                  fill="#111827"
                  radius={[4, 4, 0, 0]}
                  name="Total Tasks"
                />

                <Bar
                  dataKey="completed"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Completed Tasks"
                />

                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
