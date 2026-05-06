import type { SubTask } from "@/types";
import { add, sub } from "date-fns";
import { Check } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  useAddSubTaskMutation,
  useUpdateSubTaskMutation,
} from "@/hooks/use-task";
import { toast } from "sonner";

export const SubTasksDetails = ({
  subTasks,
  taskId,
}: {
  subTasks: SubTask[];
  taskId: string;
}) => {
  const [newSubTask, setNewSubTask] = useState("");
  const { mutate: addSubTask, isPending } = useAddSubTaskMutation();
  const { mutate: updateSubTask, isPending: isUpdating } =
    useUpdateSubTaskMutation();

  const handleToggleTask = (subTaskId: string, checked: boolean) => {
    updateSubTask(
      { taskId, subTaskId, completed: checked },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật trạng thái khoản trả");
        },
        onError: (error: any) => {
          const errorMessage = error.response.data.message;
          toast.error(errorMessage);
          console.log(error);
        },
      },
    );
  };

  const handldeAddSubTask = () => {
    addSubTask(
      { taskId, title: newSubTask },
      {
        onSuccess: () => {
          setNewSubTask("");
          toast.success("Đã thêm khoản trả thành công");
        },
        onError: (error: any) => {
          const errorMessage = error.response.data.message;
          toast.error(errorMessage);
          console.log(error);
        },
      },
    );
  };
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-0">
        Số tiền đã trả
      </h3>

      <div className="mt-4 space-y-2 mb-4">
        {subTasks.length > 0 ? (
          subTasks.map((subTask) => (
            <div key={subTask._id} className="flex items-center space-x-2">
              <Checkbox
                id={subTask._id}
                checked={subTask.completed}
                onCheckedChange={(checked) =>
                  handleToggleTask(subTask._id, !!checked)
                }
                disabled={isUpdating}
              />

              <label
                className={cn(
                  "text-sm font-medium",
                  subTask.completed ? "line-through text-muted-foreground" : "",
                )}
              >
                {Number(subTask.title).toLocaleString("vi-VN")} ₫
              </label>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">Chưa có khoản trả nào</div>
        )}
      </div>

      <div className="flex">
        <Input
          type="number"
          value={newSubTask}
          onChange={(e) => setNewSubTask(e.target.value)}
          placeholder="Nhập số tiền đã trả..."
          className="mr-2"
          disabled={isPending}
        />

        <Button
          onClick={handldeAddSubTask}
          disabled={isPending || newSubTask.length === 0}
        >
          Thêm
        </Button>
      </div>
    </div>
  );
};