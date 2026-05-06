import type { Project } from "@/types";
import { Link } from "react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "@/lib/utils";
import { getTaskStatusColor } from "@/lib";
import { Progress } from "../ui/progress";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  progress: number;
  workspaceId: string;
}

export const ProjectCard = ({
  project,
  progress,
  workspaceId,
}: ProjectCardProps) => {
  // Logic kiểm tra xem tiến độ đã đạt 100% chưa
  const isFullyPaid = progress >= 100;

  return (
    <Link to={`/workspaces/${workspaceId}/projects/${project._id}`}>
      <Card 
        className={cn(
          "transition-all duration-300 hover:shadow-md hover:-translate-y-1",
          isFullyPaid ? "border-emerald-200 bg-emerald-50/10" : "" // Viền xanh nhẹ nếu đã xong
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(isFullyPaid && "text-emerald-700")}>
              {project.title}
            </CardTitle>
            <span
              className={cn(
                "text-xs rounded-full px-2.5 py-1 font-medium",
                // Nếu 100% thì ép màu Badge sang xanh lá, ngược lại dùng màu status mặc định
                isFullyPaid ? "bg-emerald-100 text-emerald-700" : getTaskStatusColor(project.status),
              )}
            >
              {isFullyPaid ? "Đã xong" : project.status}
            </span>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || "Không có ghi chú"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              {/* CHỖ NÀY: Thay đổi chữ dựa vào tiến độ */}
              <div className="flex justify-between text-xs font-medium">
                <span className={isFullyPaid ? "text-emerald-600 flex items-center gap-1" : "text-slate-600"}>
                  {isFullyPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {isFullyPaid ? "Đã hoàn trả xong" : "Đã hoàn trả"}
                </span>
                <span className={isFullyPaid ? "text-emerald-600 font-bold" : "text-slate-600"}>
                  {progress}%
                </span>
              </div>

              {/* Thay đổi màu thanh progress (Tailwind target inner div của component shadcn) */}
              <Progress 
                value={progress} 
                className={cn("h-2", isFullyPaid && "[&>div]:bg-emerald-500")} 
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center text-sm gap-1.5 text-muted-foreground font-medium">
                <span className="text-slate-800">{project.tasks.length}</span>
                <span>Hoá đơn</span>
              </div>

              {project.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-md">
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                  <span>{format(project.dueDate, "dd/MM/yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};