import { useNavigate, useParams } from "react-router";
import { useAchievedTaskMutation, useDeleteTaskMutation, useTaskByIdQuery, useWatchTaskMutation } from "@/hooks/use-task";
import type { Project, Task } from "@/types";
import { Loader } from "@/components/loader";
import { useAuth } from "@/provider/auth-context";
import { BackButton } from "@/components/workspace/back-button";
import { Eye, EyeOff, FolderTree, BookOpen, ChevronRight, Wallet, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskTitle } from "@/components/task/task-title";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { TaskStatusSelector } from "@/components/task/task-status-selector";
import { TaskDescription } from "@/components/task/task-description";
import { TaskAssigneesSelector } from "@/components/task/task-assignees-selectort";
import { TaskPrioritySelector } from "@/components/task/task-priority-selector";
import { SubTasksDetails } from "@/components/task/sub-task";
import { Watchers } from "@/components/task/watchers";
import { TaskActivity } from "@/components/task/task-activity";
import { CommentSection } from "@/components/task/comment-section";
import { toast } from "sonner";
import { Link } from "react-router";

const TaskDetails = () => {
    const { user } = useAuth(); 
    const { taskId , projectId, workspaceId } = useParams<{ 
        taskId: string, 
        projectId: string, 
        workspaceId: string 
    }>();
    const navigate = useNavigate();

    const { data, isLoading} = useTaskByIdQuery(taskId!) as {
        data: {
            task: Task & { story?: any; epic?: any };
            project: Project;
        };
        isLoading: boolean;
    };

    const {mutate: watchTask, isPending: isWatching} = useWatchTaskMutation();
    const {mutate: achievedTask, isPending: isAchieved} = useAchievedTaskMutation();
    const {mutate: deleteTask, isPending: isDeleting} = useDeleteTaskMutation();

    if (isLoading) {
        return (    
            <div>
                <Loader />
            </div>
        );
    }

    if (!data) {
        return (
            <div className = "flex items-center justify-center h-screen"> 
                <div className = "text-2xl font-bold">Không tìm thấy công nợ</div>
            </div>
        );
    }

    const { task, project } = data;

    const isUserWatching = task.watchers.some(
        (watcher) => watcher._id.toString() === user?._id.toString()
    );
    
    // THUẬT TOÁN TÍNH TIỀN TỰ ĐỘNG
    const totalDebt = Number(task.title) || 0;
    const totalPaid = task.subtasks.reduce((sum, sub) => {
        // Chỉ cộng những khoản trả đã được tick hoàn thành (completed: true)
        return sub.completed ? sum + (Number(sub.title) || 0) : sum;
    }, 0);
    const remainingDebt = totalDebt - totalPaid;

    const handleWatchTask = () => {
        watchTask({ taskId: task._id }, {
            onSuccess: () => {
                toast.success(isUserWatching ? "Đã ngừng theo dõi công nợ" : "Đã bắt đầu theo dõi công nợ");
            },
            onError: () => {
                toast.error("Lỗi khi cập nhật trạng thái theo dõi");
            }
        });
    }

    const handleAchievedTask = () => {
        achievedTask({ taskId: task._id }, {
            onSuccess: () => {
                toast.success("Đã cập nhật trạng thái lưu trữ");
            },
            onError: () => {
                toast.error("Lỗi khi lưu trữ công nợ");
            }
        });
    }

    const handleDeleteTask = () => {
        deleteTask(
            { taskId: task._id },
            {
                onSuccess: () => {
                    toast.success("Đã xóa công nợ thành công");
                    navigate(`/workspaces/${workspaceId}/projects/${projectId}`);
                },
                onError: () => {
                    toast.error("Lỗi khi xóa công nợ");
                },
            }
        );
    }

    return (
        <div className="container mx-auto p-0 py-4 md:p-4">
            {/* Navigation Breadcrumb */}
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Link to={`/workspaces/${workspaceId}`} className="hover:text-foreground">
                    Công nợ
                </Link>
                <ChevronRight className="w-4 h-4" />
                <Link to={`/workspaces/${workspaceId}/projects/${projectId}`} className="hover:text-foreground">
                    {project.title}
                </Link>
                {task.story && (
                    <>
                        <ChevronRight className="w-4 h-4" />
                        <Link 
                            to={`/workspaces/${workspaceId}/projects/${projectId}/backlog?story=${task.story._id}`} 
                            className="hover:text-foreground flex items-center gap-1"
                        >
                            <BookOpen className="w-3 h-3" />
                            {task.story.title}
                        </Link>
                        {task.story.epic && (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                <Link 
                                    to={`/workspaces/${workspaceId}/projects/${projectId}/backlog?epic=${task.story.epic._id}`} 
                                    className="hover:text-foreground flex items-center gap-1"
                                >
                                    <FolderTree className="w-3 h-3" />
                                    {task.story.epic.title}
                                </Link>
                            </>
                        )}
                    </>
                )}
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                <div className="flex flex-col md:flex-row md:items-center">
                    <BackButton />
                    
                    {/* KHU VỰC HIỂN THỊ TỔNG KẾT TIỀN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 ml-2">
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase font-semibold">Tổng nợ</span>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                                {totalDebt.toLocaleString("vi-VN")} ₫
                            </h1>
                        </div>

                        {totalPaid > 0 && (
                            <>
                                <div className="hidden md:block h-8 border-l border-slate-300"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                        <Wallet className="w-3 h-3 text-green-600"/> Đã trả
                                    </span>
                                    <h1 className="text-xl md:text-2xl font-bold text-green-600">
                                        {totalPaid.toLocaleString("vi-VN")} ₫
                                    </h1>
                                </div>
                            </>
                        )}

                        <div className="hidden md:block h-8 border-l border-slate-300"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-destructive"/> Còn lại
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-destructive">
                                {remainingDebt.toLocaleString("vi-VN")} ₫
                            </h1>
                        </div>
                    </div>

                    {task.isArchived && (
                        <Badge className="ml-4 mt-2 md:mt-0" variant={"outline"}>
                            Đã lưu trữ
                        </Badge>
                    )}
                </div>

                <div className="flex space-x-2 mt-4 md:mt-0">
                    <Button 
                        variant={"outline"} size="sm" 
                        onClick={handleWatchTask} 
                        disabled={isWatching}
                        className="w-fit">
                            
                        {isUserWatching ? (
                            <>
                                <EyeOff className="mr-2 size-4" />
                                Ngừng theo dõi
                            </>
                        ) : (
                            <> 
                                <Eye className="mr-2 size-4" />
                                Theo dõi
                            </>
                        )}
                    </Button>

                </div>
            </div>    

            {/* Epic & Story Info Cards */}
            {task.story && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Epic Card */}
                    {task.story.epic && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                                <FolderTree className="w-5 h-5 text-purple-600" />
                                <span className="text-xs font-medium text-purple-600 uppercase">Epic</span>
                            </div>
                            <Link 
                                to={`/workspaces/${workspaceId}/projects/${projectId}/backlog?epic=${task.story.epic._id}`}
                                className="font-semibold text-gray-800 hover:text-purple-600 transition-colors"
                            >
                                {task.story.epic.title}
                            </Link>
                            {task.story.epic.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {task.story.epic.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                                
                                {task.story.epic.priority && (
                                    <Badge variant={
                                        task.story.epic.priority === "High" ? "destructive" : 
                                        task.story.epic.priority === "Medium" ? "default" : "outline"
                                    } className="text-xs">
                                        {task.story.epic.priority === "High" ? "Cao" : task.story.epic.priority === "Medium" ? "Trung bình" : "Thấp"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Story Card */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-5 h-5 text-green-600" />
                            <span className="text-xs font-medium text-green-600 uppercase">Story</span>
                        </div>
                        <Link 
                            to={`/workspaces/${workspaceId}/projects/${projectId}/backlog?story=${task.story._id}`}
                            className="font-semibold text-gray-800 hover:text-green-600 transition-colors"
                        >
                            {task.story.title}
                        </Link>
                        {task.story.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {task.story.description}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            
                            {task.story.priority && (
                                <Badge variant={
                                    task.story.priority === "High" ? "destructive" : 
                                    task.story.priority === "Medium" ? "default" : "outline"
                                } className="text-xs">
                                    {task.story.priority === "High" ? "Cao" : task.story.priority === "Medium" ? "Trung bình" : "Thấp"}
                                </Badge>
                            )}
                            {task.story.storyPoints > 0 && (
                                <Badge variant="outline" className="text-xs bg-white">
                                    {task.story.storyPoints} điểm
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                            <div>
                                <Badge variant={
                                    task.priority === "High" ? "destructive" : 
                                    task.priority === "Medium" ? "default" : "outline"
                                } className="mb-2 capitalize">
                                    Ưu tiên {task.priority === "High" ? "Cao" : task.priority === "Medium" ? "Trung bình" : "Thấp"}
                                </Badge>
                                
                                <TaskTitle title={task.title} taskId={task._id}/>

                                <div className="text-sm md:text-base text-muted-foreground mt-2">
                                    Tạo lúc:{" "}
                                    {formatDistanceToNow(new Date(task.createdAt), 
                                    { addSuffix: true, locale: vi })}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 md:mt-0">
                                <TaskStatusSelector status={task.status} taskId={task._id} />
                                <Button
                                    variant={"destructive"}
                                    size="sm"
                                    onClick={handleDeleteTask}
                                    className="hidden md:block"
                                    disabled={isDeleting}
                                >
                                    Xóa công nợ
                                </Button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                Ghi chú
                            </h3>
                            <TaskDescription description={task.description || ""} taskId={task._id} />
                        </div>

                        <TaskAssigneesSelector
                            task={task}
                            assignees={task.assignees}
                            projectMembers={project.members as any}
                        />

                        <TaskPrioritySelector priority={task.priority} taskId={task._id} />
                    
                        <SubTasksDetails subTasks={task.subtasks} taskId={task._id} />
                    </div>

                    <CommentSection taskId={task._id} members={project.members as any} />                
                </div>

                <div className="w-full">
                    <Watchers watchers={task.watchers || []} />
                    <TaskActivity resourceId={task._id} /> 
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;