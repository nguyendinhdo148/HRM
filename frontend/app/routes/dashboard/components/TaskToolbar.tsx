import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { useMemo } from "react";
import {
  FolderTree,
  BookOpen,
  Filter,
  X,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";

interface TaskToolbarProps {
  tasks: Task[]; 
  epics?: any[];
  selectedEpicId: string | null;
  selectedStoryId: string | null;
  taskFilter: TaskStatus | "All";
  viewMode: "board" | "list";
  onSelectEpic: (epicId: string) => void;
  onSelectStory: (storyId: string) => void;
  onClearFilter: () => void;
  onTaskFilterChange: (filter: TaskStatus | "All") => void;
  onViewModeChange: (mode: "board" | "list") => void;
  getFilterLabel: () => string | undefined;
}

export const TaskToolbar = ({
  tasks,
  epics,
  selectedEpicId,
  selectedStoryId,
  taskFilter,
  viewMode,
  onSelectEpic,
  onSelectStory,
  onClearFilter,
  onTaskFilterChange,
  onViewModeChange,
  getFilterLabel,
}: TaskToolbarProps) => {

  // THUẬT TOÁN TÍNH TỔNG TIỀN THÔNG MINH
  const { totalRemaining, totalPaid } = useMemo(() => {
    let remaining = 0;
    let paid = 0;

    tasks.forEach((task) => {
      const taskDebt = Number(task.title) || 0;

      if (task.status === "Done") {
        // NẾU ĐÃ HOÀN THÀNH: Tự động cộng full 100% tiền nợ vào "Đã thu"
        paid += taskDebt;
      } else {
        // NẾU CHƯA HOÀN THÀNH: Tính theo số tiền thực tế đã tick
        const taskPaid = (task.subtasks || []).reduce(
          (sum, sub) => (sub.completed ? sum + (Number(sub.title) || 0) : sum),
          0
        );

        paid += taskPaid;
        // Cần thu = Tổng nợ - Đã trả
        remaining += (taskDebt - taskPaid);
      }
    });

    return { totalRemaining: remaining, totalPaid: paid };
  }, [tasks]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* BỘ LỌC BÊN TRÁI */}
        <div className="flex items-center gap-2 flex-wrap">
          {epics && epics.length > 0 && (
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-600"
              >
                <FolderTree className="w-4 h-4" />
                {selectedEpicId || selectedStoryId ? "Đã lọc" : "Lọc theo Epic"}
                {(selectedEpicId || selectedStoryId) && (
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearFilter();
                    }}
                  />
                )}
              </Button>
              <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-100 hidden group-hover:block hover:block z-20">
                <div className="p-2">
                  <button
                    onClick={onClearFilter}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Tất cả công nợ</span>
                  </button>
                  {epics.map((epic: any) => (
                    <div key={epic._id} className="relative">
                      <button
                        onClick={() => onSelectEpic(epic._id)}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm rounded-lg flex items-center gap-2",
                          selectedEpicId === epic._id
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-slate-50",
                        )}
                      >
                        <FolderTree className="w-4 h-4 text-purple-500" />
                        <span className="flex-1">{epic.title}</span>
                        <span className="text-xs text-slate-400">
                          {epic.stories?.length || 0}
                        </span>
                      </button>
                      {epic.stories?.length > 0 &&
                        selectedEpicId === epic._id && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-slate-100 pl-2">
                            {epic.stories.map((story: any) => (
                              <button
                                key={story._id}
                                onClick={() => onSelectStory(story._id)}
                                className={cn(
                                  "w-full text-left px-3 py-1.5 text-xs rounded-lg flex items-center gap-2",
                                  selectedStoryId === story._id
                                    ? "bg-green-50 text-green-700"
                                    : "hover:bg-slate-50",
                                )}
                              >
                                <BookOpen className="w-3 h-3 text-green-500" />
                                <span className="truncate">{story.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(["All", "To do", "In Progress", "Done"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => onTaskFilterChange(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    taskFilter === status
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {status === "All"
                    ? "Tất cả"
                    : status === "To do"
                    ? "To do"
                    : status === "In Progress"
                    ? "Trả một phần"
                    : "Hoàn thành"}
                </button>
              ),
            )}
          </div>
        </div>

        {/* THỐNG KÊ TIỀN VÀ VIEW MODE BÊN PHẢI */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          
          {/* BẢNG TỔNG KẾT TIỀN */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 w-full sm:w-auto justify-between">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-slate-500">Đã thu</span>
              <span className="text-sm md:text-base font-bold text-green-600">
                {totalPaid.toLocaleString("vi-VN")} ₫
              </span>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase font-bold text-slate-500">Cần thu</span>
              <span className="text-sm md:text-base font-bold text-destructive">
                {totalRemaining.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>

          {/* VIEW MODE TOGGLES */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 self-end sm:self-auto">
            <button
              onClick={() => onViewModeChange("board")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "board"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500",
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-500",
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {(selectedEpicId || selectedStoryId) && (
        <div className="mt-3 p-2.5 bg-blue-50 rounded-lg flex items-center justify-between border border-blue-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Filter className="w-4 h-4" />
            <span>{getFilterLabel()}</span>
          </div>
          <button
            onClick={onClearFilter}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};